-- =====================================================
-- RESUMEFY V2 - SUBSCRIPTION MODEL UPDATE
-- Created: 2025-10-27
-- Purpose: Replace credit system with subscription model
-- =====================================================

-- =====================================================
-- DROP OLD CREDIT SYSTEM
-- =====================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;

-- Drop functions
DROP FUNCTION IF EXISTS initialize_user_credits();
DROP FUNCTION IF EXISTS deduct_credit(UUID);

-- Drop table
DROP TABLE IF EXISTS user_credits CASCADE;

-- =====================================================
-- UPDATE USER_PROFILES TABLE
-- Add subscription fields
-- =====================================================

-- Add subscription columns to existing user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'weekly_paid', 'monthly_paid')),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON user_profiles(subscription_status);

-- =====================================================
-- HELPER FUNCTION: Check if user is subscribed
-- =====================================================

CREATE OR REPLACE FUNCTION is_user_subscribed(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_status TEXT;
    v_end_date TIMESTAMP;
BEGIN
    SELECT subscription_status, subscription_end_date
    INTO v_status, v_end_date
    FROM user_profiles
    WHERE id = p_user_id;

    -- User is subscribed if they have active weekly or monthly plan
    IF v_status IN ('weekly_paid', 'monthly_paid') THEN
        -- Check if subscription hasn't expired
        IF v_end_date IS NULL OR v_end_date > NOW() THEN
            RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_user_subscribed TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN user_profiles.subscription_status IS 'User subscription tier: free, weekly_paid, or monthly_paid';
COMMENT ON COLUMN user_profiles.subscription_start_date IS 'When current subscription started';
COMMENT ON COLUMN user_profiles.subscription_end_date IS 'When current subscription expires (NULL for active recurring)';
COMMENT ON COLUMN user_profiles.stripe_customer_id IS 'Stripe customer ID for payment tracking';
COMMENT ON COLUMN user_profiles.stripe_subscription_id IS 'Stripe subscription ID for cancellation/management';
COMMENT ON FUNCTION is_user_subscribed IS 'Returns TRUE if user has an active subscription (weekly or monthly)';
