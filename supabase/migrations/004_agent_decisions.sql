-- Phase 4: Agent Decisions & History
-- Records every agent proposal, user approval, and execution outcome.

-- Main decision record (one per incoming payment / user-triggered simulation)
CREATE TABLE IF NOT EXISTS agent_decisions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal_json JSONB NOT NULL,
  total_usdc    NUMERIC(20, 6) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'partial')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at   TIMESTAMPTZ
);

-- Individual action items within a decision
CREATE TABLE IF NOT EXISTS agent_decision_items (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  decision_id  TEXT NOT NULL REFERENCES agent_decisions(id) ON DELETE CASCADE,
  bucket       TEXT NOT NULL CHECK (bucket IN ('income', 'bills', 'family', 'savings')),
  description  TEXT NOT NULL,
  amount_usdc  NUMERIC(20, 6) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'executed', 'failed')),
  tx_hash      TEXT,
  executed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Persisted allocation rules (from AI or manual rules editor)
CREATE TABLE IF NOT EXISTS allocation_rules (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL DEFAULT 'My Rule',
  allocations          JSONB NOT NULL,  -- [{ bucket, percent }]
  is_active            BOOLEAN NOT NULL DEFAULT true,
  ai_generated         BOOLEAN NOT NULL DEFAULT false,
  ai_prompt            TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_decisions_user_id ON agent_decisions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_decision_items_decision ON agent_decision_items(decision_id);
CREATE INDEX IF NOT EXISTS idx_allocation_rules_user ON allocation_rules(user_id, is_active);

-- RLS
ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_decision_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own decisions" ON agent_decisions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own decision items" ON agent_decision_items
  FOR ALL USING (
    decision_id IN (SELECT id FROM agent_decisions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users own allocation rules" ON allocation_rules
  FOR ALL USING (auth.uid() = user_id);
