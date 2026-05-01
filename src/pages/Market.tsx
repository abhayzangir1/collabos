import { useState, useMemo, useEffect } from 'react';

import { Search, Plus, ShoppingBag, Shield, ArrowRight, Edit3, Trash2, EyeOff, Eye, X, ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useListings } from '@/hooks/useListings';
import { useTrades } from '@/hooks/useTrades';
import { useAuthStore } from '@/store';
import { SkillTagInput, SkillTagDisplay } from '@/components/ui/SkillTagInput';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, LoadingFallback } from '@/components/ui/ErrorBoundary';
import type { SkillTag, Listing, Proof } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { MIN_MILESTONES, MAX_MILESTONES } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';

export default function Market() {
  const { t } = useI18n();
  // navigate removed
  const { listings, loading, createListing, updateListing, deactivateListing, deleteListing } = useListings();
  const { proposeTrade } = useTrades();
  const { user } = useAuthStore();

  const [search, setSearch] = useState('');
  const [filterTags, setFilterTags] = useState<SkillTag[]>([]);
  const [filterMin, setFilterMin] = useState('');
  const [filterMax, setFilterMax] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [detailListing, setDetailListing] = useState<Listing | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [proposeTarget, setProposeTarget] = useState<Listing | null>(null);
  const [proposeStep, setProposeStep] = useState(1);

  // Create/Edit form
  const [formOffered, setFormOffered] = useState('');
  const [formOfferedTags, setFormOfferedTags] = useState<SkillTag[]>([]);
  const [formRequested, setFormRequested] = useState('');
  const [formRequestedTags, setFormRequestedTags] = useState<SkillTag[]>([]);
  const [formHours, setFormHours] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Propose form
  const [milestonesEnabled, setMilestonesEnabled] = useState(true);
  const [milestones, setMilestones] = useState([{ title: '', description: '', due_date: '' }, { title: '', description: '', due_date: '' }]);
  const [proposeLoading, setProposeLoading] = useState(false);
  const [proposeError, setProposeError] = useState('');
  const [pinnedProofs, setPinnedProofs] = useState<Proof[]>([]);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (search && !l.skill_offered.toLowerCase().includes(search.toLowerCase()) && !l.skill_requested.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterTags.length > 0) {
        const listingTags = [...(l.skill_offered_tags ?? []), ...(l.skill_requested_tags ?? [])];
        const hasMatch = filterTags.some((ft) => listingTags.some((lt) => lt.label === ft.label));
        if (!hasMatch) return false;
      }
      if (filterMin && l.hours_range < Number(filterMin)) return false;
      if (filterMax && l.hours_range > Number(filterMax)) return false;
      return true;
    });
  }, [listings, search, filterTags, filterMin, filterMax]);

  // Fetch pinned proofs when detail listing opens
  useEffect(() => {
    if (!detailListing) { setPinnedProofs([]); return; }
    (async () => {
      const { data: profile } = await supabase.from('profiles').select('pinned_proofs').eq('id', detailListing.user_id).single();
      if (profile?.pinned_proofs?.length) {
        const { data: proofs } = await supabase.from('proofs').select('*').in('id', profile.pinned_proofs);
        if (proofs) setPinnedProofs(proofs as Proof[]);
      }
    })();
  }, [detailListing]);

  function resetForm() {
    setFormOffered(''); setFormOfferedTags([]); setFormRequested(''); setFormRequestedTags([]);
    setFormHours(''); setFormDescription(''); setFormError(''); setEditingListing(null);
  }

  function openEdit(l: Listing) {
    setEditingListing(l); setFormOffered(l.skill_offered); setFormOfferedTags(l.skill_offered_tags ?? []);
    setFormRequested(l.skill_requested); setFormRequestedTags(l.skill_requested_tags ?? []);
    setFormHours(String(l.hours_range)); setFormDescription(l.description); setShowCreateForm(true);
  }

  async function handleSaveListing() {
    if (!formOffered || !formRequested) { setFormError('Skill offered and requested are required.'); return; }
    setFormLoading(true); setFormError('');
    try {
      if (editingListing) {
        await updateListing(editingListing.id, { skill_offered: formOffered, skill_offered_tags: formOfferedTags, skill_requested: formRequested, skill_requested_tags: formRequestedTags, hours_range: Number(formHours) || 0, description: formDescription });
      } else {
        await createListing({ skill_offered: formOffered, skill_offered_tags: formOfferedTags, skill_requested: formRequested, skill_requested_tags: formRequestedTags, hours_range: Number(formHours) || 0, description: formDescription });
      }
      setShowCreateForm(false); resetForm();
    } catch (err) { setFormError(getErrorMessage(err)); } finally { setFormLoading(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try { await deleteListing(deleteTarget); setDeleteTarget(null); setDeleteError('');
    } catch (err) { setDeleteError(getErrorMessage(err)); }
  }

  async function handlePropose() {
    if (!proposeTarget || !user) return;
    setProposeLoading(true); setProposeError('');
    try {
      if (user.id === proposeTarget.user_id) { setProposeError(t('market.selfTradeBlock')); return; }
      const ms = milestonesEnabled ? milestones.filter((m) => m.title) : [{ title: 'Delivery', description: 'Complete the trade', due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]! }, { title: 'Review', description: 'Review and confirm', due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]! }];
      if (ms.length < MIN_MILESTONES) { setProposeError(`Minimum ${MIN_MILESTONES} milestones required.`); return; }
      await proposeTrade(proposeTarget.id, proposeTarget.user_id, ms);
      setProposeTarget(null); setProposeStep(1);
    } catch (err) { setProposeError(getErrorMessage(err)); } finally { setProposeLoading(false); }
  }

  if (loading) return <LoadingFallback />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>{t('market.title')}</h1>
        <button className="neu-btn neu-btn-primary" onClick={() => { resetForm(); setShowCreateForm(true); }}>
          <Plus size={14} /> {t('market.createListing')}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="neu-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('market.search')} style={{ paddingLeft: '2.25rem' }} />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <SkillTagInput value={filterTags} onChange={setFilterTags} placeholder={t('market.filter.tags')} maxTags={5} />
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <input className="neu-input" type="number" placeholder={t('market.filter.hoursMin')} value={filterMin} onChange={(e) => setFilterMin(e.target.value)} style={{ width: 70 }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
          <input className="neu-input" type="number" placeholder={t('market.filter.hoursMax')} value={filterMax} onChange={(e) => setFilterMax(e.target.value)} style={{ width: 70 }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ShoppingBag size={32} />} title={t('market.title')} description={t('market.empty')} actionLabel={t('market.empty.action')} onAction={() => { resetForm(); setShowCreateForm(true); }} />
      ) : (
        <div className="grid-3">
          {filtered.map((l) => (
            <div key={l.id} className="neu-card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => setDetailListing(l)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-muted)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', color: 'var(--accent)' }}>
                  {l.profile?.mononym?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div className="truncate-1" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{l.profile?.mononym ?? 'Unknown'}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{l.profile?.dna_type}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Shield size={12} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--accent)' }}>{l.profile?.current_trust_score ?? 0}</span>
                </div>
              </div>

              <div style={{ marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>OFFERING</span>
                <p className="truncate-1" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{l.skill_offered}</p>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>SEEKING</span>
                <p className="truncate-1" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{l.skill_requested}</p>
              </div>

              <SkillTagDisplay tags={[...(l.skill_offered_tags ?? []), ...(l.skill_requested_tags ?? [])]} maxRows={1} />

              {l.hours_range > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {l.hours_range}h available
                </div>
              )}

              {l.user_id === user?.id && (
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', borderTop: '1px solid var(--surface-1-border)', paddingTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                  <button className="neu-btn neu-btn-ghost" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }} onClick={() => openEdit(l)}><Edit3 size={10} /></button>
                  <button className="neu-btn neu-btn-ghost" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }} onClick={() => l.is_active ? deactivateListing(l.id) : updateListing(l.id, { is_active: true })}>{l.is_active ? <EyeOff size={10} /> : <Eye size={10} />}</button>
                  <button className="neu-btn neu-btn-ghost" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem', color: 'var(--error)' }} onClick={() => setDeleteTarget(l.id)}><Trash2 size={10} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!detailListing} onClose={() => setDetailListing(null)} title={detailListing?.skill_offered ?? ''} maxWidth="600px">
        {detailListing && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>{detailListing.description}</p>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div><span className="form-label">Offering</span><p style={{ fontWeight: 700 }}>{detailListing.skill_offered}</p></div>
                <div><span className="form-label">Seeking</span><p style={{ fontWeight: 700 }}>{detailListing.skill_requested}</p></div>
              </div>
              <SkillTagDisplay tags={[...(detailListing.skill_offered_tags ?? []), ...(detailListing.skill_requested_tags ?? [])]} />
            </div>

            {/* Pinned Proofs */}
            {pinnedProofs.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pinned Proofs</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {pinnedProofs.map((proof) => (
                    <div key={proof.id} className="neu-card" style={{ padding: '0.75rem' }}>
                      <div className="truncate-1" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{proof.title}</div>
                      <div className="clamp-2" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{proof.description}</div>
                      {proof.skill_tags?.length > 0 && (
                        <div style={{ marginTop: '0.375rem' }}>
                          <SkillTagDisplay tags={proof.skill_tags} maxRows={1} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detailListing.user_id !== user?.id && (
              <button className="neu-btn neu-btn-primary" style={{ width: '100%' }} onClick={() => { setProposeTarget(detailListing); setDetailListing(null); setProposeStep(1); }}>
                {t('market.detail.proposeTrade')} <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Create/Edit Listing Modal */}
      <Modal isOpen={showCreateForm} onClose={() => { setShowCreateForm(false); resetForm(); }} title={editingListing ? t('market.form.update') : t('market.createListing')}>
        {formError && <div className="form-error" style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)' }}>{formError}</div>}
        <div className="form-group"><label className="form-label">{t('market.form.skillOffered')}</label><input className="neu-input" value={formOffered} onChange={(e) => setFormOffered(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Offered Skill Tags</label><SkillTagInput value={formOfferedTags} onChange={setFormOfferedTags} /></div>
        <div className="form-group"><label className="form-label">{t('market.form.skillRequested')}</label><input className="neu-input" value={formRequested} onChange={(e) => setFormRequested(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Requested Skill Tags</label><SkillTagInput value={formRequestedTags} onChange={setFormRequestedTags} /></div>
        <div className="form-group"><label className="form-label">{t('market.form.hoursRange')}</label><input className="neu-input" type="number" value={formHours} onChange={(e) => setFormHours(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">{t('market.form.description')}</label><textarea className="neu-input" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} style={{ resize: 'vertical' }} /></div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="neu-btn neu-btn-ghost" onClick={() => { setShowCreateForm(false); resetForm(); }}>{t('common.cancel')}</button>
          <button className="neu-btn neu-btn-primary" onClick={handleSaveListing} disabled={formLoading}>
            {formLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : (editingListing ? t('market.form.update') : t('market.form.submit'))}
          </button>
        </div>
      </Modal>

      {/* Propose Trade Modal */}
      <Modal isOpen={!!proposeTarget} onClose={() => setProposeTarget(null)} title={t('market.detail.proposeTrade')} maxWidth="600px">
        {proposeTarget && (
          <div>
            {/* Step indicator */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
              {[1, 2, 3].map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, background: s <= proposeStep ? 'var(--accent)' : 'var(--surface-1)', color: s <= proposeStep ? 'var(--text-inverse)' : 'var(--text-muted)', border: `2px solid ${s <= proposeStep ? 'var(--accent)' : 'var(--surface-1-border)'}` }}>{s}</div>
                  {s < 3 && <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
                </div>
              ))}
            </div>

            {proposeError && <div className="form-error" style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)' }}>{proposeError}</div>}

            {proposeStep === 1 && (
              <div>
                <h4 style={{ marginBottom: '0.75rem' }}>{t('market.proposeTrade.step1')}</h4>
                <div className="neu-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>You give: <strong style={{ color: 'var(--text-primary)' }}>{proposeTarget.skill_requested}</strong></p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>You get: <strong style={{ color: 'var(--text-primary)' }}>{proposeTarget.skill_offered}</strong></p>
                </div>
                <button className="neu-btn neu-btn-primary" style={{ width: '100%' }} onClick={() => setProposeStep(2)}>Continue <ArrowRight size={14} /></button>
              </div>
            )}

            {proposeStep === 2 && (
              <div>
                <h4 style={{ marginBottom: '0.75rem' }}>{t('market.proposeTrade.step2')}</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={milestonesEnabled} onChange={(e) => setMilestonesEnabled(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                  {t('market.proposeTrade.enableMilestones')}
                </label>
                {milestonesEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {milestones.map((ms, i) => (
                      <div key={i} className="neu-card" style={{ padding: '0.75rem', background: 'var(--surface-1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--accent)' }}>Milestone {i + 1}</span>
                          {milestones.length > MIN_MILESTONES && (
                            <button onClick={() => setMilestones(milestones.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.7rem' }}><X size={12} /></button>
                          )}
                        </div>
                        <input className="neu-input" placeholder={t('market.proposeTrade.milestoneTitle')} value={ms.title} onChange={(e) => { const m = [...milestones]; m[i] = { ...m[i]!, title: e.target.value }; setMilestones(m); }} style={{ marginBottom: '0.375rem' }} />
                        <input className="neu-input" placeholder={t('market.proposeTrade.milestoneDesc')} value={ms.description} onChange={(e) => { const m = [...milestones]; m[i] = { ...m[i]!, description: e.target.value }; setMilestones(m); }} style={{ marginBottom: '0.375rem' }} />
                        <input className="neu-input" type="date" value={ms.due_date} onChange={(e) => { const m = [...milestones]; m[i] = { ...m[i]!, due_date: e.target.value }; setMilestones(m); }} />
                      </div>
                    ))}
                    {milestones.length < MAX_MILESTONES && (
                      <button className="neu-btn neu-btn-ghost" onClick={() => setMilestones([...milestones, { title: '', description: '', due_date: '' }])}>
                        <Plus size={14} /> {t('market.proposeTrade.addMilestone')}
                      </button>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button className="neu-btn neu-btn-ghost" onClick={() => setProposeStep(1)}>Back</button>
                  <button className="neu-btn neu-btn-primary" style={{ flex: 1 }} onClick={() => setProposeStep(3)}>Continue <ArrowRight size={14} /></button>
                </div>
              </div>
            )}

            {proposeStep === 3 && (
              <div>
                <h4 style={{ marginBottom: '0.75rem' }}>{t('market.proposeTrade.step3')}</h4>
                <div className="neu-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}><strong>Trading with:</strong> {proposeTarget.profile?.mononym}</p>
                  <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}><strong>You give:</strong> {proposeTarget.skill_requested}</p>
                  <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}><strong>You get:</strong> {proposeTarget.skill_offered}</p>
                  {milestonesEnabled && <p style={{ fontSize: '0.8rem' }}><strong>Milestones:</strong> {milestones.filter((m) => m.title).length}</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="neu-btn neu-btn-ghost" onClick={() => setProposeStep(2)}>Back</button>
                  <button className="neu-btn neu-btn-primary" style={{ flex: 1 }} onClick={handlePropose} disabled={proposeLoading}>
                    {proposeLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : t('market.proposeTrade.submit')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => { setDeleteTarget(null); setDeleteError(''); }} onConfirm={handleDelete} title={t('market.listing.delete')} message={deleteError || t('market.listing.deleteConfirm')} confirmLabel={t('common.delete')} danger />
    </div>
  );
}
