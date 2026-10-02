-- TMA Isolated Schema Migration
-- Creates ONLY tma_ prefixed tables. Does NOT touch existing tables.
-- Run this in your Supabase SQL Editor.

-- 1. tma_users
CREATE TABLE IF NOT EXISTS tma_users (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  balance DECIMAL(12,4) DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by BIGINT,
  check_in_streak INT DEFAULT 0,
  last_check_in DATE,
  verification_status TEXT DEFAULT 'pending', -- pending | verified | rejected
  booster_status TEXT DEFAULT 'inactive',     -- inactive | apk_downloaded | active
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tma_users_user_id ON tma_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tma_users_referral_code ON tma_users(referral_code);

-- 2. tma_mining
CREATE TABLE IF NOT EXISTS tma_mining (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES tma_users(user_id) ON DELETE CASCADE,
  level INT DEFAULT 1,
  last_claim_time TIMESTAMPTZ,
  is_mining BOOLEAN DEFAULT FALSE,
  session_start TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tma_mining_user_id ON tma_mining(user_id);

-- 3. tma_ads_log
CREATE TABLE IF NOT EXISTS tma_ads_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES tma_users(user_id) ON DELETE CASCADE,
  network TEXT NOT NULL CHECK (network IN ('popads', 'adsterra')),
  ads_watched_today INT DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, network)
);

CREATE INDEX IF NOT EXISTS idx_tma_ads_log_user_id ON tma_ads_log(user_id);

-- 4. tma_tasks
CREATE TABLE IF NOT EXISTS tma_tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES tma_users(user_id) ON DELETE CASCADE,
  cpa_completed_today INT DEFAULT 0,
  smm_completed_today INT DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tma_tasks_user_id ON tma_tasks(user_id);

-- 5. tma_smm_tasks (task links sourced from admin)
CREATE TABLE IF NOT EXISTS tma_smm_tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  reward DECIMAL(8,4) DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. tma_withdrawals
CREATE TABLE IF NOT EXISTS tma_withdrawals (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES tma_users(user_id) ON DELETE CASCADE,
  amount DECIMAL(12,4) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending | approved | rejected
  wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tma_withdrawals_user_id ON tma_withdrawals(user_id);

-- 7. tma_check_ins (history log)
CREATE TABLE IF NOT EXISTS tma_check_ins (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES tma_users(user_id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  streak INT NOT NULL DEFAULT 1,
  reward DECIMAL(8,4) DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_tma_check_ins_user_id ON tma_check_ins(user_id);

-- Seed SMM tasks (optional — if empty, UI shows "Not available in your region")
INSERT INTO tma_smm_tasks (title, link, reward) VALUES
  ('Follow Twitter/X', 'https://x.com', 2),
  ('Join Telegram Channel', 'https://t.me', 2),
  ('Subscribe YouTube', 'https://youtube.com', 2)
ON CONFLICT DO NOTHING;