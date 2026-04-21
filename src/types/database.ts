export interface Profile {
  id: string;
  mononym: string;
  dna_type: DnaType | 'Custom';
  custom_dna_label: string | null;
  custom_dna_tags: string[];
  current_trust_score: number;
  pinned_proofs: string[];
  preferred_language: string;
  preferred_theme: 'light' | 'dark';
  created_at: string;
  updated_at: string;
}

export type DnaType = 'Builder' | 'Visionary' | 'Strategist' | 'Connector' | 'Analyst' | 'Operator';

export interface Proof {
  id: string;
  user_id: string;
  title: string;
  description: string;
  skill_tags: SkillTag[];
  value: string;
  media_url: string | null;
  external_link: string | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface SkillTag {
  domain: string;
  label: string;
}

export interface SkillTagRecord {
  id: string;
  domain: string;
  label: string;
}

export interface Listing {
  id: string;
  user_id: string;
  workspace_id: string | null;
  skill_offered: string;
  skill_offered_tags: SkillTag[];
  skill_requested: string;
  skill_requested_tags: SkillTag[];
  hours_range: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  profile?: Profile;
}

export type TradeStatus = 'Proposed' | 'Active' | 'Completed' | 'Declined' | 'Disputed';

export interface Trade {
  id: string;
  listing_id: string;
  proposer_user_id: string;
  recipient_user_id: string;
  workspace_id: string | null;
  status: TradeStatus;
  created_at: string;
  completed_at: string | null;
  // Joined
  proposer?: Profile;
  recipient?: Profile;
  listing?: Listing;
  milestones?: Milestone[];
}

export type MilestoneStatus = 'Pending' | 'In Progress' | 'Awaiting Confirmation' | 'Completed';

export interface Milestone {
  id: string;
  trade_id: string;
  sequence: number;
  title: string;
  description: string;
  due_date: string;
  status: MilestoneStatus;
  party_a_confirmed: boolean;
  party_b_confirmed: boolean;
}

export interface Evidence {
  id: string;
  trade_id: string;
  milestone_id: string;
  user_id: string;
  file_url: string | null;
  file_name: string | null;
  link: string | null;
  created_at: string;
  // Joined
  profile?: Profile;
}

export interface Message {
  id: string;
  trade_id: string;
  user_id: string;
  content: string;
  reactions: Record<string, string[]>;
  read_by: string[];
  created_at: string;
  // Joined
  profile?: Profile;
}

export type DisputeStatus = 'Open' | 'Under Review' | 'Resolved';

export interface Dispute {
  id: string;
  trade_id: string;
  milestone_id: string;
  opened_by_user_id: string;
  reason: string;
  status: DisputeStatus;
  escalated: boolean;
  opened_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
  comments?: DisputeComment[];
}

export interface DisputeComment {
  id: string;
  dispute_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface TrustScoreHistory {
  id: string;
  user_id: string;
  new_score: number;
  delta: number;
  event_type: string;
  created_at: string;
}

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  recipient_user_id: string;
  event_type: ActivityEventType;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export type ActivityEventType =
  | 'trade_proposal_received'
  | 'milestone_completed'
  | 'dispute_opened'
  | 'dispute_updated'
  | 'endorsement_received'
  | 'workspace_invitation_accepted'
  | 'trade_accepted'
  | 'trade_declined';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  user_role?: WorkspaceRole;
}

export type WorkspaceRole = 'Owner' | 'Admin' | 'Member';

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  profile?: Profile;
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  created_by_user_id: string;
  token: string;
  expires_at: string;
  revoked: boolean;
  created_at: string;
}

export interface TelemetryTrack {
  id: string;
  user_id: string;
  track_name: string;
  skill_tags: SkillTag[];
  metric_type: MetricType;
  created_at: string;
}

export type MetricType = 'trade_frequency' | 'proof_additions' | 'hours_exchanged';

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  event_type: AuditEventType;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type AuditEventType = 'password_change' | 'failed_login' | 'unauthorized_access';

export interface Session {
  id: string;
  user_id: string;
  device_label: string;
  last_active: string;
  created_at: string;
}
