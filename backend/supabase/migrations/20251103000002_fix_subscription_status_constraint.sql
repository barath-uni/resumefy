-- =====================================================
-- FIX: Update subscription_status constraint to accept Stripe values
-- =====================================================
--
-- Problem: Old constraint only allowed ('free', 'weekly_paid', 'monthly_paid')
-- Solution: Accept Stripe subscription statuses: 'active', 'inactive', 'canceled', 'past_due', 'trialing', etc.
--
-- This fixes the error:
-- "new row for relation user_profiles violates check constraint user_profiles_subscription_status_check"

-- Step 1: Drop the old constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_subscription_status_check;

-- Step 2: Migrate existing data to new values FIRST (before adding constraint)
-- Convert old values to new Stripe-compatible statuses
UPDATE user_profiles
SET subscription_status = 'inactive'
WHERE subscription_status = 'free';

UPDATE user_profiles
SET subscription_status = 'active'
WHERE subscription_status IN ('weekly_paid', 'monthly_paid');

-- Step 3: NOW add new constraint with Stripe-compatible values
-- See: https://stripe.com/docs/api/subscriptions/object#subscription_object-status
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_subscription_status_check
CHECK (subscription_status IN (
  'active',           -- Subscription is active
  'inactive',         -- No subscription (free tier)
  'canceled',         -- Subscription canceled
  'past_due',         -- Payment failed, still active but overdue
  'trialing',         -- In trial period
  'incomplete',       -- First payment failed
  'incomplete_expired', -- First payment never succeeded
  'unpaid'            -- Latest payment failed
));

-- Step 4: Add index for faster status filtering (optional optimization)
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status
ON user_profiles(subscription_status);

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.subscription_status IS 'Stripe subscription status: active, inactive, canceled, past_due, trialing, incomplete, incomplete_expired, unpaid';
