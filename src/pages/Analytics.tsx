import { useState } from 'react';
import { BarChart3, Calendar, Download, Plus, Trash2, TrendingUp, FileText, FileJson, FileSpreadsheet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from 'recharts';
import { useI18n } from '@/i18n';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuthStore } from '@/store';
import { SkillTagInput } from '@/components/ui/SkillTagInput';
import { Modal } from '@/components/ui/Modal';
import { LoadingFallback, EmptyState } from '@/components/ui/ErrorBoundary';
import { formatDate, getDomainColor } from '@/lib/utils';
import { exportCSV, exportJSON, exportPDF, exportProfessionalReport } from '@/lib/exportUtils';
import { MAX_CUSTOM_TELEMETRY_TRACKS, METRIC_TYPES } from '@/lib/constants';
import type { SkillTag, MetricType } from '@/types/database';
import { getErrorMessage } from '@/lib/errors';

const CHART_COLORS = ['#C9A84C', '#3B82F6', '#EC4899', '#22C55E', '#F59E0B', '#8B5CF6', '#06B6D4', '#6366F1'];

export default function Analytics() {
  const { t } = useI18n();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]!);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]!);

  const { trustHistory, skillBreakdown, hourlyBalance, summaryMetrics, telemetryTracks, loading, hasData, createTrack, deleteTrack } = useAnalytics(startDate, endDate);
  const { profile } = useAuthStore();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);

  const [showTrackForm, setShowTrackForm] = useState(false);
  const [trackName, setTrackName] = useState('');
  const [trackTags, setTrackTags] = useState<SkillTag[]>([]);
  const [trackMetric, setTrackMetric] = useState<MetricType>('trade_frequency');
  const [trackError, setTrackError] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

  async function handleCreateTrack() {
    if (!trackName || trackTags.length === 0) { setTrackError('Name and at least one skill tag required.'); return; }
    setTrackLoading(true); setTrackError('');
    try { await createTrack(trackName, trackTags, trackMetric); setShowTrackForm(false); setTrackName(''); setTrackTags([]); } catch (err) { setTrackError(getErrorMessage(err)); } finally { setTrackLoading(false); }
  }

  const trustChartData = trustHistory.map((h) => ({
    date: formatDate(h.created_at),
    score: h.new_score,
  }));

  function getExportData() {
    return {
      dateRange: { start: startDate, end: endDate },
      summary: summaryMetrics,
      trustHistory: trustHistory.map((h) => ({ date: h.created_at, score: h.new_score, delta: h.delta, event: h.event_type })),
      skillBreakdown: skillBreakdown.map((s) => ({ domain: s.domain, count: s.count })),
      hourlyBalance,
    };
  }

  function handleExportCSV() {
    const data = getExportData();
    const rows = data.trustHistory.length > 0
      ? data.trustHistory.map((h) => ({ Date: h.date, Score: h.score, Delta: h.delta, Event: h.event }))
      : [{ Notice: 'No data available' }];
    exportCSV(rows, `collabos-analytics-${startDate}-${endDate}`);
    setShowExportMenu(false);
  }

  function handleExportJSON() {
    exportJSON(getExportData(), `collabos-analytics-${startDate}-${endDate}`);
    setShowExportMenu(false);
  }

  async function handleExportPDF() {
    const sections = [
      { heading: 'Date Range', content: `${startDate} to ${endDate}` },
      { heading: 'Summary', content: `Trades Completed: ${summaryMetrics.tradesCompleted}\nProofs Added: ${summaryMetrics.proofsAdded}\nEndorsements: ${summaryMetrics.endorsements}\nTrust Score: ${summaryMetrics.trustScore}` },
      ...(trustHistory.length > 0 ? [{ heading: 'Trust Score History', content: trustHistory.map((h) => `${formatDate(h.created_at)}: ${h.new_score} (${h.delta >= 0 ? '+' : ''}${h.delta})`).join('\n') }] : []),
      ...(skillBreakdown.length > 0 ? [{ heading: 'Skill Breakdown', content: skillBreakdown.map((s) => `${s.domain}: ${s.count}`).join('\n') }] : []),
    ];
    await exportPDF('CollabOS Analytics Report', sections, `collabos-analytics-${startDate}-${endDate}`);
    setShowExportMenu(false);
  }

  async function handleProfessionalReport() {
    if (!hasData) return;
    setExportingReport(true);
    try {
      const chartElements = [
        { id: 'chart-trust-trend', title: 'Trust Score Trend' },
        { id: 'chart-skill-breakdown', title: 'Skill Category Breakdown' },
        { id: 'chart-hourly-balance', title: 'Hourly Exchange Balance' },
        ...telemetryTracks.map((t) => ({ id: `chart-track-${t.id}`, title: t.track_name })),
      ];
      await exportProfessionalReport({
        mononym: profile?.mononym ?? 'User',
        dateRange: `${startDate} — ${endDate}`,
        trustScore: summaryMetrics.trustScore,
        chartElements,
        summaryMetrics: [
          { label: 'Trades Completed', value: summaryMetrics.tradesCompleted },
          { label: 'Proofs Added', value: summaryMetrics.proofsAdded },
          { label: 'Endorsements', value: summaryMetrics.endorsements },
          { label: 'Trust Score', value: summaryMetrics.trustScore },
        ],
        filename: `collabos-report-${startDate}-${endDate}`,
      });
    } finally {
      setExportingReport(false);
    }
    setShowExportMenu(false);
  }

  if (loading) return <LoadingFallback />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>{t('analytics.title')}</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
            <input type="date" className="neu-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: 140, fontSize: '0.8rem' }} />
            <span style={{ color: 'var(--text-muted)' }}>—</span>
            <input type="date" className="neu-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: 140, fontSize: '0.8rem' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <button className="neu-btn neu-btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => setShowExportMenu(!showExportMenu)}>
              {exportingReport ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Download size={12} />} Export
            </button>
            {showExportMenu && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--surface-2)', border: '1px solid var(--surface-2-border)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-2)', zIndex: 50, minWidth: 200, padding: '0.25rem 0' }}>
                <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', width: '100%', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left' }}>
                  <FileSpreadsheet size={14} /> Export CSV
                </button>
                <button onClick={handleExportJSON} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', width: '100%', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left' }}>
                  <FileJson size={14} /> Export JSON
                </button>
                <button onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', width: '100%', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left' }}>
                  <FileText size={14} /> Export PDF
                </button>
                <hr style={{ border: 'none', borderTop: '1px solid var(--surface-2-border)', margin: '0.25rem 0' }} />
                <button onClick={handleProfessionalReport} disabled={!hasData || exportingReport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', width: '100%', background: 'none', border: 'none', color: hasData ? 'var(--accent)' : 'var(--text-muted)', cursor: hasData ? 'pointer' : 'not-allowed', fontSize: '0.8rem', fontWeight: 700, textAlign: 'left' }}>
                  <TrendingUp size={14} /> Professional Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!hasData ? (
        <EmptyState icon={<BarChart3 size={32} />} title={t('analytics.title')} description={t('analytics.noData')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Trust Score Trend */}
          {trustChartData.length > 0 && (
            <div id="chart-trust-trend" className="chart-container">
              <h3>{t('analytics.trustTrend')}</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trustChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-1-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--surface-2-border)', borderRadius: '4px', fontSize: '0.8rem' }} />
                  <Line type="monotone" dataKey="score" stroke="#C9A84C" strokeWidth={2.5} dot={{ fill: '#C9A84C', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Skill Category Breakdown & Hourly Balance */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {skillBreakdown.length > 0 && (
              <div id="chart-skill-breakdown" className="chart-container">
                <h3>{t('analytics.skillBreakdown')}</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={skillBreakdown} dataKey="count" nameKey="domain" cx="50%" cy="50%" outerRadius={100} label={({ domain, percent }: { domain: string; percent: number }) => `${domain} ${(percent * 100).toFixed(0)}%`}>
                      {skillBreakdown.map((entry, i) => (
                        <Cell key={entry.domain} fill={getDomainColor(entry.domain) || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--surface-2-border)', borderRadius: '4px', fontSize: '0.8rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {(hourlyBalance.offered > 0 || hourlyBalance.received > 0) && (
              <div id="chart-hourly-balance" className="chart-container">
                <h3>{t('analytics.hourlyBalance')}</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[{ name: 'Hours', offered: hourlyBalance.offered, received: hourlyBalance.received }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-1-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--surface-2-border)', borderRadius: '4px', fontSize: '0.8rem' }} />
                    <Bar dataKey="offered" fill="#C9A84C" name={t('analytics.hoursOffered')} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="received" fill="#3B82F6" name={t('analytics.hoursReceived')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Summary Metrics */}
          <div className="chart-container">
            <h3>{t('analytics.summary')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
              {[
                { label: t('analytics.summary.trades'), value: summaryMetrics.tradesCompleted },
                { label: t('analytics.summary.proofs'), value: summaryMetrics.proofsAdded },
                { label: t('analytics.summary.endorsements'), value: summaryMetrics.endorsements },
                { label: t('analytics.summary.trustScore'), value: summaryMetrics.trustScore },
              ].map((m) => (
                <div key={m.label} style={{ padding: '1rem', background: 'var(--surface-1)', border: '1px solid var(--surface-1-border)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent)' }}>{m.value}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '0.25rem' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Telemetry Tracks */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{t('analytics.telemetry.title')}</h3>
              <button className="neu-btn neu-btn-secondary" onClick={() => setShowTrackForm(true)} disabled={telemetryTracks.length >= MAX_CUSTOM_TELEMETRY_TRACKS} style={{ fontSize: '0.75rem' }}>
                <Plus size={12} /> {t('analytics.telemetry.add')}
              </button>
            </div>
            {telemetryTracks.length >= MAX_CUSTOM_TELEMETRY_TRACKS && (
              <p style={{ fontSize: '0.75rem', color: 'var(--warning)', marginBottom: '0.75rem' }}>{t('analytics.telemetry.max')}</p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
              {telemetryTracks.map((track) => (
                <div key={track.id} id={`chart-track-${track.id}`} className="chart-container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="truncate-1" title={track.track_name} style={{ flex: 1 }}>
                      <TrendingUp size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      {track.track_name}
                    </h3>
                    <button onClick={() => deleteTrack(track.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {track.skill_tags.map((tag, i) => (
                      <span key={i} className="skill-chip" style={{ fontSize: '0.6rem' }}>
                        {tag.domain} · {tag.label}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: '1rem', textAlign: 'center', padding: '1.5rem 0' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>
                      {track.calculated_value}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.25rem' }}>
                      {track.metric_type.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Track Modal */}
      <Modal isOpen={showTrackForm} onClose={() => setShowTrackForm(false)} title={t('analytics.telemetry.add')}>
        {trackError && <div className="form-error" style={{ marginBottom: '0.75rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)' }}>{trackError}</div>}
        <div className="form-group">
          <label className="form-label">{t('analytics.telemetry.trackName')}</label>
          <input className="neu-input" value={trackName} onChange={(e) => setTrackName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('analytics.telemetry.skillTags')}</label>
          <SkillTagInput value={trackTags} onChange={setTrackTags} maxTags={5} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('analytics.telemetry.metricType')}</label>
          <select className="neu-input" value={trackMetric} onChange={(e) => setTrackMetric(e.target.value as MetricType)}>
            {METRIC_TYPES.map((mt) => <option key={mt.value} value={mt.value}>{mt.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="neu-btn neu-btn-ghost" onClick={() => setShowTrackForm(false)}>{t('common.cancel')}</button>
          <button className="neu-btn neu-btn-primary" onClick={handleCreateTrack} disabled={trackLoading}>
            {trackLoading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : t('analytics.telemetry.save')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
