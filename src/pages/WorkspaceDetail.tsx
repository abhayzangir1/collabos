import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Link2, Copy, Check, Trash2, LayoutList, Columns, Shield } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useWorkspaceDetail } from '@/hooks/useWorkspaces';
import { useListings } from '@/hooks/useListings';
import { useTrades } from '@/hooks/useTrades';
import { useAuthStore } from '@/store';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { LoadingFallback, EmptyState } from '@/components/ui/ErrorBoundary';
import { SkillTagDisplay } from '@/components/ui/SkillTagInput';
import { formatDate, formatRelativeTime, getStatusColor } from '@/lib/utils';
import type { TradeStatus } from '@/types/database';
import { getErrorMessage } from '@/lib/errors';

const KANBAN_COLUMNS: TradeStatus[] = ['Proposed', 'Active', 'Disputed', 'Completed', 'Declined'];

export default function WorkspaceDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { workspace, members, invitations, loading, generateInvite, revokeInvite, changeMemberRole, removeMember, updateWorkspace, deleteWorkspace, refetch } = useWorkspaceDetail(id ?? '');
  const { listings } = useListings(id);
  const { trades, acceptTrade } = useTrades();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'members' | 'pipeline' | 'listings' | 'settings'>('members');
  const [pipelineView, setPipelineView] = useState<'list' | 'kanban'>('list');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [actionError, setActionError] = useState('');

  const workspaceTrades = trades.filter((tr) => tr.workspace_id === id);
  const isOwner = workspace?.user_role === 'Owner';
  const isAdmin = workspace?.user_role === 'Admin' || isOwner;

  useEffect(() => {
    if (!id) return;
    const saved = sessionStorage.getItem(`collabos:${id}:pipeline-view`);
    if (saved === 'list' || saved === 'kanban') {
      setPipelineView(saved);
    }
  }, [id]);

  function setPersistedPipelineView(view: 'list' | 'kanban') {
    setPipelineView(view);
    if (id) {
      sessionStorage.setItem(`collabos:${id}:pipeline-view`, view);
    }
  }

  async function handleGenerateInvite() {
    try {
      setActionError('');
      const result = await generateInvite();
      setInviteUrl(result.url);
    } catch (err) { setActionError(getErrorMessage(err)); }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDragAccept(tradeId: string) {
    if (!isAdmin) return;
    try {
      setActionError('');
      await acceptTrade(tradeId);
      refetch();
    } catch (err) { setActionError(getErrorMessage(err)); }
  }

  if (loading || !workspace) return <LoadingFallback />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>{workspace.name}</h1>
          {workspace.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{workspace.description}</p>}
        </div>
        <span className={`neu-badge ${workspace.user_role === 'Owner' ? 'neu-badge-gold' : workspace.user_role === 'Admin' ? 'neu-badge-info' : 'neu-badge-muted'}`}>{workspace.user_role}</span>
      </div>

      <div className="tabs">
        {(['members', 'pipeline', 'listings', ...(isOwner ? ['settings'] : [])] as const).map((tab) => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => { setActiveTab(tab as typeof activeTab); if (tab === 'settings') { setSettingsName(workspace.name); setSettingsDesc(workspace.description ?? ''); } }}>
            {t(`workspaces.${tab}`)}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="form-error" style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)' }}>
          {actionError}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          {isAdmin && (
            <div style={{ marginBottom: '1rem' }}>
              <button className="neu-btn neu-btn-secondary" onClick={() => { setShowInvite(true); handleGenerateInvite(); }}>
                <Link2 size={14} /> {t('workspaces.invite')}
              </button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {members.map((member) => (
              <div key={member.id} className="neu-card" style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-muted)', border: '1.5px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem', color: 'var(--accent)' }}>
                  {member.profile?.mononym?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate-1" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{member.profile?.mononym ?? 'Unknown'}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Joined {formatDate(member.joined_at)}</div>
                </div>
                <span className={`neu-badge ${member.role === 'Owner' ? 'neu-badge-gold' : member.role === 'Admin' ? 'neu-badge-info' : 'neu-badge-muted'}`} style={{ fontSize: '0.55rem' }}>{member.role}</span>
                {isAdmin && member.user_id !== user?.id && member.role !== 'Owner' && (
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <select className="neu-input" value={member.role} onChange={(e) => { setActionError(''); changeMemberRole(member.id, e.target.value as "Admin" | "Member").catch((err) => setActionError(getErrorMessage(err))); }} style={{ width: 90, fontSize: '0.7rem', padding: '0.25rem' }}>
                      <option value="Member">Member</option>
                      <option value="Admin">Admin</option>
                    </select>
                    <button className="neu-btn neu-btn-ghost" style={{ padding: '0.25rem', color: 'var(--error)' }} onClick={() => { setActionError(''); removeMember(member.id).catch((err) => setActionError(getErrorMessage(err))); }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button className={`neu-btn ${pipelineView === 'list' ? 'neu-btn-primary' : 'neu-btn-ghost'}`} onClick={() => setPersistedPipelineView('list')} style={{ fontSize: '0.75rem' }}>
              <LayoutList size={14} /> {t('workspaces.pipeline.listView')}
            </button>
            <button className={`neu-btn ${pipelineView === 'kanban' ? 'neu-btn-primary' : 'neu-btn-ghost'}`} onClick={() => setPersistedPipelineView('kanban')} style={{ fontSize: '0.75rem' }}>
              <Columns size={14} /> {t('workspaces.pipeline.kanbanView')}
            </button>
          </div>

          {workspaceTrades.length === 0 ? (
            <EmptyState icon={<Users size={32} />} title="Trade Pipeline" description={t('workspaces.kanban.empty')} />
          ) : pipelineView === 'list' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {workspaceTrades.map((trade) => {
                const cp = trade.proposer_user_id === user?.id ? trade.recipient : trade.proposer;
                return (
                  <div key={trade.id} className="neu-card" style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate(`/trades/${trade.id}`)}>
                    <div className="truncate-1" style={{ flex: 1, fontWeight: 700, fontSize: '0.85rem' }}>{cp?.mononym ?? 'Unknown'}</div>
                    <span className={`neu-badge ${getStatusColor(trade.status)}`} style={{ fontSize: '0.6rem' }}>{trade.status}</span>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatRelativeTime(trade.created_at)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Kanban View */
            <div className="kanban-board">
              {KANBAN_COLUMNS.map((col) => {
                const colTrades = workspaceTrades.filter((tr) => tr.status === col);
                return (
                  <div
                    key={col}
                    className="kanban-column"
                    onDragOver={(e) => { if (col === 'Active' && isAdmin) e.preventDefault(); }}
                    onDrop={(e) => {
                      if (col === 'Active' && isAdmin) {
                        const tradeId = e.dataTransfer.getData('tradeId');
                        if (tradeId) handleDragAccept(tradeId);
                      }
                    }}
                  >
                    <div className="kanban-column-header">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span className="status-dot" style={{ background: col === 'Active' ? 'var(--success)' : col === 'Proposed' ? 'var(--info)' : col === 'Disputed' ? 'var(--error)' : col === 'Completed' ? 'var(--success)' : 'var(--text-muted)' }} />
                        {col}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{colTrades.length}</span>
                    </div>
                    <div className="kanban-column-body">
                      {colTrades.map((trade) => {
                        const cp = trade.proposer_user_id === user?.id ? trade.recipient : trade.proposer;
                        const completedMs = trade.milestones?.filter((m) => m.status === 'Completed').length ?? 0;
                        const totalMs = trade.milestones?.length ?? 0;
                        return (
                          <div
                            key={trade.id}
                            className="kanban-card"
                            draggable={col === 'Proposed' && isAdmin}
                            onDragStart={(e) => { e.dataTransfer.setData('tradeId', trade.id); }}
                            onClick={() => navigate(`/trades/${trade.id}`)}
                          >
                            <div className="truncate-1" style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.375rem' }}>{cp?.mononym ?? 'Unknown'}</div>
                            <SkillTagDisplay tags={[...(trade.listing?.skill_offered_tags ?? []), ...(trade.listing?.skill_requested_tags ?? [])]} maxRows={2} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              <span>{completedMs}/{totalMs} milestones</span>
                              <span>{formatRelativeTime(trade.created_at)}</span>
                            </div>
                          </div>
                        );
                      })}
                      {colTrades.length === 0 && (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>No trades</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Listings Tab */}
      {activeTab === 'listings' && (
        <div className="grid-3">
          {listings.map((l) => (
            <div key={l.id} className="neu-card" style={{ padding: '1rem' }}>
              <div className="truncate-1" style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{l.skill_offered}</div>
              <div className="truncate-1" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Seeking: {l.skill_requested}</div>
            </div>
          ))}
          {listings.length === 0 && <EmptyState icon={<Shield size={24} />} title="Shared Listings" description="No shared listings yet." />}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && isOwner && (
        <div style={{ maxWidth: '500px' }}>
          <div className="form-group">
            <label className="form-label">{t('workspaces.settings.name')}</label>
            <input className="neu-input" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('workspaces.settings.description')}</label>
            <textarea className="neu-input" value={settingsDesc} onChange={(e) => setSettingsDesc(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="neu-btn neu-btn-primary" onClick={() => { setActionError(''); updateWorkspace({ name: settingsName, description: settingsDesc }).catch((err) => setActionError(getErrorMessage(err))); }}>{t('workspaces.settings.save')}</button>
            <button className="neu-btn neu-btn-danger" onClick={() => setShowDelete(true)}>{t('workspaces.settings.delete')}</button>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title={t('workspaces.invite')}>
        {inviteUrl ? (
          <div>
            <p className="form-label" style={{ marginBottom: '0.375rem' }}>{t('workspaces.invite.link')}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input className="neu-input" value={inviteUrl} readOnly style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }} />
              <button className="neu-btn neu-btn-secondary" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Expires in 7 days</p>
          </div>
        ) : (
          <button className="neu-btn neu-btn-primary" onClick={handleGenerateInvite}>{t('workspaces.invite.generate')}</button>
        )}

        {invitations.length > 0 && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--surface-1-border)', paddingTop: '1rem' }}>
            <p className="form-label" style={{ marginBottom: '0.5rem' }}>Active Invitations</p>
            {invitations.map((inv) => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--surface-1-border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Expires {formatDate(inv.expires_at)}
                </div>
                <button onClick={() => { setActionError(''); revokeInvite(inv.id).catch((err) => setActionError(getErrorMessage(err))); }} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>
                  {t('workspaces.invite.revoke')}
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Workspace */}
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={async () => { await deleteWorkspace(); navigate('/workspaces'); }} title={t('workspaces.settings.delete')} message={t('workspaces.settings.deleteConfirm')} confirmLabel={t('common.delete')} danger />
    </div>
  );
}
