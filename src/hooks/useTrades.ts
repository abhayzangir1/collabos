import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import type { Trade, Milestone, Evidence, Message, Dispute, DisputeComment } from '@/types/database';

const MESSAGES_PER_PAGE = 30;

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchTrades = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('trades')
        .select(`
          *,
          proposer:profiles!trades_proposer_user_id_fkey(*),
          recipient:profiles!trades_recipient_user_id_fkey(*),
          listing:listings(*),
          milestones(*)
        `)
        .or(`proposer_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTrades((data as unknown as Trade[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const proposeTrade = useCallback(async (
    listingId: string,
    recipientId: string,
    milestones: { title: string; description: string; due_date: string }[],
    workspaceId?: string
  ) => {
    if (!user) throw new Error('Not authenticated');
    if (user.id === recipientId) throw new Error('You cannot propose a trade with yourself.');

    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        listing_id: listingId,
        proposer_user_id: user.id,
        recipient_user_id: recipientId,
        workspace_id: workspaceId ?? null,
        status: 'Proposed',
      })
      .select()
      .single();

    if (tradeError) throw tradeError;

    const tradeRecord = trade as Trade;
    const milestoneInserts = milestones.map((m, i) => ({
      trade_id: tradeRecord.id,
      sequence: i + 1,
      title: m.title,
      description: m.description,
      due_date: m.due_date,
      status: i === 0 ? 'Pending' : 'Pending',
      party_a_confirmed: false,
      party_b_confirmed: false,
    }));

    const { error: msError } = await supabase.from('milestones').insert(milestoneInserts);
    if (msError) throw msError;

    // Create activity feed item
    await supabase.from('activity_feed').insert({
      user_id: user.id,
      recipient_user_id: recipientId,
      event_type: 'trade_proposal_received',
      metadata: { trade_id: tradeRecord.id },
      is_read: false,
    });

    await fetchTrades();
    return tradeRecord;
  }, [user, fetchTrades]);

  const acceptTrade = useCallback(async (tradeId: string) => {
    const { error: updateError } = await supabase
      .from('trades')
      .update({ status: 'Active' })
      .eq('id', tradeId);

    if (updateError) throw updateError;

    // Set first milestone to In Progress
    const { data: milestones } = await supabase
      .from('milestones')
      .select('*')
      .eq('trade_id', tradeId)
      .order('sequence');

    if (milestones && milestones.length > 0) {
      await supabase.from('milestones').update({ status: 'In Progress' }).eq('id', milestones[0]!.id);
    }

    await fetchTrades();
  }, [fetchTrades]);

  const declineTrade = useCallback(async (tradeId: string) => {
    const { error: updateError } = await supabase
      .from('trades')
      .update({ status: 'Declined' })
      .eq('id', tradeId);
    if (updateError) throw updateError;
    await fetchTrades();
  }, [fetchTrades]);

  const markMilestoneComplete = useCallback(async (milestoneId: string, tradeId: string) => {
    if (!user) throw new Error('Not authenticated');

    // Check for open disputes
    const { data: disputes } = await supabase
      .from('disputes')
      .select('*')
      .eq('milestone_id', milestoneId)
      .in('status', ['Open', 'Under Review']);

    if (disputes && disputes.length > 0) {
      throw new Error('Cannot mark complete while a dispute is open on this milestone.');
    }

    // Get the trade to determine role
    const { data: trade } = await supabase.from('trades').select('*').eq('id', tradeId).single();
    if (!trade) throw new Error('Trade not found');

    const tradeRecord = trade as Trade;
    const isProposer = tradeRecord.proposer_user_id === user.id;
    const confirmField = isProposer ? 'party_a_confirmed' : 'party_b_confirmed';

    const { data: milestone } = await supabase.from('milestones').select('*').eq('id', milestoneId).single();
    if (!milestone) throw new Error('Milestone not found');

    const ms = milestone as Milestone;
    const updates: Partial<Milestone> = { [confirmField]: true };

    // Check if both confirmed
    const otherConfirmed = isProposer ? ms.party_b_confirmed : ms.party_a_confirmed;
    if (otherConfirmed) {
      updates.status = 'Completed';
    } else {
      updates.status = 'Awaiting Confirmation';
    }

    await supabase.from('milestones').update(updates).eq('id', milestoneId);

    // If completed, advance next milestone
    if (updates.status === 'Completed') {
      const { data: allMilestones } = await supabase
        .from('milestones')
        .select('*')
        .eq('trade_id', tradeId)
        .order('sequence');

      if (allMilestones) {
        const milestonesList = allMilestones as Milestone[];
        const allCompleted = milestonesList.every((m) => m.id === milestoneId || m.status === 'Completed');

        if (allCompleted) {
          // Complete trade
          await supabase.from('trades').update({ status: 'Completed', completed_at: new Date().toISOString() }).eq('id', tradeId);
          // Trust score recalculation would be triggered by DB trigger
        } else {
          // Advance next milestone
          const nextMs = milestonesList.find((m) => m.sequence === ms.sequence + 1);
          if (nextMs) {
            await supabase.from('milestones').update({ status: 'In Progress' }).eq('id', nextMs.id);
          }
        }
      }
    }

    await fetchTrades();
  }, [user, fetchTrades]);

  return {
    trades,
    loading,
    error,
    proposeTrade,
    acceptTrade,
    declineTrade,
    markMilestoneComplete,
    refetch: fetchTrades,
  } as const;
}

export function useTradeDetail(tradeId: string) {
  const [trade, setTrade] = useState<Trade | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const msgOffsetRef = useRef(0);
  const { user } = useAuthStore();

  const fetchAll = useCallback(async () => {
    if (!tradeId) return;
    setLoading(true);
    try {
      const [tradeRes, msRes, evRes, msgRes, dispRes] = await Promise.all([
        supabase.from('trades').select('*, proposer:profiles!trades_proposer_user_id_fkey(*), recipient:profiles!trades_recipient_user_id_fkey(*), listing:listings(*)').eq('id', tradeId).single(),
        supabase.from('milestones').select('*').eq('trade_id', tradeId).order('sequence'),
        supabase.from('evidence').select('*, profile:profiles(*)').eq('trade_id', tradeId).order('created_at'),
        supabase.from('messages').select('*, profile:profiles(*)').eq('trade_id', tradeId).order('created_at', { ascending: false }).limit(MESSAGES_PER_PAGE),
        supabase.from('disputes').select('*, comments:dispute_comments(*, profile:profiles(*))').eq('trade_id', tradeId),
      ]);

      if (tradeRes.data) setTrade(tradeRes.data as unknown as Trade);
      if (msRes.data) setMilestones(msRes.data as Milestone[]);
      if (evRes.data) setEvidence(evRes.data as unknown as Evidence[]);
      if (msgRes.data) {
        const msgs = (msgRes.data as unknown as Message[]).reverse();
        setMessages(msgs);
        setHasMoreMessages(msgs.length >= MESSAGES_PER_PAGE);
        msgOffsetRef.current = msgs.length;
      }
      if (dispRes.data) setDisputes(dispRes.data as unknown as Dispute[]);
    } finally {
      setLoading(false);
    }
  }, [tradeId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const loadMoreMessages = useCallback(async () => {
    if (!tradeId || loadingMore || !hasMoreMessages) return;
    setLoadingMore(true);
    try {
      const { data } = await supabase
        .from('messages')
        .select('*, profile:profiles(*)')
        .eq('trade_id', tradeId)
        .order('created_at', { ascending: false })
        .range(msgOffsetRef.current, msgOffsetRef.current + MESSAGES_PER_PAGE - 1);

      if (data) {
        const older = (data as unknown as Message[]).reverse();
        setMessages((prev) => [...older, ...prev]);
        msgOffsetRef.current += older.length;
        setHasMoreMessages(older.length >= MESSAGES_PER_PAGE);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [tradeId, loadingMore, hasMoreMessages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !tradeId) return;
    const { data, error } = await supabase
      .from('messages')
      .insert({
        trade_id: tradeId,
        user_id: user.id,
        content,
        reactions: {},
        read_by: [user.id],
      })
      .select('*, profile:profiles(*)')
      .single();

    if (error) throw error;
    setMessages((prev) => [...prev, data as unknown as Message]);
  }, [user, tradeId]);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;

    const reactions = { ...msg.reactions };
    const users = reactions[emoji] ?? [];
    if (users.includes(user.id)) {
      reactions[emoji] = users.filter((id) => id !== user.id);
    } else {
      reactions[emoji] = [...users, user.id];
    }

    await supabase.from('messages').update({ reactions }).eq('id', messageId);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
  }, [user, messages]);

  const uploadEvidence = useCallback(async (milestoneId: string, file: File) => {
    if (!user || !tradeId) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop();
    const path = `${tradeId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('trade-evidence')
      .upload(path, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = await supabase.storage
      .from('trade-evidence')
      .createSignedUrl(path, 3600);

    const { data, error: insertError } = await supabase
      .from('evidence')
      .insert({
        trade_id: tradeId,
        milestone_id: milestoneId,
        user_id: user.id,
        file_url: urlData?.signedUrl ?? path,
        file_name: file.name,
      })
      .select('*, profile:profiles(*)')
      .single();

    if (insertError) throw insertError;
    setEvidence((prev) => [...prev, data as unknown as Evidence]);
  }, [user, tradeId]);

  const openDispute = useCallback(async (milestoneId: string, reason: string) => {
    if (!user || !tradeId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('disputes')
      .insert({
        trade_id: tradeId,
        milestone_id: milestoneId,
        opened_by_user_id: user.id,
        reason,
        status: 'Open',
        escalated: false,
      })
      .select()
      .single();

    if (error) throw error;
    setDisputes((prev) => [...prev, data as unknown as Dispute]);

    // Update trade status
    await supabase.from('trades').update({ status: 'Disputed' }).eq('id', tradeId);
  }, [user, tradeId]);

  const addDisputeComment = useCallback(async (disputeId: string, content: string) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('dispute_comments')
      .insert({
        dispute_id: disputeId,
        user_id: user.id,
        content,
      })
      .select('*, profile:profiles(*)')
      .single();

    if (error) throw error;
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? { ...d, comments: [...(d.comments ?? []), data as unknown as DisputeComment] }
          : d
      )
    );
  }, [user]);

  // Re-export markMilestoneComplete from useTrades for convenience
  const { markMilestoneComplete } = useTrades();

  return {
    trade,
    milestones,
    evidence,
    messages,
    disputes,
    loading,
    hasMoreMessages,
    loadingMore,
    sendMessage,
    addReaction,
    uploadEvidence,
    openDispute,
    addDisputeComment,
    loadMoreMessages,
    markMilestoneComplete,
    refetch: fetchAll,
  };
}
