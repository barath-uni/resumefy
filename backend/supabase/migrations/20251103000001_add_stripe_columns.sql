-- =====================================================
-- STRIPE INTEGRATION: Add subscription tracking columns
-- =====================================================

-- Add Stripe-related columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- Create index for faster Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id
ON user_profiles(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_subscription_id
ON user_profiles(stripe_subscription_id);

-- Add comment documentation
COMMENT ON COLUMN user_profiles.stripe_customer_id IS 'Stripe customer ID (cus_...)';
COMMENT ON COLUMN user_profiles.stripe_subscription_id IS 'Stripe subscription ID (sub_...)';
COMMENT ON COLUMN user_profiles.subscription_status IS 'Stripe subscription status: active, inactive, canceled, past_due, trialing';
COMMENT ON COLUMN user_profiles.subscription_current_period_end IS 'When current subscription period ends';

-- Update tier limits to match new pricing
-- Pro tier: $8.99/mo -> 10 resumes, 50 jobs, unlimited PDFs
-- Max tier: $17.99/mo -> 50 resumes, 250 jobs, unlimited PDFs
-- Free tier stays: 1 resume, 5 jobs, NO PDFs

-- Update get_tier_limits function to use new tier names
CREATE OR REPLACE FUNCTION get_tier_limits(p_tier TEXT)
RETURNS TABLE(
  resumes_limit INTEGER,
  jobs_per_resume_limit INTEGER,
  can_generate_pdfs BOOLEAN
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE p_tier
      WHEN 'free' THEN 1
      WHEN 'pro' THEN 10
      WHEN 'max' THEN 50
      ELSE 1  -- default to free tier limits
    END AS resumes_limit,
    CASE p_tier
      WHEN 'free' THEN 5
      WHEN 'pro' THEN 50
      WHEN 'max' THEN 250
      ELSE 5  -- default to free tier limits
    END AS jobs_per_resume_limit,
    CASE p_tier
      WHEN 'free' THEN FALSE
      WHEN 'pro' THEN TRUE
      WHEN 'max' THEN TRUE
      ELSE FALSE  -- default to free tier limits
    END AS can_generate_pdfs;
END;
$$;
