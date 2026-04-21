-- CollabOS: Complete Database Schema Migration
-- Run this in the Supabase SQL Editor

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mononym TEXT NOT NULL,
  email TEXT NOT NULL,
  dna_type TEXT NOT NULL DEFAULT 'Builder',
  custom_dna_label TEXT,
  custom_dna_tags TEXT[] DEFAULT '{}',
  current_trust_score INTEGER NOT NULL DEFAULT 0,
  pinned_proofs UUID[] DEFAULT '{}',
  preferred_language TEXT NOT NULL DEFAULT 'en',
  preferred_theme TEXT NOT NULL DEFAULT 'dark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Proofs
CREATE TABLE IF NOT EXISTS proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  skill_tags JSONB NOT NULL DEFAULT '[]',
  value TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  external_link TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proofs_user_id ON proofs(user_id);

-- Skill Tags (canonical library)
CREATE TABLE IF NOT EXISTS skill_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL,
  label TEXT NOT NULL,
  UNIQUE(domain, label)
);

-- Listings
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workspace_id UUID,
  skill_offered TEXT NOT NULL,
  skill_offered_tags JSONB NOT NULL DEFAULT '[]',
  skill_requested TEXT NOT NULL,
  skill_requested_tags JSONB NOT NULL DEFAULT '[]',
  hours_range INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(is_active);

