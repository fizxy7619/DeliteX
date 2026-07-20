-- Phase 5: Vault positions table for yield layer
CREATE TABLE IF NOT EXISTS vault_positions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usdc     NUMERIC(18, 6) NOT NULL CHECK (amount_usdc > 0),
  strategy        TEXT NOT NULL DEFAULT 'conservative' CHECK (strategy IN ('conservative', 'stable')),
  apy_percent     NUMERIC(5, 2) NOT NULL DEFAULT 5.80,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'pending')),
  tx_hash         TEXT,
  withdrawn_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE vault_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own vault positions"
  ON vault_positions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_vault_positions_user_id ON vault_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_positions_status ON vault_positions(user_id, status);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_vault_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vault_positions_updated_at ON vault_positions;
CREATE TRIGGER vault_positions_updated_at
  BEFORE UPDATE ON vault_positions
  FOR EACH ROW EXECUTE FUNCTION update_vault_positions_updated_at();
