-- CollabOS: production database hardening

CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id
  ON activity_feed(user_id);

CREATE INDEX IF NOT EXISTS idx_dispute_comments_dispute_id
  ON dispute_comments(dispute_id);

CREATE INDEX IF NOT EXISTS idx_dispute_comments_user_id
  ON dispute_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_disputes_milestone_id
  ON disputes(milestone_id);

CREATE INDEX IF NOT EXISTS idx_disputes_opened_by_user_id
  ON disputes(opened_by_user_id);

CREATE INDEX IF NOT EXISTS idx_evidence_milestone_id
  ON evidence(milestone_id);

CREATE INDEX IF NOT EXISTS idx_evidence_user_id
  ON evidence(user_id);

CREATE INDEX IF NOT EXISTS idx_listings_workspace_id
  ON listings(workspace_id);

CREATE INDEX IF NOT EXISTS idx_messages_user_id
  ON messages(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id
  ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_trades_workspace_id
  ON trades(workspace_id);

CREATE INDEX IF NOT EXISTS idx_trades_listing_id
  ON trades(listing_id);

CREATE INDEX IF NOT EXISTS idx_workspace_invitations_created_by_user_id
  ON workspace_invitations(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_workspace_invitations_workspace_id
  ON workspace_invitations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner_user_id
  ON workspaces(owner_user_id);

CREATE OR REPLACE FUNCTION private.is_trade_participant(p_trade_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trades
    WHERE id = p_trade_id
      AND (proposer_user_id = p_user_id OR recipient_user_id = p_user_id)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION private.is_trade_participant(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_trade_participant(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_trade_integrity()
RETURNS TRIGGER AS $$
DECLARE
  v_listing_owner UUID;
BEGIN
  IF NEW.proposer_user_id = NEW.recipient_user_id THEN
    RAISE EXCEPTION 'Users cannot propose trades with themselves.';
  END IF;

  IF NEW.listing_id IS NOT NULL THEN
    SELECT user_id INTO v_listing_owner
    FROM listings
    WHERE id = NEW.listing_id;

    IF v_listing_owner IS NULL THEN
      RAISE EXCEPTION 'Listing not found.';
    END IF;

    IF NEW.recipient_user_id <> v_listing_owner THEN
      RAISE EXCEPTION 'Trade recipient must own the selected listing.';
    END IF;

    IF NEW.proposer_user_id = v_listing_owner THEN
      RAISE EXCEPTION 'Users cannot propose trades against their own listings.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tr_validate_trade_integrity ON trades;
CREATE TRIGGER tr_validate_trade_integrity
  BEFORE INSERT OR UPDATE OF listing_id, proposer_user_id, recipient_user_id
  ON trades
  FOR EACH ROW
  EXECUTE FUNCTION validate_trade_integrity();

CREATE OR REPLACE FUNCTION public.prevent_active_listing_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM trades
    WHERE listing_id = OLD.id
      AND status IN ('Proposed', 'Active')
  ) THEN
    RAISE EXCEPTION 'This listing is linked to an active trade and cannot be deleted.';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tr_prevent_active_listing_delete ON listings;
CREATE TRIGGER tr_prevent_active_listing_delete
  BEFORE DELETE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_active_listing_delete();

DROP POLICY IF EXISTS "Evidence: owner insert" ON evidence;
CREATE POLICY "Evidence: participant insert" ON evidence
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM trades t
      JOIN milestones m ON m.trade_id = t.id
      WHERE t.id = evidence.trade_id
        AND m.id = evidence.milestone_id
        AND (t.proposer_user_id = (SELECT auth.uid()) OR t.recipient_user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Messages: participant insert" ON messages;
CREATE POLICY "Messages: participant insert" ON messages
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND private.is_trade_participant(trade_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Disputes: opener insert" ON disputes;
CREATE POLICY "Disputes: participant insert" ON disputes
  FOR INSERT
  WITH CHECK (
    opened_by_user_id = (SELECT auth.uid())
    AND length(trim(reason)) >= 20
    AND EXISTS (
      SELECT 1
      FROM trades t
      JOIN milestones m ON m.trade_id = t.id
      WHERE t.id = disputes.trade_id
        AND m.id = disputes.milestone_id
        AND (t.proposer_user_id = (SELECT auth.uid()) OR t.recipient_user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Dispute Comments: insert" ON dispute_comments;
CREATE POLICY "Dispute Comments: participant insert" ON dispute_comments
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM disputes d
      JOIN trades t ON t.id = d.trade_id
      WHERE d.id = dispute_comments.dispute_id
        AND (t.proposer_user_id = (SELECT auth.uid()) OR t.recipient_user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Activity Feed: authenticated insert" ON activity_feed;
CREATE POLICY "Activity Feed: authenticated insert" ON activity_feed
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND event_type IN (
      'trade_proposal_received',
      'milestone_completed',
      'dispute_opened',
      'dispute_updated',
      'endorsement_received',
      'workspace_invitation_accepted',
      'trade_accepted',
      'trade_declined'
    )
  );

DROP POLICY IF EXISTS "Proof media: owner read" ON storage.objects;
DROP POLICY IF EXISTS "Proof media: owner upload" ON storage.objects;
DROP POLICY IF EXISTS "Trade evidence: participant read" ON storage.objects;
DROP POLICY IF EXISTS "Trade evidence: participant upload" ON storage.objects;

CREATE POLICY "Proof media: owner read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'proof-media'
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Proof media: owner upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'proof-media'
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Trade evidence: participant read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'trade-evidence'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND private.is_trade_participant(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))
  );

CREATE POLICY "Trade evidence: participant upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'trade-evidence'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND private.is_trade_participant(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))
  );

UPDATE storage.buckets
SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
WHERE id IN ('proof-media', 'trade-evidence');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'listings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
  END IF;
END;
$$;