-- Trades
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id),
  proposer_user_id UUID NOT NULL REFERENCES profiles(id),
  recipient_user_id UUID NOT NULL REFERENCES profiles(id),
  workspace_id UUID,
  status TEXT NOT NULL DEFAULT 'Proposed'
    CHECK (status IN ('Proposed', 'Active', 'Completed', 'Declined', 'Disputed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trades_proposer ON trades(proposer_user_id);
CREATE INDEX IF NOT EXISTS idx_trades_recipient ON trades(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'In Progress', 'Awaiting Confirmation', 'Completed')),
  party_a_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  party_b_confirmed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_milestones_trade ON milestones(trade_id);

-- Evidence
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  file_url TEXT,
  file_name TEXT,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_trade ON evidence(trade_id);

-- Messages (Trade Chat)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  reactions JSONB NOT NULL DEFAULT '{}',
  read_by UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_trade ON messages(trade_id);

-- Disputes
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  opened_by_user_id UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open'
    CHECK (status IN ('Open', 'Under Review', 'Resolved')),
  escalated BOOLEAN NOT NULL DEFAULT FALSE,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_disputes_trade ON disputes(trade_id);

-- Dispute Comments
CREATE TABLE IF NOT EXISTS dispute_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trust Score History
CREATE TABLE IF NOT EXISTS trust_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  new_score INTEGER NOT NULL,
  delta INTEGER NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_history_user ON trust_score_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_history_date ON trust_score_history(created_at);

-- Activity Feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  recipient_user_id UUID NOT NULL REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_recipient ON activity_feed(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_feed(created_at DESC);

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owner_user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspace Members
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'Member'
    CHECK (role IN ('Owner', 'Admin', 'Member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ws_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ws_members_user ON workspace_members(user_id);

-- Workspace Invitations
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES profiles(id),
  token UUID NOT NULL DEFAULT uuid_generate_v4(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ws_invites_token ON workspace_invitations(token);

-- Telemetry Tracks (Custom Analytics)
CREATE TABLE IF NOT EXISTS telemetry_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  track_name TEXT NOT NULL,
  skill_tags JSONB NOT NULL DEFAULT '[]',
  metric_type TEXT NOT NULL
    CHECK (metric_type IN ('trade_frequency', 'proof_additions', 'hours_exchanged')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_user ON telemetry_tracks(user_id);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL
    CHECK (event_type IN ('password_change', 'failed_login', 'unauthorized_access')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);

-- Sessions (tracked sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_label TEXT NOT NULL DEFAULT 'Unknown Device',
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FOREIGN KEY FOR WORKSPACE REFERENCES
-- ============================================================
ALTER TABLE listings ADD CONSTRAINT fk_listings_workspace
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

ALTER TABLE trades ADD CONSTRAINT fk_trades_workspace
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- ============================================================
-- APP PIPELINE DATA ENFORCEMENT TRIGGERS
-- ============================================================

-- Auth User Trigger for Profile Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, mononym, email, dna_type, custom_dna_label, custom_dna_tags)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'mononym', 'Unknown'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'dna_type', 'Builder'),
    NEW.raw_user_meta_data->>'custom_dna_label',
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'custom_dna_tags', '[]'::jsonb)))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_proofs_updated_at BEFORE UPDATE ON proofs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trust Score Recalculation Function
CREATE OR REPLACE FUNCTION recalculate_trust_score(p_user_id UUID, p_event_type TEXT)
RETURNS VOID AS $$
DECLARE
  v_trades_completed INTEGER;
  v_verified_proofs INTEGER;
  v_unverified_proofs INTEGER;
  v_endorsements INTEGER;
  v_new_score INTEGER;
  v_old_score INTEGER;
  v_delta INTEGER;
BEGIN
  -- Get current score
  SELECT current_trust_score INTO v_old_score FROM profiles WHERE id = p_user_id;

  -- Count completed trades
  SELECT COUNT(*) INTO v_trades_completed
  FROM trades
  WHERE (proposer_user_id = p_user_id OR recipient_user_id = p_user_id)
    AND status = 'Completed';

  -- Count verified (locked) proofs
  SELECT COUNT(*) INTO v_verified_proofs
  FROM proofs
  WHERE user_id = p_user_id AND is_locked = TRUE;

  -- Count unverified proofs
  SELECT COUNT(*) INTO v_unverified_proofs
  FROM proofs
  WHERE user_id = p_user_id AND is_locked = FALSE;

  -- Endorsements: placeholder for future
  v_endorsements := 0;

  -- Calculate: (Trades × 10) + (Verified × 8) + (Unverified × 3) + (Endorsements × 2)
  v_new_score := (v_trades_completed * 10) + (v_verified_proofs * 8) + (v_unverified_proofs * 3) + (v_endorsements * 2);
  v_delta := v_new_score - COALESCE(v_old_score, 0);

  -- Update profile
  UPDATE profiles SET current_trust_score = v_new_score WHERE id = p_user_id;

  -- Log history
  INSERT INTO trust_score_history (user_id, new_score, delta, event_type)
  VALUES (p_user_id, v_new_score, v_delta, p_event_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Recalculate trust on trade completion
CREATE OR REPLACE FUNCTION on_trade_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
    PERFORM recalculate_trust_score(NEW.proposer_user_id, 'trade_completed');
    PERFORM recalculate_trust_score(NEW.recipient_user_id, 'trade_completed');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_trade_completed AFTER UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION on_trade_completed();

-- Trigger: Recalculate trust on proof add/lock
CREATE OR REPLACE FUNCTION on_proof_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM recalculate_trust_score(NEW.user_id, 'proof_added');
  ELSIF TG_OP = 'UPDATE' AND NEW.is_locked = TRUE AND OLD.is_locked = FALSE THEN
    PERFORM recalculate_trust_score(NEW.user_id, 'proof_verified');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_proof_change AFTER INSERT OR UPDATE ON proofs
  FOR EACH ROW EXECUTE FUNCTION on_proof_change();

-- Trigger: Auto-escalate disputes after 7 days
CREATE OR REPLACE FUNCTION escalate_old_disputes()
RETURNS VOID AS $$
BEGIN
  UPDATE disputes
  SET escalated = TRUE, status = 'Under Review'
  WHERE status = 'Open'
    AND escalated = FALSE
    AND opened_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Enforce Trade Status Progression
CREATE OR REPLACE FUNCTION enforce_trade_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
    IF EXISTS (SELECT 1 FROM milestones WHERE trade_id = NEW.id AND status != 'Completed') THEN
      RAISE EXCEPTION 'Cannot complete trade with pending milestones';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_enforce_trade_status
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION enforce_trade_status();

-- Trigger: Enforce Milestone Completion
CREATE OR REPLACE FUNCTION enforce_milestone_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
    IF NEW.party_a_confirmed = FALSE OR NEW.party_b_confirmed = FALSE THEN
      RAISE EXCEPTION 'Both parties must confirm before milestone is Completed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_enforce_milestone_status
  BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION enforce_milestone_status();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read, owners can update
CREATE POLICY "Profiles: public read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: owner update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles: owner insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Proofs: Public read, owner write
CREATE POLICY "Proofs: public read" ON proofs FOR SELECT USING (true);
CREATE POLICY "Proofs: owner insert" ON proofs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Proofs: owner update" ON proofs FOR UPDATE USING (auth.uid() = user_id AND is_locked = FALSE);
CREATE POLICY "Proofs: owner delete" ON proofs FOR DELETE USING (auth.uid() = user_id AND is_locked = FALSE);

-- Listings: Public read, owner write
CREATE POLICY "Listings: public read" ON listings FOR SELECT USING (true);
CREATE POLICY "Listings: owner insert" ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Listings: owner update" ON listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Listings: owner delete" ON listings FOR DELETE USING (auth.uid() = user_id);

-- Trades: Participants can read, proposer can insert
CREATE POLICY "Trades: participant read" ON trades FOR SELECT
  USING (auth.uid() = proposer_user_id OR auth.uid() = recipient_user_id);
CREATE POLICY "Trades: proposer insert" ON trades FOR INSERT
  WITH CHECK (auth.uid() = proposer_user_id AND status = 'Proposed');
CREATE POLICY "Trades: participant update" ON trades FOR UPDATE
  USING (auth.uid() = proposer_user_id OR auth.uid() = recipient_user_id);

-- Milestones: Trade participants can read/update
CREATE POLICY "Milestones: trade participant read" ON milestones FOR SELECT
  USING (EXISTS (SELECT 1 FROM trades WHERE trades.id = milestones.trade_id AND (trades.proposer_user_id = auth.uid() OR trades.recipient_user_id = auth.uid())));
CREATE POLICY "Milestones: trade participant insert" ON milestones FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM trades WHERE trades.id = trade_id AND trades.proposer_user_id = auth.uid()));
CREATE POLICY "Milestones: trade participant update" ON milestones FOR UPDATE
  USING (EXISTS (SELECT 1 FROM trades WHERE trades.id = milestones.trade_id AND (trades.proposer_user_id = auth.uid() OR trades.recipient_user_id = auth.uid())));

-- Evidence: Trade participants
CREATE POLICY "Evidence: trade participant read" ON evidence FOR SELECT
  USING (EXISTS (SELECT 1 FROM trades WHERE trades.id = evidence.trade_id AND (trades.proposer_user_id = auth.uid() OR trades.recipient_user_id = auth.uid())));
CREATE POLICY "Evidence: owner insert" ON evidence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Messages: Trade participants
CREATE POLICY "Messages: trade participant read" ON messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM trades WHERE trades.id = messages.trade_id AND (trades.proposer_user_id = auth.uid() OR trades.recipient_user_id = auth.uid())));
CREATE POLICY "Messages: participant insert" ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Messages: participant update" ON messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM trades WHERE trades.id = messages.trade_id AND (trades.proposer_user_id = auth.uid() OR trades.recipient_user_id = auth.uid())));

