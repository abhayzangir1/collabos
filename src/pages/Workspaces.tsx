import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, LoadingFallback } from '@/components/ui/ErrorBoundary';

export default function Workspaces() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { workspaces, loading, createWorkspace } = useWorkspaces();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) { setError('Workspace name is required.'); return; }
    setCreating(true); setError('');
    try {
      const ws = await createWorkspace(name, desc);
      setShowCreate(false); setName(''); setDesc('');
      navigate(`/workspaces/${ws.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); } finally { setCreating(false); }
  }

  if (loading) return <LoadingFallback />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>{t('workspaces.title')}</h1>
        <button className="neu-btn neu-btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> {t('workspaces.create')}
        </button>
      </div>

      {workspaces.length === 0 ? (
        <EmptyState icon={<Users size={32} />} title={t('workspaces.title')} description={t('workspaces.empty')} actionLabel={t('workspaces.create')} onAction={() => setShowCreate(true)} />
      ) : (
        <div className="grid-3">
          {workspaces.map((ws) => (
            <div key={ws.id} className="neu-card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => navigate(`/workspaces/${ws.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--accent-muted)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <Users size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate-1" style={{ fontWeight: 800, fontSize: '1rem' }}>{ws.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span className={`neu-badge ${ws.user_role === 'Owner' ? 'neu-badge-gold' : ws.user_role === 'Admin' ? 'neu-badge-info' : 'neu-badge-muted'}`} style={{ fontSize: '0.55rem' }}>{ws.user_role}</span>
                  </div>
                </div>
              </div>
              {ws.description && <p className="clamp-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ws.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('workspaces.create')}>
        {error && <div className="form-error" style={{ marginBottom: '0.75rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
        <div className="form-group">
          <label className="form-label">{t('workspaces.form.name')}</label>
          <input className="neu-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('workspaces.form.description')}</label>
          <textarea className="neu-input" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="neu-btn neu-btn-ghost" onClick={() => setShowCreate(false)}>{t('common.cancel')}</button>
          <button className="neu-btn neu-btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? <div className="spinner" style={{ width: 14, height: 14 }} /> : t('workspaces.form.submit')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
