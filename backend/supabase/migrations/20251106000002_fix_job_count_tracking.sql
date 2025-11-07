-- =====================================================
-- FIX: Job Count Tracking Issue When Resume is Deleted
-- Created: 2025-11-06
-- Purpose: Track job tailoring count globally per user, not per resume
-- =====================================================

-- =====================================================
-- PROBLEM:
-- Current implementation tracks jobs_created_count on resumes table.
-- When user deletes a resume, the row is deleted (CASCADE), so the count is lost.
-- Example: User creates 2 jobs, deletes resume → count resets to 0/25 (wrong!)
-- Should be: 2/25 (jobs were already "used" for tailoring)
--
-- SOLUTION:
-- Add global job tailoring counter to user_profiles table.
-- Track total jobs created across ALL resumes (lifetime).
-- Counter increments on job INSERT, never decrements on DELETE.
-- =====================================================

-- =====================================================
-- Step 1: Add Global Job Counter to user_profiles
-- =====================================================

-- Add global job tailoring counter
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS jobs_tailored_lifetime_count INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_jobs_tailored
ON user_profiles(jobs_tailored_lifetime_count);

-- =====================================================
-- Step 2: Backfill Existing Data
-- Count all jobs ever created by each user (even if resume is deleted)
-- =====================================================

-- Backfill with current job counts per user
UPDATE user_profiles up
SET jobs_tailored_lifetime_count = (
  SELECT COUNT(*) FROM jobs WHERE user_id = up.user_id
)
WHERE jobs_tailored_lifetime_count = 0;

-- =====================================================
-- Step 3: Update Trigger to Increment Global Counter
-- =====================================================

-- Update trigger function to increment BOTH per-resume AND global counter
CREATE OR REPLACE FUNCTION increment_job_per_resume_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment per-resume counter (for display purposes)
  UPDATE resumes
  SET jobs_created_count = jobs_created_count + 1
  WHERE id = NEW.resume_id;

  -- Increment global user counter (for paywall enforcement)
  UPDATE user_profiles
  SET jobs_tailored_lifetime_count = jobs_tailored_lifetime_count + 1
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_job_per_resume_count IS 'Increments both per-resume job count AND global user job count - never decrements on delete';

-- =====================================================
-- Step 4: Update Paywall Function to Use Global Counter
-- =====================================================

-- Update can_add_job to check GLOBAL job count, not per-resume count
CREATE OR REPLACE FUNCTION can_add_job(p_user_id UUID, p_resume_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tier TEXT;
  v_lifetime_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get user tier and GLOBAL job tailoring count
  SELECT tier, COALESCE(jobs_tailored_lifetime_count, 0)
  INTO v_tier, v_lifetime_count
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- If no profile exists, default to free
  IF v_tier IS NULL THEN
    v_tier := 'free';
    v_lifetime_count := 0;
  END IF;

  -- Get limit for tier
  SELECT jobs_per_resume_limit INTO v_limit
  FROM get_tier_limits(v_tier);

  -- Check against GLOBAL LIFETIME count (not per-resume count!)
  IF v_lifetime_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'jobs_limit_reached',
      'current', v_lifetime_count,
      'limit', v_limit,
      'tier', v_tier,
      'upgrade_required', TRUE,
      'message', format('You have reached your job tailoring limit (%s/%s). Upgrade to tailor more resumes.', v_lifetime_count, v_limit)
    );
  ELSE
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'current', v_lifetime_count,
      'limit', v_limit,
      'tier', v_tier,
      'remaining', v_limit - v_lifetime_count
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_add_job IS 'Check if user can add another job based on GLOBAL lifetime job count (not per-resume)';

-- =====================================================
-- Step 5: Add Comments for Documentation
-- =====================================================

COMMENT ON COLUMN user_profiles.jobs_tailored_lifetime_count IS 'Global lifetime count of jobs tailored across ALL resumes (never decreases on deletion) - used for paywall enforcement';

-- =====================================================
-- TESTING QUERIES (for manual verification)
-- =====================================================

-- Verify global job counts:
-- SELECT user_id, tier, jobs_tailored_lifetime_count,
--        (SELECT COUNT(*) FROM jobs WHERE user_id = up.user_id) as current_count
-- FROM user_profiles up;

-- Test paywall function:
-- SELECT can_add_job('user-id-here', 'resume-id-here');

-- =====================================================
-- MIGRATION NOTES
-- =====================================================

-- This migration fixes the issue where deleting a resume would reset the job count.
-- Now the count is tracked globally per user and persists even after resume deletion.
--
-- Example scenario (Pro tier: 25 job limit):
-- 1. User uploads Resume A, creates 10 jobs → jobs_tailored_lifetime_count = 10
-- 2. User uploads Resume B, creates 5 jobs → jobs_tailored_lifetime_count = 15
-- 3. User deletes Resume A (and its 10 jobs) → jobs_tailored_lifetime_count STILL = 15 ✅
-- 4. User tries to create 11 more jobs → Blocked at 25 limit (15 + 11 > 25) ✅
--
-- This prevents users from gaming the system by deleting and recreating resumes.
