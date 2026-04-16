
/*
  # Cypher Enterprise AI Insurance Assistant - Full Schema

  ## Overview
  Complete database schema for the real-time emotionally aware AI insurance assistant platform.

  ## New Tables

  ### 1. agents
  - Tracks all insurance agents using the platform
  - Links to Supabase auth.users
  - Stores role (agent/supervisor/admin), status, and performance metrics

  ### 2. calls
  - Records all customer calls
  - Tracks real-time stress level, urgency score, and sentiment
  - Links to agents and claims

  ### 3. transcripts
  - Stores real-time transcript chunks per call
  - Tracks speaker (agent/caller) and sentiment score per chunk

  ### 4. stress_metrics
  - Time-series stress scores for each call
  - Stores confidence level and contributing audio features

  ### 5. claims
  - Insurance claim records linked to calls
  - Tracks claim type, status, and financial amount

  ### 6. suggested_questions
  - AI-generated questions for agents during active calls
  - Ranked by priority with reasoning

  ### 7. queue_priority
  - Real-time call queue management
  - Priority scoring with urgency classification

  ## Security
  - RLS enabled on all tables
  - Agents can only see their own calls; supervisors see all
  - All policies require authentication

  ## Indexes
  - Optimized for high-frequency real-time queries on calls and transcripts
*/

-- AGENTS TABLE
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text UNIQUE NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'agent' CHECK (role IN ('agent', 'supervisor', 'admin')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_call', 'offline', 'break')),
  avatar_url text DEFAULT '',
  department text DEFAULT 'General',
  calls_handled integer DEFAULT 0,
  avg_stress_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_role ON agents(role);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view all agents"
  ON agents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Agents can update own profile"
  ON agents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Agents can insert own profile"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- CLAIMS TABLE
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number text UNIQUE NOT NULL DEFAULT '',
  policy_number text NOT NULL DEFAULT '',
  claimant_name text NOT NULL DEFAULT '',
  claimant_phone text DEFAULT '',
  type text NOT NULL DEFAULT 'auto' CHECK (type IN ('auto', 'home', 'health', 'life', 'commercial', 'liability')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'approved', 'denied', 'pending_docs', 'escalated')),
  amount numeric DEFAULT 0,
  description text DEFAULT '',
  incident_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_type ON claims(type);
CREATE INDEX IF NOT EXISTS idx_claims_claimant_phone ON claims(claimant_phone);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view claims"
  ON claims FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert claims"
  ON claims FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update claims"
  ON claims FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- CALLS TABLE
CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  claim_id uuid REFERENCES claims(id) ON DELETE SET NULL,
  caller_name text NOT NULL DEFAULT 'Unknown Caller',
  caller_phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'transferred', 'dropped')),
  stress_level numeric DEFAULT 0 CHECK (stress_level >= 0 AND stress_level <= 100),
  urgency_score numeric DEFAULT 0 CHECK (urgency_score >= 0 AND urgency_score <= 100),
  confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  sentiment text NOT NULL DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative', 'distressed')),
  duration_seconds integer DEFAULT 0,
  resolution_notes text DEFAULT '',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calls_agent_id ON calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_stress_level ON calls(stress_level DESC);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own calls"
  ON calls FOR SELECT
  TO authenticated
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM agents WHERE user_id = auth.uid() AND role IN ('supervisor', 'admin'))
  );

CREATE POLICY "Agents can insert calls"
  ON calls FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Agents can update their own calls"
  ON calls FOR UPDATE
  TO authenticated
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM agents WHERE user_id = auth.uid() AND role IN ('supervisor', 'admin'))
  )
  WITH CHECK (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM agents WHERE user_id = auth.uid() AND role IN ('supervisor', 'admin'))
  );

