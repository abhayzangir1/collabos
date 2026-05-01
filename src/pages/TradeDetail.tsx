import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Upload, Send, AlertTriangle, Clock, FileText, Shield } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useTradeDetail } from '@/hooks/useTrades';
import { useAuthStore } from '@/store';
import { useRealtime, usePresence } from '@/hooks/useRealtime';
import { LoadingFallback } from '@/components/ui/ErrorBoundary';
import { getStatusColor, formatRelativeTime, formatDate, validateFileUpload } from '@/lib/utils';
import { CHAT_REACTIONS, ALLOWED_FILE_TYPES, MAX_FILE_SIZE_MB, DISPUTE_ESCALATION_DAYS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';

const DisputePanel = lazy(() => import('@/components/trades/DisputePanel'));

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const { user } = useAuthStore();
  const { trade, milestones, evidence, messages, disputes, loading, hasMoreMessages, loadingMore, sendMessage, addReaction, uploadEvidence, openDispute, addDisputeComment, loadMoreMessages, markMilestoneComplete, refetch } = useTradeDetail(id ?? '');
  const [activeTab, setActiveTab] = useState<'milestones' | 'evidence' | 'chat' | 'dispute'>('milestones');
  const [msgInput, setMsgInput] = useState('');
  const [evidenceScope, setEvidenceScope] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Realtime
  const { connectionError, refresh } = useRealtime([
    { channel: `trade-${id}`, table: 'messages', filter: `trade_id=eq.${id}`, event: 'INSERT', onEvent: () => refetch(), enabled: !!id },
    { channel: `trade-ms-${id}`, table: 'milestones', filter: `trade_id=eq.${id}`, onEvent: () => refetch(), enabled: !!id },
  ]);

  const { presenceState } = usePresence(`trade-presence-${id}`, user?.id ?? '', { typing: false });
  const partnerTyping = presenceState.some((p) => p.user_id !== user?.id && p.typing);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const [msLoading, setMsLoading] = useState<string | null>(null);
  const [msError, setMsError] = useState('');

  async function handleMarkComplete(msId: string) {
    setMsLoading(msId); setMsError('');
    try { await markMilestoneComplete(msId); } catch (err) { setMsError(getErrorMessage(err)); } finally { setMsLoading(null); }
  }

  async function handleSendMessage() {
    if (!msgInput.trim()) return;
    setSendingMsg(true);
    try { await sendMessage(msgInput); setMsgInput(''); } finally { setSendingMsg(false); }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !evidenceScope) return;
    const error = validateFileUpload(file, ALLOWED_FILE_TYPES, MAX_FILE_SIZE_MB);
    if (error) { alert(error); return; }
    setUploading(true); setUploadProgress(0);
    const interval = setInterval(() => setUploadProgress((p) => Math.min(p + 15, 90)), 200);
    try { await uploadEvidence(evidenceScope, file); setUploadProgress(100); } finally { clearInterval(interval); setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500); }
  }

  // Escalation check
  const hasEscalation = disputes.some((d) => d.escalated || (d.status !== 'Resolved' && (Date.now() - new Date(d.opened_at).getTime()) > DISPUTE_ESCALATION_DAYS * 86400000));

  if (loading || !trade) return <LoadingFallback />;

  const counterparty = trade.proposer_user_id === user?.id ? trade.recipient : trade.proposer;
  const completedMs = milestones.filter((m) => m.status === 'Completed').length;

  return (
    <div className="page-container">
      {connectionError && (
        <div style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={14} /> Connection error. <button onClick={refresh} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}>Refresh</button>
        </div>
      )}

      {hasEscalation && (
        <div className="escalation-banner" style={{ marginBottom: '1rem' }}>
          <AlertTriangle size={20} style={{ color: 'var(--error)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--error)' }}>{t('trades.dispute.escalation')}</span>
        </div>
      )}

      {/* Trade Header */}
      <div className="neu-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-muted)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--accent)' }}>
          {counterparty?.mononym?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="truncate-1" style={{ fontWeight: 800, fontSize: '1.1rem' }}>{counterparty?.mononym ?? 'Unknown'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{counterparty?.dna_type} · Created {formatDate(trade.created_at)}</div>
        </div>
        <span className={`neu-badge ${getStatusColor(trade.status)}`}>{trade.status}</span>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <Shield size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {t('trades.tradeProgress', { current: completedMs, total: milestones.length })}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(['milestones', 'evidence', 'chat', 'dispute'] as const).map((tab) => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {t(`trades.detail.${tab}`)}
          </button>
        ))}
      </div>

      {/* Milestones Tab */}
      {activeTab === 'milestones' && (
        <div>
          {msError && <div className="form-error" style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)' }}>{msError}</div>}
          <div className="stepper" style={{ marginBottom: '2rem' }}>
            {milestones.map((ms) => (
              <div key={ms.id} className={`stepper-step ${ms.status === 'Completed' ? 'completed' : ms.status === 'In Progress' || ms.status === 'Awaiting Confirmation' ? 'active' : ''}`}>
                <div className="stepper-dot">
                  {ms.status === 'Completed' ? <Check size={14} /> : ms.sequence}
                </div>
                <div className="stepper-label">{ms.title}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {milestones.map((ms) => {
              const hasOpenDispute = disputes.some((d) => d.milestone_id === ms.id && d.status !== 'Resolved');
              return (
                <div key={ms.id} className="neu-card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 className="truncate-1" style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ms.title}</h4>
                    <span className={`neu-badge ${getStatusColor(ms.status)}`} style={{ fontSize: '0.6rem' }}>{ms.status}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{ms.description}</p>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <Clock size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> Due {formatDate(ms.due_date)}
                  </div>
                  {(ms.status === 'In Progress' || ms.status === 'Awaiting Confirmation') && (
                    <button
                      className="neu-btn neu-btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                      onClick={() => handleMarkComplete(ms.id)}
                      disabled={hasOpenDispute || msLoading === ms.id}
                    >
                      {msLoading === ms.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : hasOpenDispute ? <>{t('trades.milestone.blocked')}</> : <><Check size={12} /> {t('trades.milestone.markComplete')}</>}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evidence Tab */}
      {activeTab === 'evidence' && (
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">{t('trades.evidence.scope')}</label>
              <select className="neu-input" value={evidenceScope} onChange={(e) => setEvidenceScope(e.target.value)}>
                <option value="">Select milestone</option>
                {milestones.map((ms) => <option key={ms.id} value={ms.id}>{ms.title}</option>)}
              </select>
            </div>
            <label className="neu-btn neu-btn-secondary" style={{ cursor: 'pointer', position: 'relative' }}>
              <Upload size={14} /> Upload
              <input type="file" onChange={handleFileUpload} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }} disabled={!evidenceScope || uploading} />
            </label>
          </div>
          {uploading && (
            <div className="progress-bar" style={{ marginBottom: '1rem' }}>
              <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {evidence.map((ev) => (
              <div key={ev.id} className="neu-card" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate-1" style={{ fontSize: '0.85rem', fontWeight: 600 }} title={ev.file_name ?? ev.link ?? ''}>{ev.file_name ?? ev.link ?? 'Evidence'}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {ev.profile?.mononym} · {formatRelativeTime(ev.created_at)}
                  </div>
                </div>
                {ev.file_url && <a href={ev.file_url} target="_blank" rel="noopener noreferrer" className="neu-btn neu-btn-ghost" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>View</a>}
              </div>
            ))}
            {evidence.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>No evidence submitted yet.</p>}
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div>
        <div
          style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0', marginBottom: '1rem' }}
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollTop < 40 && hasMoreMessages && !loadingMore) {
              const prevHeight = el.scrollHeight;
              loadMoreMessages().then(() => {
                requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - prevHeight; });
              });
            }
          }}
        >
          {loadingMore && <div style={{ textAlign: 'center', padding: '0.5rem' }}><div className="spinner" style={{ width: 16, height: 16 }} /></div>}
          {hasMoreMessages && !loadingMore && (
            <button className="neu-btn neu-btn-ghost" style={{ fontSize: '0.7rem', alignSelf: 'center', marginBottom: '0.25rem' }} onClick={() => loadMoreMessages()}>
              Load older messages
            </button>
          )}
            {messages.map((msg) => {
              const isMine = msg.user_id === user?.id;
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  <div>
                    <div className={`chat-bubble ${isMine ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                      {msg.content}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      {CHAT_REACTIONS.map((emoji) => {
                        const users = msg.reactions[emoji] ?? [];
                        return (
                          <button key={emoji} onClick={() => addReaction(msg.id, emoji)} style={{
                            background: users.length > 0 ? 'var(--accent-muted)' : 'transparent',
                            border: `1px solid ${users.length > 0 ? 'var(--accent)' : 'transparent'}`,
                            borderRadius: '999px', cursor: 'pointer', fontSize: '0.7rem', padding: '0 0.25rem',
                          }}>
                            {emoji}{users.length > 0 && <span style={{ fontSize: '0.6rem', marginLeft: 2 }}>{users.length}</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.125rem', textAlign: isMine ? 'right' : 'left' }}>
                      {formatRelativeTime(msg.created_at)}
                      {isMine && msg.read_by.length > 1 && <span style={{ marginLeft: 4, color: 'var(--accent)' }}>{t('trades.chat.seen')}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          {partnerTyping && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
              {t('trades.chat.typing', { name: counterparty?.mononym ?? 'Partner' })}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="neu-input"
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              placeholder={t('trades.chat.placeholder')}
            />
            <button className="neu-btn neu-btn-primary" onClick={handleSendMessage} disabled={sendingMsg || !msgInput.trim()}>
              {sendingMsg ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Dispute Tab */}
      {activeTab === 'dispute' && (
        <Suspense fallback={<LoadingFallback />}>
          <DisputePanel
            tradeId={id ?? ''}
            milestones={milestones}
            disputes={disputes}
            onOpenDispute={openDispute}
            onAddComment={addDisputeComment}
          />
        </Suspense>
      )}
    </div>
  );
}
