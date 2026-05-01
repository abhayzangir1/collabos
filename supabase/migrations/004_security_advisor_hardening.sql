-- CollabOS: Security advisor hardening

-- Canonical skill tags are seeded reference data used by the app model.
CREATE POLICY "Skill tags: public read" ON skill_tags FOR SELECT USING (true);

-- Tighten permissive insert policies flagged by Supabase advisors.
DROP POLICY IF EXISTS "Audit: authenticated insert" ON audit_log;
CREATE POLICY "Audit: failed login insert" ON audit_log
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL AND event_type = 'failed_login');
CREATE POLICY "Audit: authenticated insert" ON audit_log
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND (user_id IS NULL OR user_id = (SELECT auth.uid())));

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
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = (SELECT auth.uid())
        AND wm.role IN ('Owner', 'Admin')
    )
  );

-- RPCs are callable by authenticated users only and must not trust client-supplied user ids.
CREATE OR REPLACE FUNCTION confirm_milestone(p_milestone_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_trade RECORD;
  v_milestone RECORD;
  v_is_proposer BOOLEAN;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'User id does not match authenticated session';
  END IF;

  SELECT * INTO v_milestone FROM milestones WHERE id = p_milestone_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Milestone not found';
  END IF;

  SELECT * INTO v_trade FROM trades WHERE id = v_milestone.trade_id FOR SHARE;

  IF v_trade.proposer_user_id = p_user_id THEN
    v_is_proposer := TRUE;
  ELSIF v_trade.recipient_user_id = p_user_id THEN
    v_is_proposer := FALSE;
  ELSE
    RAISE EXCEPTION 'User is not a participant in this trade';
  END IF;

  IF EXISTS (
    SELECT 1 FROM disputes
    WHERE milestone_id = p_milestone_id
    AND status IN ('Open', 'Under Review')
  ) THEN
    RAISE EXCEPTION 'Cannot confirm milestone while a dispute is open';
  END IF;

  IF v_is_proposer THEN
    v_milestone.party_a_confirmed := TRUE;
  ELSE
    v_milestone.party_b_confirmed := TRUE;
  END IF;

  IF v_milestone.party_a_confirmed AND v_milestone.party_b_confirmed THEN
    UPDATE milestones
    SET party_a_confirmed = v_milestone.party_a_confirmed,
        party_b_confirmed = v_milestone.party_b_confirmed,
        status = 'Completed'
    WHERE id = p_milestone_id;

    IF NOT EXISTS (
      SELECT 1 FROM milestones
      WHERE trade_id = v_trade.id
      AND id != p_milestone_id
      AND status != 'Completed'
    ) THEN
      UPDATE trades SET status = 'Completed', completed_at = NOW() WHERE id = v_trade.id;
    ELSE
      UPDATE milestones SET status = 'In Progress'
      WHERE trade_id = v_trade.id
      AND sequence = v_milestone.sequence + 1;
    END IF;
  ELSE
    UPDATE milestones
    SET party_a_confirmed = v_milestone.party_a_confirmed,
        party_b_confirmed = v_milestone.party_b_confirmed,
        status = 'Awaiting Confirmation'
    WHERE id = p_milestone_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION toggle_message_reaction(p_message_id UUID, p_user_id UUID, p_emoji TEXT)
RETURNS JSONB AS $$
DECLARE
  v_message RECORD;
  v_reactions JSONB;
  v_users JSONB;
  v_index INT;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'User id does not match authenticated session';
  END IF;

  SELECT * INTO v_message FROM messages WHERE id = p_message_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  v_reactions := v_message.reactions;

  IF NOT v_reactions ? p_emoji THEN
    v_reactions := jsonb_set(v_reactions, ARRAY[p_emoji], jsonb_build_array(p_user_id));
  ELSE
    v_users := v_reactions->p_emoji;

    v_index := -1;
    SELECT position - 1 INTO v_index
    FROM jsonb_array_elements_text(v_users) WITH ORDINALITY arr(elem, position)
    WHERE elem = p_user_id::text;

    IF v_index >= 0 THEN
      v_users := v_users - v_index;
    ELSE
      v_users := v_users || jsonb_build_array(p_user_id);
    END IF;

    v_reactions := jsonb_set(v_reactions, ARRAY[p_emoji], v_users);
  END IF;

  UPDATE messages SET reactions = v_reactions WHERE id = p_message_id;
  RETURN jsonb_build_object('success', true, 'reactions', v_reactions);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.recalculate_trust_score(UUID, TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION public.on_trade_completed() SET search_path = public, pg_temp;
ALTER FUNCTION public.on_proof_change() SET search_path = public, pg_temp;
ALTER FUNCTION public.escalate_old_disputes() SET search_path = public, pg_temp;
ALTER FUNCTION public.enforce_trade_status() SET search_path = public, pg_temp;
ALTER FUNCTION public.enforce_milestone_status() SET search_path = public, pg_temp;
ALTER FUNCTION public.rls_auto_enable() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.confirm_milestone(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_milestone(UUID, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.toggle_message_reaction(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_message_reaction(UUID, UUID, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_trust_score(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_trade_completed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_proof_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.escalate_old_disputes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_trade_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_milestone_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
