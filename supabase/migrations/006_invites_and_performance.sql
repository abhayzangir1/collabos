-- CollabOS: Workspace invite acceptance and query performance

CREATE INDEX IF NOT EXISTS idx_trades_proposer_status_created
  ON trades(proposer_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trades_recipient_status_created
  ON trades(recipient_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_recipient_created
  ON activity_feed(recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listings_active_created
  ON listings(is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_trade_created
  ON messages(trade_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trust_history_user_created
  ON trust_score_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workspace_invites_token_active
  ON workspace_invitations(token)
  WHERE revoked = false;

CREATE OR REPLACE FUNCTION public.accept_workspace_invitation(p_token UUID)
RETURNS UUID AS $$
DECLARE
  v_invitation workspace_invitations%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO v_invitation
  FROM workspace_invitations
  WHERE token = p_token
    AND revoked = false
    AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This invitation is invalid or has expired.';
  END IF;

  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (v_invitation.workspace_id, v_user_id, 'Member')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  INSERT INTO activity_feed (user_id, recipient_user_id, event_type, metadata, is_read)
  VALUES (
    v_user_id,
    v_invitation.created_by_user_id,
    'workspace_invitation_accepted',
    jsonb_build_object('workspace_id', v_invitation.workspace_id),
    false
  );

  RETURN v_invitation.workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.accept_workspace_invitation(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_workspace_invitation(UUID) TO authenticated;
