import { useState } from 'react';
import { AlertTriangle, MessageSquare, Check, Clock } from 'lucide-react';
import { useI18n } from '@/i18n';

import { getStatusColor, formatRelativeTime } from '@/lib/utils';
import { MIN_DISPUTE_REASON_LENGTH } from '@/lib/constants';
import type { Milestone, Dispute } from '@/types/database';
import { getErrorMessage } from '@/lib/errors';

interface DisputePanelProps {
  tradeId: string;
  milestones: Milestone[];
  disputes: Dispute[];
  onOpenDispute: (milestoneId: string, reason: string) => Promise<void>;
  onAddComment: (disputeId: string, content: string) => Promise<void>;
}

export default function DisputePanel({ milestones, disputes, onOpenDispute, onAddComment }: DisputePanelProps) {
  const { t } = useI18n();
  // user removed
  const [selectedMs, setSelectedMs] = useState('');
  const [reason, setReason] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleOpen() {
    if (!selectedMs) { setError('Select a milestone.'); return; }
    if (reason.length < MIN_DISPUTE_REASON_LENGTH) { setError(t('trades.dispute.reasonError')); return; }
    setLoading(true); setError('');
    try { await onOpenDispute(selectedMs, reason); setReason(''); setSelectedMs(''); } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  }

  async function handleComment(disputeId: string) {
    const content = commentInputs[disputeId];
    if (!content?.trim()) return;
    try { await onAddComment(disputeId, content); setCommentInputs((prev) => ({ ...prev, [disputeId]: '' })); } catch { /* handled */ }
  }

  return (
    <div>
      {/* Open Dispute Form */}
      <div className="neu-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={16} style={{ color: 'var(--error)' }} /> {t('trades.dispute.open')}
        </h3>
        {error && <div className="form-error" style={{ marginBottom: '0.75rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
        <div className="form-group">
          <label className="form-label">Milestone</label>
          <select className="neu-input" value={selectedMs} onChange={(e) => setSelectedMs(e.target.value)}>
            <option value="">Select milestone</option>
            {milestones.filter((ms) => ms.status !== 'Completed').map((ms) => (
              <option key={ms.id} value={ms.id}>{ms.title}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t('trades.dispute.reason')}</label>
          <textarea
            className="neu-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            style={{ resize: 'vertical' }}
            minLength={MIN_DISPUTE_REASON_LENGTH}
          />
          <span style={{ fontSize: '0.65rem', color: reason.length < MIN_DISPUTE_REASON_LENGTH ? 'var(--error)' : 'var(--text-muted)' }}>
            {reason.length}/{MIN_DISPUTE_REASON_LENGTH} characters minimum
          </span>
        </div>
        <button className="neu-btn neu-btn-danger" onClick={handleOpen} disabled={loading} style={{ fontSize: '0.8rem' }}>
          {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <><AlertTriangle size={12} /> {t('trades.dispute.submit')}</>}
        </button>
      </div>

      {/* Existing Disputes */}
      {disputes.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>No disputes on this trade.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {disputes.map((dispute) => {
            const milestone = milestones.find((m) => m.id === dispute.milestone_id);
            const isEscalated = dispute.escalated || (dispute.status !== 'Resolved' && (Date.now() - new Date(dispute.opened_at).getTime()) > 7 * 86400000);

            return (
              <div key={dispute.id} className="neu-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Dispute on: {milestone?.title ?? 'Milestone'}</h4>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={10} /> Opened {formatRelativeTime(dispute.opened_at)}
                    </div>
                  </div>
                  <span className={`neu-badge ${getStatusColor(dispute.status)}`} style={{ fontSize: '0.6rem' }}>{dispute.status}</span>
                </div>

                {isEscalated && dispute.status !== 'Resolved' && (
                  <div className="escalation-banner" style={{ padding: '0.625rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                    <AlertTriangle size={14} style={{ color: 'var(--error)' }} />
                    <span style={{ color: 'var(--error)', fontWeight: 700 }}>Under Review — exceeds 7 days</span>
                  </div>
                )}

                <div style={{ padding: '0.75rem', background: 'var(--surface-1)', border: '1px solid var(--surface-1-border)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, overflowWrap: 'anywhere' }}>{dispute.reason}</p>
                </div>

                {/* Resolution */}
                {dispute.status === 'Resolved' && dispute.resolution_note && (
                  <div style={{ padding: '0.75rem', background: 'rgba(34,197,94,0.05)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--success)', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Check size={12} /> {t('trades.dispute.resolution')}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>{dispute.resolution_note}</p>
                  </div>
                )}

                {/* Comment Thread */}
                <div style={{ borderTop: '1px solid var(--surface-1-border)', paddingTop: '0.75rem' }}>
                  <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MessageSquare size={12} /> Comments ({dispute.comments?.length ?? 0})
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', marginBottom: '0.5rem' }}>
                    {(dispute.comments ?? []).map((c) => (
                      <div key={c.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-muted)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
                          {c.profile?.mononym?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.7rem' }}>
                            <strong>{c.profile?.mononym}</strong>
                            <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{formatRelativeTime(c.created_at)}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {dispute.status !== 'Resolved' && (
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <input
                        className="neu-input"
                        value={commentInputs[dispute.id] ?? ''}
                        onChange={(e) => setCommentInputs((prev) => ({ ...prev, [dispute.id]: e.target.value }))}
                        placeholder={t('trades.dispute.comment')}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleComment(dispute.id); }}
                        style={{ fontSize: '0.8rem' }}
                      />
                      <button className="neu-btn neu-btn-ghost" style={{ padding: '0.375rem 0.625rem' }} onClick={() => handleComment(dispute.id)}>
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
