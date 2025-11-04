-- =====================================================
-- FIX: Add 'max' tier to tier constraint
-- =====================================================
--
-- Problem: Constraint only allows ('free', 'basic', 'pro') but Stripe is sending 'max'
-- Solution: Update constraint to include 'max' tier

-- Step 1: Drop the old constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_tier_check;

-- Step 2: Add new constraint with 'max' tier included
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_tier_check
CHECK (tier IN ('free', 'basic', 'pro', 'max'));

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.tier IS 'User subscription tier: free, basic, pro, or max';
