 -- Run this SQL in Supabase SQL Editor to create the helper function
-- Needed by the TMA API routes for balance updates

CREATE OR REPLACE FUNCTION tma_increment_balance(p_user_id BIGINT, p_amount DECIMAL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tma_users
  SET balance = GREATEST(balance + p_amount, 0),
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;