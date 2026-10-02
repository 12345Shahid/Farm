-- Migration 006: Add adcash network to tma_ads_log check constraint
ALTER TABLE tma_ads_log DROP CONSTRAINT IF EXISTS tma_ads_log_network_check;
ALTER TABLE tma_ads_log ADD CONSTRAINT tma_ads_log_network_check CHECK (network IN ('popads', 'adcash', 'adsterra', 'popcash'));