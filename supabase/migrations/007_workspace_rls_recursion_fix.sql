-- CollabOS: Remove recursive workspace RLS checks

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_workspace_member(p_workspace_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION private.is_workspace_admin(p_workspace_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = p_user_id
      AND role IN ('Owner', 'Admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

REVOKE EXECUTE ON FUNCTION private.is_workspace_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.is_workspace_admin(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_workspace_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_workspace_admin(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "Workspaces: member read" ON workspaces;
DROP POLICY IF EXISTS "Workspaces: owner read" ON workspaces;
CREATE POLICY "Workspaces: owner or member read" ON workspaces
  FOR SELECT
  USING (
    owner_user_id = (SELECT auth.uid())
    OR private.is_workspace_member(id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "WS Members: member read" ON workspace_members;
CREATE POLICY "WS Members: member read" ON workspace_members
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR private.is_workspace_member(workspace_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "WS Members: owner self insert" ON workspace_members;
DROP POLICY IF EXISTS "WS Members: admin insert" ON workspace_members;
CREATE POLICY "WS Members: owner self insert" ON workspace_members
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND role = 'Owner'
    AND EXISTS (
      SELECT 1
      FROM workspaces
      WHERE workspaces.id = workspace_members.workspace_id
        AND workspaces.owner_user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "WS Members: admin insert" ON workspace_members
  FOR INSERT
  WITH CHECK (
    role IN ('Admin', 'Member')
    AND private.is_workspace_admin(workspace_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "WS Members: admin update" ON workspace_members;
CREATE POLICY "WS Members: admin update" ON workspace_members
  FOR UPDATE
  USING (private.is_workspace_admin(workspace_id, (SELECT auth.uid())))
  WITH CHECK (private.is_workspace_admin(workspace_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "WS Members: admin delete" ON workspace_members;
CREATE POLICY "WS Members: admin delete" ON workspace_members
  FOR DELETE
  USING (private.is_workspace_admin(workspace_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "WS Invites: member read" ON workspace_invitations;
CREATE POLICY "WS Invites: member read" ON workspace_invitations
  FOR SELECT
  USING (private.is_workspace_member(workspace_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "WS Invites: admin insert" ON workspace_invitations;
CREATE POLICY "WS Invites: admin insert" ON workspace_invitations
  FOR INSERT
  WITH CHECK (
    created_by_user_id = (SELECT auth.uid())
    AND private.is_workspace_admin(workspace_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "WS Invites: admin update" ON workspace_invitations;
CREATE POLICY "WS Invites: admin update" ON workspace_invitations
  FOR UPDATE
  USING (private.is_workspace_admin(workspace_id, (SELECT auth.uid())))
  WITH CHECK (private.is_workspace_admin(workspace_id, (SELECT auth.uid())));
