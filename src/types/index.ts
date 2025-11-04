// Use Firestore Timestamp type
import { Timestamp } from 'firebase/firestore';
export type { Timestamp };

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  xp: number;
  created_at: Timestamp;
}

// Practice Result Types
export interface PracticeResult {
  id: string;
  user_id: string;
  score: number;              // 0-100
  skill_gaps: string[];       // ["Algebra", "Geometry"]
  completed_at: Timestamp;
}

// Invite Types
export interface Invite {
  id: string;
  short_code: string;         // "abc123"
  inviter_id: string;
  loop_type: string;          // "buddy_challenge"
  practice_result_id?: string; // Reference to practice result
  
  // Funnel tracking
  created_at: Timestamp;
  opened_at?: Timestamp;
  invitee_id?: string;
  accepted_at?: Timestamp;
  fvm_reached_at?: Timestamp;
  
  // Challenge data (embedded)
  challenge_data: ChallengeData;
}

export interface ChallengeData {
  skill: string;
  questions: Question[];
  share_copy: string;
  inviter_name: string;       // First name only
  inviter_score: number;
}

// Decision Types
export interface Decision {
  id: string;
  user_id: string;
  event_type: string;         // "practice_completed" | "invite_requested"
  event_id?: string;          // ID of practice result or invite
  decision: string;           // "trigger_buddy_challenge" | "skip"
  rationale: string;
  features_used: string[];
  context?: {
    score?: number;
    invites_today?: number;
    last_invite_hours_ago?: number;
  };
  created_at: Timestamp;
}

// Analytics Types
export interface AnalyticsCounters {
  id: string;                 // "main"
  total_users: number;
  total_invites_sent: number;
  total_invites_opened: number;
  total_invites_accepted: number;
  total_fvm_reached: number;
  last_updated: Timestamp;
}

// Question Types
export interface Question {
  id: string;
  text: string;
  options: string[];          // 4 options
  correctAnswer: number;      // Index 0-3
  skill: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface Answer {
  questionId: string;
  selectedAnswer: number;    // Index 0-3
}

// API Request/Response Types
// Practice Complete
export interface PracticeCompleteRequest {
  userId: string;
  answers: Answer[];
}

export interface PracticeCompleteResponse {
  resultId: string;
  score: number;
  skillGaps: string[];
  shouldShowInvite: boolean;
}

// Invite Create
export interface InviteCreateRequest {
  userId: string;
  resultId: string;
}

export interface InviteCreateResponse {
  shortCode: string;
  shareUrl: string;
  shareCard: ShareCard;
}

export interface ShareCard {
  text: string;
  inviterName: string;
  score: number;
  skill: string;
}

// Agent Decision
export interface AgentDecision {
  shouldTrigger: boolean;
  rationale: string;
  loopType?: string;
  features_used: string[];
}

// Event Context for Orchestrator
export interface EventContext {
  type: "practice_completed" | "invite_requested";
  resultId: string;
  score?: number;
  skillGaps?: string[];
}

// Decision Context for Logging
export interface DecisionContext {
  userId: string;
  eventType: string;
  eventId: string;
  score?: number;
  invitesToday?: number;
  lastInviteHoursAgo?: number;
}

// Invite Resolution Response
export interface InviteResolutionResponse {
  inviteId: string;
  inviter: {
    name: string; // First name only
  };
  challenge: {
    skill: string;
    questionCount: number;
    estimatedTime: string;
    inviterScore: number;
    shareCopy: string;
  };
  callToAction: string;
}

// Accept Challenge Request/Response
export interface AcceptChallengeRequest {
  name: string;
  email?: string;
}

export interface AcceptChallengeResponse {
  userId: string;
  inviteId: string;
  challenge: {
    skill: string;
    questions: Question[];
    inviterScore: number;
  };
  redirectUrl: string;
}


