-- Migration 004: Ensure booster_status column supports the 'active' / 'inactive' text values
-- the booster server writes. The column already exists as TEXT, this is a no-op safety guard.
-- Also adds a tma_booster_sessions log table for future audit history.

-- Ensure the column exists and has a sensible default (idempotent)
ALTER TABLE tma_users
  ALTER COLUMN booster_status SET DEFAULT 'inactive';

-- Optional: index for quickly querying all active boosters
CREATE INDEX IF NOT EXISTS idx_tma_users_booster_status
  ON tma_users(booster_status);

-- Audit table: log every time a device connects or disconnects
CREATE TABLE IF NOT EXISTS tma_booster_sessions (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES tma_users(user_id) ON DELETE CASCADE,
  device_model    TEXT,
  ad_account      INT CHECK (ad_account BETWEEN 1 AND 5),
  event           TEXT NOT NULL CHECK (event IN ('connected', 'disconnected')),
  reason          TEXT,        -- eviction reason on disconnect
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tma_booster_sessions_user_id
  ON tma_booster_sessions(user_id);
