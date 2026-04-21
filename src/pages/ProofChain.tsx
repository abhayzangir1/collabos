import { useState, useMemo } from 'react';
import { FileText, Plus, Grid, List, Pin, Download, Lock, Unlock, Trash2, Edit3, Check } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useProofs } from '@/hooks/useProofs';
import { useAuthStore } from '@/store';
import { SkillTagInput, SkillTagDisplay } from '@/components/ui/SkillTagInput';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, LoadingFallback } from '@/components/ui/ErrorBoundary';
import { validateFileUpload } from '@/lib/utils';
import { exportProofsPDF } from '@/lib/exportUtils';
import { MAX_SKILL_TAGS_PER_PROOF, ALLOWED_FILE_TYPES, MAX_FILE_SIZE_MB } from '@/lib/constants';
import type { SkillTag, Proof } from '@/types/database';

export default function ProofChain() {
  const { t } = useI18n();
  const { proofs, loading, addProof, updateProof, deleteProof, togglePin, replacePinnedProof, uploadProofMedia } = useProofs();
  const { profile } = useAuthStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showForm, setShowForm] = useState(false);
  const [editingProof, setEditingProof] = useState<Proof | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pinReplaceTarget, setPinReplaceTarget] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTags, setFormTags] = useState<SkillTag[]>([]);
  const [formValue, setFormValue] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const pinnedIds = useMemo(() => new Set(profile?.pinned_proofs ?? []), [profile]);

  function resetForm() {
    setFormTitle('');
    setFormDesc('');
    setFormTags([]);
    setFormValue('');
    setFormLink('');
    setFormFile(null);
    setFormError('');
    setEditingProof(null);
  }

  function openEdit(proof: Proof) {
    setEditingProof(proof);
    setFormTitle(proof.title);
    setFormDesc(proof.description);
    setFormTags(proof.skill_tags);
    setFormValue(proof.value);
    setFormLink(proof.external_link ?? '');
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!formTitle || !formDesc || formTags.length === 0) {
      setFormError('Title, description, and at least one skill tag are required.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      let mediaUrl: string | null = null;
      if (formFile) {
        const validationError = validateFileUpload(formFile, ALLOWED_FILE_TYPES, MAX_FILE_SIZE_MB);
        if (validationError) { setFormError(validationError); setFormLoading(false); return; }
        mediaUrl = await uploadProofMedia(formFile);
      }

      if (editingProof) {
        await updateProof(editingProof.id, {
          title: formTitle,
          description: formDesc,
          skill_tags: formTags,
          value: formValue,
          external_link: formLink || null,
          ...(mediaUrl ? { media_url: mediaUrl } : {}),
        });
      } else {
        await addProof({
          title: formTitle,
          description: formDesc,
          skill_tags: formTags,
          value: formValue,
          media_url: mediaUrl,
          external_link: formLink || null,
        });
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save proof');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleTogglePin(proofId: string) {
    const result = await togglePin(proofId);
    if (result.needsReplace) {
      setPinReplaceTarget(proofId);
    }
  }

  async function handleReplacePin(oldId: string) {
    if (!pinReplaceTarget) return;
    await replacePinnedProof(oldId, pinReplaceTarget);
    setPinReplaceTarget(null);
  }

  function toggleSelect(id: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  }

  function selectAll() {
    if (selectedIds.size === proofs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(proofs.map((p) => p.id)));
    }
  }

  if (loading) return <LoadingFallback />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>{t('proofchain.title')}</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {proofs.length > 0 && (
            <>
              <button className={`neu-btn neu-btn-ghost`} onClick={selectAll} style={{ fontSize: '0.75rem' }}>
                <Check size={14} /> {t('proofchain.selectAll')}
              </button>
              {selectedIds.size > 0 && (
                <button className="neu-btn neu-btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => {
                  const selected = proofs.filter((p) => selectedIds.has(p.id));
                  exportProofsPDF(selected, `proofchain-export-${Date.now()}`);
                }}>
                  <Download size={14} /> {t('proofchain.bulkExport')}
                </button>
              )}
              <div style={{ display: 'flex', border: '2px solid var(--surface-1-border)', borderRadius: 'var(--radius-sm)' }}>
                <button onClick={() => setViewMode('grid')} style={{
                  padding: '0.375rem 0.625rem', background: viewMode === 'grid' ? 'var(--accent-muted)' : 'transparent',
                  border: 'none', cursor: 'pointer', color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-muted)'
                }}><Grid size={16} /></button>
                <button onClick={() => setViewMode('list')} style={{
                  padding: '0.375rem 0.625rem', background: viewMode === 'list' ? 'var(--accent-muted)' : 'transparent',
                  border: 'none', cursor: 'pointer', color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-muted)'
                }}><List size={16} /></button>
              </div>
            </>
          )}
          <button className="neu-btn neu-btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus size={14} /> {t('proofchain.addProof')}
          </button>
        </div>
      </div>

      {proofs.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} />}
          title={t('proofchain.title')}
          description={t('proofchain.empty')}
          actionLabel={t('proofchain.empty.action')}
          onAction={() => { resetForm(); setShowForm(true); }}
        />
      ) : (
        <div className={viewMode === 'grid' ? 'grid-2' : ''} style={viewMode === 'list' ? { display: 'flex', flexDirection: 'column', gap: '0.75rem' } : undefined}>
          {proofs.map((proof) => (
            <div
              key={proof.id}
              className="neu-card"
              style={{
                padding: '1.25rem',
                position: 'relative',
                border: selectedIds.has(proof.id) ? '2px solid var(--accent)' : undefined,
              }}
            >
              {/* Selection checkbox */}
              <div style={{ position: 'absolute', top: 12, left: 12 }}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(proof.id)}
                  onChange={() => toggleSelect(proof.id)}
                  style={{ accentColor: 'var(--accent)', width: 16, height: 16, cursor: 'pointer' }}
                />
              </div>

              {/* Status badges */}
              <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                {pinnedIds.has(proof.id) && (
                  <span className="neu-badge neu-badge-gold" style={{ fontSize: '0.6rem' }}>
                    <Pin size={10} /> {t('proofchain.pinned')}
                  </span>
                )}
                <span className={`neu-badge ${proof.is_locked ? 'neu-badge-success' : 'neu-badge-muted'}`} style={{ fontSize: '0.6rem' }}>
                  {proof.is_locked ? <><Lock size={10} /> {t('proofchain.verified')}</> : <><Unlock size={10} /> {t('proofchain.unverified')}</>}
                </span>
              </div>

              <h3 className="clamp-2" style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.375rem' }}>
                {proof.title}
              </h3>
              <p className="clamp-3" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                {proof.description}
              </p>

              <SkillTagDisplay tags={proof.skill_tags} />

              {proof.value && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Value: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{proof.value}</span>
                </div>
              )}

              {/* Actions */}
              {!proof.is_locked && (
                <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.75rem', borderTop: '1px solid var(--surface-1-border)', paddingTop: '0.75rem' }}>
                  <button className="neu-btn neu-btn-ghost" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }} onClick={() => handleTogglePin(proof.id)}>
                    <Pin size={12} /> {pinnedIds.has(proof.id) ? t('proofchain.unpin') : t('proofchain.pin')}
                  </button>
                  <button className="neu-btn neu-btn-ghost" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }} onClick={() => openEdit(proof)}>
                    <Edit3 size={12} /> {t('proofchain.edit')}
                  </button>
                  <button className="neu-btn neu-btn-ghost" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', color: 'var(--error)' }} onClick={() => setDeleteTarget(proof.id)}>
                    <Trash2 size={12} /> {t('proofchain.delete')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        title={editingProof ? t('proofchain.form.update') : t('proofchain.addProof')}
        maxWidth="560px"
      >
        {formError && <div className="form-error" style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)' }}>{formError}</div>}
        <div className="form-group">
          <label className="form-label">{t('proofchain.form.title')}</label>
          <input className="neu-input" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('proofchain.form.description')}</label>
          <textarea className="neu-input" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('proofchain.form.skillTags')}</label>
          <SkillTagInput value={formTags} onChange={setFormTags} maxTags={MAX_SKILL_TAGS_PER_PROOF} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('proofchain.form.value')}</label>
          <input className="neu-input" value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="e.g., $500 project" />
        </div>
        <div className="form-group">
          <label className="form-label">{t('proofchain.form.link')}</label>
          <input className="neu-input" value={formLink} onChange={(e) => setFormLink(e.target.value)} placeholder="https://..." />
        </div>
        <div className="form-group">
          <label className="form-label">{t('proofchain.form.file')}</label>
          <input type="file" onChange={(e) => setFormFile(e.target.files?.[0] ?? null)} accept={ALLOWED_FILE_TYPES.join(',')}
            style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="neu-btn neu-btn-ghost" onClick={() => { setShowForm(false); resetForm(); }}>{t('proofchain.form.cancel')}</button>
          <button className="neu-btn neu-btn-primary" onClick={handleSubmit} disabled={formLoading}>
            {formLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : (editingProof ? t('proofchain.form.update') : t('proofchain.form.submit'))}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { if (deleteTarget) { await deleteProof(deleteTarget); setDeleteTarget(null); } }}
        title={t('proofchain.delete')}
        message={t('proofchain.deleteConfirm')}
        confirmLabel={t('proofchain.delete')}
        danger
      />

      {/* Pin Replace Modal */}
      <Modal isOpen={!!pinReplaceTarget} onClose={() => setPinReplaceTarget(null)} title="Replace Pinned Proof">
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{t('proofchain.maxPinned')}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {proofs.filter((p) => pinnedIds.has(p.id)).map((p) => (
            <button key={p.id} className="neu-btn neu-btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => handleReplacePin(p.id)}>
              <Pin size={14} /> {p.title}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
