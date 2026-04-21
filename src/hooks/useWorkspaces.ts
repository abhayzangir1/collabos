import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import type { Workspace, WorkspaceMember, WorkspaceInvitation } from '@/types/database';

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchWorkspaces = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: memberRows } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id);

      if (!memberRows || memberRows.length === 0) {
        setWorkspaces([]);
        setLoading(false);
        return;
      }

      const wsIds = memberRows.map((m) => m.workspace_id);
      const { data, error: fetchError } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', wsIds);

      if (fetchError) throw fetchError;

      const enriched = (data ?? []).map((ws) => {
        const memberRow = memberRows.find((m) => m.workspace_id === ws.id);
        return { ...ws, user_role: memberRow?.role ?? 'Member' } as Workspace;
      });

      setWorkspaces(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const createWorkspace = useCallback(async (name: string, description: string) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error: insertError } = await supabase
      .from('workspaces')
      .insert({ name, description, owner_user_id: user.id })
      .select()
      .single();

    if (insertError) throw insertError;

    const ws = data as Workspace;
    await supabase.from('workspace_members').insert({
      workspace_id: ws.id,
      user_id: user.id,
      role: 'Owner',
    });

    setWorkspaces((prev) => [{ ...ws, user_role: 'Owner' as const }, ...prev]);
    return ws;
  }, [user]);

  const deleteWorkspace = useCallback(async (id: string) => {
    await supabase.from('workspace_members').delete().eq('workspace_id', id);
    await supabase.from('workspace_invitations').delete().eq('workspace_id', id);
    const { error: deleteError } = await supabase.from('workspaces').delete().eq('id', id);
    if (deleteError) throw deleteError;
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return { workspaces, loading, error, createWorkspace, deleteWorkspace, refetch: fetchWorkspaces };
}

export function useWorkspaceDetail(workspaceId: string) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetchDetail = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [wsRes, membersRes, invRes] = await Promise.all([
        supabase.from('workspaces').select('*').eq('id', workspaceId).single(),
        supabase.from('workspace_members').select('*, profile:profiles(*)').eq('workspace_id', workspaceId),
        supabase.from('workspace_invitations').select('*').eq('workspace_id', workspaceId).eq('revoked', false),
      ]);

      if (wsRes.data) {
        const memberRow = (membersRes.data as unknown as WorkspaceMember[])?.find((m) => m.user_id === user?.id);
        setWorkspace({ ...(wsRes.data as Workspace), user_role: memberRow?.role ?? 'Member' });
      }
      if (membersRes.data) setMembers(membersRes.data as unknown as WorkspaceMember[]);
      if (invRes.data) setInvitations(invRes.data as WorkspaceInvitation[]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, user]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const generateInvite = useCallback(async () => {
    if (!user || !workspaceId) throw new Error('Not authenticated');
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('workspace_invitations')
      .insert({
        workspace_id: workspaceId,
        created_by_user_id: user.id,
        token,
        expires_at: expiresAt,
        revoked: false,
      })
      .select()
      .single();

    if (error) throw error;
    setInvitations((prev) => [...prev, data as WorkspaceInvitation]);
    return { token, url: `${window.location.origin}/workspaces/join/${token}` };
  }, [user, workspaceId]);

  const revokeInvite = useCallback(async (inviteId: string) => {
    await supabase.from('workspace_invitations').update({ revoked: true }).eq('id', inviteId);
    setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
  }, []);

  const changeMemberRole = useCallback(async (memberId: string, role: 'Admin' | 'Member') => {
    await supabase.from('workspace_members').update({ role }).eq('id', memberId);
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
  }, []);

  const removeMember = useCallback(async (memberId: string) => {
    await supabase.from('workspace_members').delete().eq('id', memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }, []);

  const updateWorkspace = useCallback(async (updates: Partial<Workspace>) => {
    if (!workspaceId) return;
    const { error } = await supabase.from('workspaces').update(updates).eq('id', workspaceId);
    if (error) throw error;
    setWorkspace((prev) => prev ? { ...prev, ...updates } : null);
  }, [workspaceId]);

  return {
    workspace,
    members,
    invitations,
    loading,
    generateInvite,
    revokeInvite,
    changeMemberRole,
    removeMember,
    updateWorkspace,
    refetch: fetchDetail,
  };
}
