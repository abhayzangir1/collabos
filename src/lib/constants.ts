import type { DnaType } from '@/types/database';

export const DNA_TYPES: { type: DnaType; description: string; icon: string }[] = [
  { type: 'Builder', description: 'You create things from scratch — products, features, systems.', icon: '🔨' },
  { type: 'Visionary', description: 'You see the big picture and chart the course forward.', icon: '🔮' },
  { type: 'Strategist', description: 'You plan, analyze, and optimize for maximum impact.', icon: '♟️' },
  { type: 'Connector', description: 'You bring people together and foster collaboration.', icon: '🤝' },
  { type: 'Analyst', description: 'You dive deep into data and surface insights.', icon: '📊' },
  { type: 'Operator', description: 'You keep everything running smoothly and efficiently.', icon: '⚙️' },
];

export const MAX_PINNED_PROOFS = 3;
export const MAX_SKILL_TAGS_PER_PROOF = 10;
export const MIN_MILESTONES = 2;
export const MAX_MILESTONES = 5;
export const MIN_DISPUTE_REASON_LENGTH = 20;
export const MAX_CUSTOM_TELEMETRY_TRACKS = 5;
export const INVITATION_EXPIRY_DAYS = 7;
export const DISPUTE_ESCALATION_DAYS = 7;
export const BADGE_COUNT_MAX = 99;
export const SIGNED_URL_EXPIRY_SECONDS = 3600;
export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export const TRUST_SCORE_WEIGHTS = {
  TRADES_COMPLETED: 10,
  VERIFIED_PROOFS: 8,
  UNVERIFIED_PROOFS: 3,
  ENDORSEMENTS: 2,
} as const;

export const TRADE_STATUSES = ['Proposed', 'Active', 'Completed', 'Declined', 'Disputed'] as const;
export const MILESTONE_STATUSES = ['Pending', 'In Progress', 'Awaiting Confirmation', 'Completed'] as const;

export const CHAT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'] as const;

export const METRIC_TYPES = [
  { value: 'trade_frequency' as const, label: 'Trade Frequency' },
  { value: 'proof_additions' as const, label: 'Proof Additions' },
  { value: 'hours_exchanged' as const, label: 'Hours Exchanged' },
];
