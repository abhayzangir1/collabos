-- CollabOS: Fix workspace bootstrap RLS policies

CREATE POLICY "Workspaces: owner read" ON workspaces
  FOR SELECT
  USING ((SELECT auth.uid()) = owner_user_id);

DROP POLICY IF EXISTS "WS Members: member read" ON workspace_members;
CREATE POLICY "WS Members: member read" ON workspace_members
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM workspaces
      WHERE workspaces.id = workspace_members.workspace_id
        AND workspaces.owner_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "WS Members: admin update" ON workspace_members;
CREATE POLICY "WS Members: admin update" ON workspace_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces
      WHERE workspaces.id = workspace_members.workspace_id
        AND workspaces.owner_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "WS Members: admin delete" ON workspace_members;
CREATE POLICY "WS Members: admin delete" ON workspace_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces
      WHERE workspaces.id = workspace_members.workspace_id
        AND workspaces.owner_user_id = (SELECT auth.uid())
    )
  );