-- Disputes: Trade participants
CREATE POLICY "Disputes: trade participant read" ON disputes FOR SELECT
  USING (EXISTS (SELECT 1 FROM trades WHERE trades.id = disputes.trade_id AND (trades.proposer_user_id = auth.uid() OR trades.recipient_user_id = auth.uid())));
CREATE POLICY "Disputes: opener insert" ON disputes FOR INSERT
  WITH CHECK (auth.uid() = opened_by_user_id);

-- Dispute Comments: Trade participants
CREATE POLICY "Dispute Comments: read" ON dispute_comments FOR SELECT
  USING (EXISTS (SELECT 1 FROM disputes d JOIN trades t ON t.id = d.trade_id WHERE d.id = dispute_comments.dispute_id AND (t.proposer_user_id = auth.uid() OR t.recipient_user_id = auth.uid())));
CREATE POLICY "Dispute Comments: insert" ON dispute_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trust Score History: Owner read
CREATE POLICY "Trust History: owner read" ON trust_score_history FOR SELECT
  USING (auth.uid() = user_id);

-- Activity Feed: Recipient read
CREATE POLICY "Activity Feed: recipient read" ON activity_feed FOR SELECT
  USING (auth.uid() = recipient_user_id);
CREATE POLICY "Activity Feed: authenticated insert" ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Activity Feed: recipient update" ON activity_feed FOR UPDATE
  USING (auth.uid() = recipient_user_id);

