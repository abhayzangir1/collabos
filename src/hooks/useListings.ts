import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import type { Listing, SkillTag } from '@/types/database';

export function useListings(workspaceId?: string) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('listings')
        .select('*, profile:profiles(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setListings((data as unknown as Listing[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const createListing = useCallback(async (listing: {
    skill_offered: string;
    skill_offered_tags: SkillTag[];
    skill_requested: string;
    skill_requested_tags: SkillTag[];
    hours_range: number;
    description: string;
    workspace_id?: string;
  }) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('Not authenticated');

    // Check for max 5 active listings
    const { count, error: countError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (countError) throw countError;
    if (count && count >= 5) {
      throw new Error('You can only have up to 5 active listings. Please deactivate an existing listing first.');
    }

    const { data, error: insertError } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        ...listing,
        workspace_id: listing.workspace_id ?? null,
        is_active: true,
      })
      .select('*, profile:profiles(*)')
      .single();

    if (insertError) throw insertError;
    setListings((prev) => [data as unknown as Listing, ...prev]);
    return data as unknown as Listing;
  }, []);

  const updateListing = useCallback(async (id: string, updates: Partial<Listing>) => {
    const { error: updateError } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id);

    if (updateError) throw updateError;
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }, []);

  const deactivateListing = useCallback(async (id: string) => {
    await updateListing(id, { is_active: false });
    setListings((prev) => prev.filter((l) => l.id !== id));
  }, [updateListing]);

  const activateListing = useCallback(async (id: string) => {
    await updateListing(id, { is_active: true });
  }, [updateListing]);

  const deleteListing = useCallback(async (id: string) => {
    // Check for active trades
    const { data: activeTrades } = await supabase
      .from('trades')
      .select('id')
      .eq('listing_id', id)
      .in('status', ['Proposed', 'Active']);

    if (activeTrades && activeTrades.length > 0) {
      throw new Error('This listing is linked to an active trade and cannot be deleted.');
    }

    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    setListings((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return {
    listings,
    loading,
    error,
    createListing,
    updateListing,
    deactivateListing,
    activateListing,
    deleteListing,
    refetch: fetchListings,
  };
}
