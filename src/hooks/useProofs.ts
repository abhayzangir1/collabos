import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import type { Proof, SkillTag } from '@/types/database';
import { MAX_PINNED_PROOFS, SIGNED_URL_EXPIRY_SECONDS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';

export function useProofs() {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchProofs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('proofs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProofs((data as Proof[]) ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProofs();
  }, [fetchProofs]);

  const addProof = useCallback(async (proof: {
    title: string;
    description: string;
    skill_tags: SkillTag[];
    value: string;
    media_url?: string | null;
    external_link?: string | null;
  }) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error: insertError } = await supabase
      .from('proofs')
      .insert({
        user_id: user.id,
        ...proof,
        is_locked: false,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    setProofs((prev) => [data as Proof, ...prev]);
    return data as Proof;
  }, [user]);

  const updateProof = useCallback(async (id: string, updates: Partial<Proof>) => {
    const { error: updateError } = await supabase
      .from('proofs')
      .update(updates)
      .eq('id', id);

    if (updateError) throw updateError;
    setProofs((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const deleteProof = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from('proofs')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Remove from pinned if needed
    const { profile } = useAuthStore.getState();
    if (profile?.pinned_proofs?.includes(id)) {
      const newPinned = profile.pinned_proofs.filter((pid) => pid !== id);
      await supabase.from('profiles').update({ pinned_proofs: newPinned }).eq('id', profile.id);
    }

    setProofs((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const togglePin = useCallback(async (proofId: string): Promise<{ needsReplace: boolean }> => {
    const { profile } = useAuthStore.getState();
    if (!profile) throw new Error('Not authenticated');

    const pinned = [...(profile.pinned_proofs ?? [])];
    const isPinned = pinned.includes(proofId);

    if (isPinned) {
      const newPinned = pinned.filter((id) => id !== proofId);
      await supabase.from('profiles').update({ pinned_proofs: newPinned }).eq('id', profile.id);
      useAuthStore.getState().setProfile({ ...profile, pinned_proofs: newPinned });
      return { needsReplace: false };
    }

    if (pinned.length >= MAX_PINNED_PROOFS) {
      return { needsReplace: true };
    }

    const newPinned = [...pinned, proofId];
    await supabase.from('profiles').update({ pinned_proofs: newPinned }).eq('id', profile.id);
    useAuthStore.getState().setProfile({ ...profile, pinned_proofs: newPinned });
    return { needsReplace: false };
  }, []);

  const replacePinnedProof = useCallback(async (oldId: string, newId: string) => {
    const { profile } = useAuthStore.getState();
    if (!profile) throw new Error('Not authenticated');
    const newPinned = profile.pinned_proofs.map((id) => (id === oldId ? newId : id));
    await supabase.from('profiles').update({ pinned_proofs: newPinned }).eq('id', profile.id);
    useAuthStore.getState().setProfile({ ...profile, pinned_proofs: newPinned });
  }, []);

  const uploadProofMedia = useCallback(async (file: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('proof-media')
      .upload(path, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = await supabase.storage
      .from('proof-media')
      .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

    return urlData?.signedUrl ?? path;
  }, [user]);

  return {
    proofs,
    loading,
    error,
    addProof,
    updateProof,
    deleteProof,
    togglePin,
    replacePinnedProof,
    uploadProofMedia,
    refetch: fetchProofs,
  };
}