-- Workspaces: Members can read
CREATE POLICY "Workspaces: member read" ON workspaces FOR SELECT
  USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_members.workspace_id = workspaces.id AND workspace_members.user_id = auth.uid()));
CREATE POLICY "Workspaces: owner insert" ON workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Workspaces: owner update" ON workspaces FOR UPDATE
  USING (auth.uid() = owner_user_id);
CREATE POLICY "Workspaces: owner delete" ON workspaces FOR DELETE
  USING (auth.uid() = owner_user_id);

-- Workspace Members
CREATE POLICY "WS Members: member read" ON workspace_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "WS Members: admin insert" ON workspace_members FOR INSERT
  WITH CHECK (true); -- Invitation acceptance handled at app level
CREATE POLICY "WS Members: admin update" ON workspace_members FOR UPDATE
  USING (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('Owner', 'Admin')));
CREATE POLICY "WS Members: admin delete" ON workspace_members FOR DELETE
  USING (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('Owner', 'Admin')));

-- Workspace Invitations
CREATE POLICY "WS Invites: member read" ON workspace_invitations FOR SELECT
  USING (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = workspace_invitations.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "WS Invites: admin insert" ON workspace_invitations FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);
CREATE POLICY "WS Invites: admin update" ON workspace_invitations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = workspace_invitations.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('Owner', 'Admin')));

-- Telemetry Tracks: Owner
CREATE POLICY "Telemetry: owner read" ON telemetry_tracks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Telemetry: owner insert" ON telemetry_tracks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Telemetry: owner delete" ON telemetry_tracks FOR DELETE USING (auth.uid() = user_id);

-- Audit Log: Allow inserts for all authenticated (no read for normal users)
CREATE POLICY "Audit: authenticated insert" ON audit_log FOR INSERT WITH CHECK (true);

