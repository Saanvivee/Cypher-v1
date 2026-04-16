export type UserRole = "agent" | "supervisor" | "admin";
export type CallStatus = "active" | "completed" | "transferred" | "dropped";
export type UrgencyLevel = "critical" | "high" | "medium" | "low";
export type StressLevel = "low" | "moderate" | "high" | "critical";
export type SentimentLabel = "positive" | "neutral" | "negative" | "distressed";
export type AgentStatus = "available" | "on_call" | "offline" | "break";
export type ClaimType = "auto" | "home" | "health" | "life" | "commercial" | "liability";
export type ClaimStatus = "open" | "under_review" | "approved" | "denied" | "pending_docs" | "escalated";
export type QuestionCategory = "verification" | "claim_details" | "incident" | "coverage" | "documents" | "follow_up" | "empathy" | "resolution";

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AgentStatus;
  avatar_url: string;
  department: string;
  calls_handled: number;
  avg_stress_score: number;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: string;
  claim_number: string;
  policy_number: string;
  claimant_name: string;
  claimant_phone: string;
  type: ClaimType;
  status: ClaimStatus;
  amount: number;
  description: string;
  incident_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: string;
  agent_id: string | null;
  claim_id: string | null;
  caller_name: string;
  caller_phone: string;
  status: CallStatus;
  stress_level: number;
  urgency_score: number;
  confidence_score: number;
  sentiment: SentimentLabel;
  duration_seconds: number;
  resolution_notes: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  claim?: Claim;
  agent?: Agent;
}

export interface Transcript {
  id: string;
  call_id: string;
  speaker: "agent" | "caller";
  text: string;
  sentiment_score: number;
  keywords: string[];
  timestamp: string;
}

export interface StressMetric {
  id: string;
  call_id: string;
  score: number;
  confidence: number;
  pitch_variance: number;
  speech_rate: number;
  pause_frequency: number;
  volume_variance: number;
  timestamp: string;
}

export interface SuggestedQuestion {
  id: string;
  call_id: string;
  question: string;
  priority: number;
  category: QuestionCategory;
  reason: string;
  is_answered: boolean;
  created_at: string;
}

export interface QueueItem {
  id: string;
  call_id: string;
  priority_score: number;
  urgency: UrgencyLevel;
  estimated_wait_seconds: number;
  claim_type: string;
  escalation_reason: string;
  position: number;
  created_at: string;
  updated_at: string;
  call?: Call;
}

export interface NLPResult {
  sentiment_score: number;
  sentiment_label: SentimentLabel;
  keywords: string[];
  entities: Array<{ text: string; type: string; value: string }>;
  intent: string;
  urgency_indicators: string[];
  confidence: number;
}

export interface StressResult {
  score: number;
  confidence: number;
  level: StressLevel;
  contributing_factors: string[];
  pitch_variance: number;
  speech_rate: number;
  pause_frequency: number;
  volume_variance: number;
  recommendation: string;
}

export interface ScoringResult {
  stress: number;
  urgency: number;
  confidence: number;
  priority_score: number;
  urgency_level: UrgencyLevel;
  escalate: boolean;
  escalation_reason?: string;
  agent_guidance: string[];
  queue_position_weight: number;
}

export interface AnalyticsSnapshot {
  total_calls: number;
  active_calls: number;
  avg_stress: number;
  avg_duration: number;
  resolution_rate: number;
  escalation_rate: number;
  calls_by_hour: { hour: string; count: number }[];
  stress_trend: { time: string; score: number }[];
  calls_by_type: { type: string; count: number }[];
  sentiment_breakdown: { label: string; count: number; color: string }[];
}

export type Page = "login" | "agent" | "supervisor" | "analytics";