-- TRANSCRIPTS TABLE
CREATE TABLE IF NOT EXISTS transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES calls(id) ON DELETE CASCADE NOT NULL,
  speaker text NOT NULL DEFAULT 'caller' CHECK (speaker IN ('agent', 'caller')),
  text text NOT NULL DEFAULT '',
  sentiment_score numeric DEFAULT 0 CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  keywords text[] DEFAULT '{}',
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcripts_call_id ON transcripts(call_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_timestamp ON transcripts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transcripts_speaker ON transcripts(speaker);

ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transcripts"
  ON transcripts FOR SELECT
  TO authenticated
  USING (
    call_id IN (
      SELECT c.id FROM calls c
      JOIN agents a ON c.agent_id = a.id
      WHERE a.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM agents WHERE user_id = auth.uid() AND role IN ('supervisor', 'admin'))
  );

CREATE POLICY "Authenticated users can insert transcripts"
  ON transcripts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- STRESS METRICS TABLE
CREATE TABLE IF NOT EXISTS stress_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES calls(id) ON DELETE CASCADE NOT NULL,
  score numeric NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  confidence numeric NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  pitch_variance numeric DEFAULT 0,
  speech_rate numeric DEFAULT 0,
  pause_frequency numeric DEFAULT 0,
  volume_variance numeric DEFAULT 0,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stress_metrics_call_id ON stress_metrics(call_id);
CREATE INDEX IF NOT EXISTS idx_stress_metrics_timestamp ON stress_metrics(timestamp DESC);

ALTER TABLE stress_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stress metrics"
  ON stress_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert stress metrics"
  ON stress_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- SUGGESTED QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS suggested_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES calls(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL DEFAULT '',
  priority integer NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('verification', 'claim_details', 'incident', 'coverage', 'documents', 'follow_up', 'empathy', 'resolution')),
  reason text DEFAULT '',
  is_answered boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_call_id ON suggested_questions(call_id);
CREATE INDEX IF NOT EXISTS idx_questions_priority ON suggested_questions(priority DESC);

ALTER TABLE suggested_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view questions"
  ON suggested_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert questions"
  ON suggested_questions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update questions"
  ON suggested_questions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- QUEUE PRIORITY TABLE
CREATE TABLE IF NOT EXISTS queue_priority (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES calls(id) ON DELETE CASCADE NOT NULL UNIQUE,
  priority_score numeric NOT NULL DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
  urgency text NOT NULL DEFAULT 'medium' CHECK (urgency IN ('critical', 'high', 'medium', 'low')),
  estimated_wait_seconds integer DEFAULT 0,
  claim_type text DEFAULT 'auto',
  escalation_reason text DEFAULT '',
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_queue_priority_score ON queue_priority(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_queue_priority_urgency ON queue_priority(urgency);

ALTER TABLE queue_priority ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view queue"
  ON queue_priority FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert queue"
  ON queue_priority FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update queue"
  ON queue_priority FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete queue"
  ON queue_priority FOR DELETE
  TO authenticated
  USING (true);

-- ANALYTICS EVENTS TABLE
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT '',
  call_id uuid REFERENCES calls(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  payload jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view analytics"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert analytics"
  ON analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- SEED DEMO CLAIMS
INSERT INTO claims (claim_number, policy_number, claimant_name, claimant_phone, type, status, amount, description, incident_date)
VALUES
  ('CLM-2024-001', 'POL-AUTO-7842', 'Margaret Thompson', '+1-555-0101', 'auto', 'under_review', 12500.00, 'Rear-end collision on Highway 101', '2024-12-15'),
  ('CLM-2024-002', 'POL-HOME-3391', 'Robert Martinez', '+1-555-0102', 'home', 'open', 45000.00, 'Roof damage from hailstorm', '2024-12-10'),
  ('CLM-2024-003', 'POL-HEALTH-9921', 'Susan Chen', '+1-555-0103', 'health', 'pending_docs', 8750.00, 'Emergency appendectomy', '2024-12-20'),
  ('CLM-2024-004', 'POL-AUTO-5531', 'David Williams', '+1-555-0104', 'auto', 'escalated', 32000.00, 'Total loss - vehicle theft', '2024-12-05'),
  ('CLM-2024-005', 'POL-LIFE-1147', 'Jennifer Brown', '+1-555-0105', 'life', 'open', 250000.00, 'Beneficiary claim processing', '2024-11-28'),
  ('CLM-2024-006', 'POL-HOME-6612', 'Michael Johnson', '+1-555-0106', 'home', 'approved', 18500.00, 'Kitchen fire damage', '2024-12-01'),
  ('CLM-2024-007', 'POL-AUTO-2234', 'Lisa Anderson', '+1-555-0107', 'auto', 'open', 6800.00, 'Side-swipe parking lot incident', '2024-12-18'),
  ('CLM-2024-008', 'POL-COMM-8843', 'TechStart LLC', '+1-555-0108', 'commercial', 'under_review', 125000.00, 'Business interruption from flood', '2024-12-12')
ON CONFLICT DO NOTHING;