-- Sessions: Owner
CREATE POLICY "Sessions: owner read" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sessions: owner insert" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- REALTIME PUBLICATIONS
-- ============================================================
ALTER publication supabase_realtime ADD TABLE profiles;
ALTER publication supabase_realtime ADD TABLE proofs;
ALTER publication supabase_realtime ADD TABLE trades;
ALTER publication supabase_realtime ADD TABLE milestones;
ALTER publication supabase_realtime ADD TABLE messages;
ALTER publication supabase_realtime ADD TABLE activity_feed;
ALTER publication supabase_realtime ADD TABLE disputes;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('proof-media', 'proof-media', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('trade-evidence', 'trade-evidence', false) ON CONFLICT DO NOTHING;

-- Storage Policies
CREATE POLICY "Proof media: owner upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'proof-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Proof media: owner read" ON storage.objects FOR SELECT
  USING (bucket_id = 'proof-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Trade evidence: participant upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'trade-evidence');
CREATE POLICY "Trade evidence: participant read" ON storage.objects FOR SELECT
  USING (bucket_id = 'trade-evidence');

-- ============================================================
-- SEED DATA: Skill Tags Library
-- ============================================================
INSERT INTO skill_tags (domain, label) VALUES
  -- Engineering
  ('Engineering', 'React'), ('Engineering', 'TypeScript'), ('Engineering', 'Node.js'),
  ('Engineering', 'Python'), ('Engineering', 'Go'), ('Engineering', 'Rust'),
  ('Engineering', 'AWS'), ('Engineering', 'Docker'), ('Engineering', 'Kubernetes'),
  ('Engineering', 'PostgreSQL'), ('Engineering', 'GraphQL'), ('Engineering', 'REST API'),
  ('Engineering', 'CI/CD'), ('Engineering', 'System Design'), ('Engineering', 'Mobile Development'),
  -- Design
  ('Design', 'Figma'), ('Design', 'UI Design'), ('Design', 'UX Design'),
  ('Design', 'Illustration'), ('Design', 'Branding'), ('Design', 'Motion Design'),
  ('Design', 'Design Systems'), ('Design', 'Prototyping'), ('Design', 'User Research'),
  ('Design', 'Accessibility'), ('Design', 'Web Design'), ('Design', 'Icon Design'),
  -- Marketing
  ('Marketing', 'SEO'), ('Marketing', 'Content Marketing'), ('Marketing', 'Social Media'),
  ('Marketing', 'Email Marketing'), ('Marketing', 'PPC'), ('Marketing', 'Analytics'),
  ('Marketing', 'Growth Hacking'), ('Marketing', 'Copywriting'), ('Marketing', 'Brand Strategy'),
  ('Marketing', 'Influencer Marketing'), ('Marketing', 'Video Marketing'),
  -- Writing
  ('Writing', 'Technical Writing'), ('Writing', 'Blog Writing'), ('Writing', 'Copywriting'),
  ('Writing', 'Content Strategy'), ('Writing', 'Editing'), ('Writing', 'Ghostwriting'),
  ('Writing', 'Script Writing'), ('Writing', 'UX Writing'), ('Writing', 'Grant Writing'),
  ('Writing', 'Academic Writing'),
  -- Data & Analytics
  ('Data & Analytics', 'Data Analysis'), ('Data & Analytics', 'Machine Learning'),
  ('Data & Analytics', 'Data Visualization'), ('Data & Analytics', 'SQL'),
  ('Data & Analytics', 'Python'), ('Data & Analytics', 'R'),
  ('Data & Analytics', 'Tableau'), ('Data & Analytics', 'Power BI'),
  ('Data & Analytics', 'Statistical Modeling'), ('Data & Analytics', 'ETL'),
  ('Data & Analytics', 'Big Data'), ('Data & Analytics', 'A/B Testing'),
  -- Operations
  ('Operations', 'Project Management'), ('Operations', 'Agile/Scrum'),
  ('Operations', 'Process Optimization'), ('Operations', 'Supply Chain'),
  ('Operations', 'Quality Assurance'), ('Operations', 'DevOps'),
  ('Operations', 'Risk Management'), ('Operations', 'Vendor Management'),
  ('Operations', 'Logistics'), ('Operations', 'Lean Six Sigma'),
  -- Legal & Finance
  ('Legal & Finance', 'Contract Law'), ('Legal & Finance', 'Intellectual Property'),
  ('Legal & Finance', 'Tax Planning'), ('Legal & Finance', 'Financial Modeling'),
  ('Legal & Finance', 'Bookkeeping'), ('Legal & Finance', 'Compliance'),
  ('Legal & Finance', 'Fundraising'), ('Legal & Finance', 'Budgeting'),
  ('Legal & Finance', 'Auditing'), ('Legal & Finance', 'Corporate Law'),
  -- Others
  ('Others', 'Photography'), ('Others', 'Video Production'),
  ('Others', 'Music Production'), ('Others', 'Translation'),
  ('Others', 'Coaching'), ('Others', 'Public Speaking'),
  ('Others', 'Community Management'), ('Others', 'Event Planning'),
  ('Others', 'Virtual Assistance'), ('Others', 'Customer Support')
ON CONFLICT DO NOTHING;
