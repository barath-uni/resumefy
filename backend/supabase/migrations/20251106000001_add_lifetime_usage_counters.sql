-- =====================================================
-- RESUMEFY PAYWALL FIX - LIFETIME USAGE COUNTERS
-- Created: 2025-11-06
-- Purpose: Close critical exploit where users can delete jobs/resumes to bypass limits
-- =====================================================

-- =====================================================
-- PROBLEM:
-- Current paywall checks COUNT(*) from resumes/jobs tables.
-- Users can delete records after downloading PDFs, resetting their limits.
-- This allows infinite free PDFs by delete→create→download loop.
--
-- SOLUTION:
-- Track LIFETIME usage with counters that increment on INSERT but NEVER decrement on DELETE.
-- Paywall checks against lifetime counters instead of current counts.
-- =====================================================

-- =====================================================
-- Step 1: Add Lifetime Counter Columns
-- =====================================================

-- Add global resume lifetime counter to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS resumes_lifetime_count INTEGER DEFAULT 0;

-- Add per-resume job lifetime counter to resumes table
ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS jobs_created_count INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_lifetime_resume_count
ON user_profiles(resumes_lifetime_count);

CREATE INDEX IF NOT EXISTS idx_resumes_jobs_count
ON resumes(jobs_created_count);

-- =====================================================
-- Step 2: Backfill Existing Data
-- =====================================================

-- Backfill resumes_lifetime_count with current resume counts
UPDATE user_profiles up
SET resumes_lifetime_count = (
  SELECT COUNT(*) FROM resumes WHERE user_id = up.user_id
)
WHERE resumes_lifetime_count = 0;

-- Backfill jobs_created_count with current job counts per resume
UPDATE resumes r
SET jobs_created_count = (
  SELECT COUNT(*) FROM jobs WHERE resume_id = r.id
)
WHERE jobs_created_count = 0;

-- =====================================================
-- Step 3: Create Trigger Functions
-- These increment counters on INSERT but DO NOT decrement on DELETE
-- =====================================================

-- Trigger function to increment resume lifetime counter
CREATE OR REPLACE FUNCTION increment_resume_lifetime_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET resumes_lifetime_count = resumes_lifetime_count + 1
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to increment per-resume job counter
CREATE OR REPLACE FUNCTION increment_job_per_resume_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE resumes
  SET jobs_created_count = jobs_created_count + 1
  WHERE id = NEW.resume_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Step 4: Create Triggers
-- Fire AFTER INSERT only (not on DELETE!)
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_increment_resume_count ON resumes;
DROP TRIGGER IF EXISTS trigger_increment_job_count ON jobs;

-- Create trigger on resume creation
CREATE TRIGGER trigger_increment_resume_count
AFTER INSERT ON resumes
FOR EACH ROW
EXECUTE FUNCTION increment_resume_lifetime_count();

-- Create trigger on job creation
CREATE TRIGGER trigger_increment_job_count
AFTER INSERT ON jobs
FOR EACH ROW
EXECUTE FUNCTION increment_job_per_resume_count();

-- =====================================================
-- Step 5: Update Paywall RPC Functions
-- Change from counting current records to checking lifetime counters
-- =====================================================

-- Update can_upload_resume to use lifetime counter
CREATE OR REPLACE FUNCTION can_upload_resume(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tier TEXT;
  v_lifetime_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get user tier and lifetime count
  SELECT tier, COALESCE(resumes_lifetime_count, 0)
  INTO v_tier, v_lifetime_count
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- If no profile exists, default to free tier
  IF v_tier IS NULL THEN
    v_tier := 'free';
    v_lifetime_count := 0;
  END IF;

  -- Get limit for tier
  SELECT resumes_limit INTO v_limit
  FROM get_tier_limits(v_tier);

  -- Check against LIFETIME count (not current count!)
  IF v_lifetime_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'resume_limit_reached',
      'current', v_lifetime_count,
      'limit', v_limit,
      'tier', v_tier,
      'upgrade_required', TRUE,
      'message', format('You have reached your resume limit (%s/%s). Upgrade to upload more resumes.', v_lifetime_count, v_limit)
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

-- Update can_add_job to use per-resume lifetime counter
CREATE OR REPLACE FUNCTION can_add_job(p_user_id UUID, p_resume_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tier TEXT;
  v_lifetime_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get user tier
  SELECT tier INTO v_tier
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- If no profile exists, default to free
  IF v_tier IS NULL THEN
    v_tier := 'free';
  END IF;

  -- Get lifetime job count FOR THIS RESUME
  SELECT COALESCE(jobs_created_count, 0) INTO v_lifetime_count
  FROM resumes
  WHERE id = p_resume_id;

  -- If resume not found, return error
  IF v_lifetime_count IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'resume_not_found',
      'message', 'Resume not found'
    );
  END IF;

  -- Get limit for tier
  SELECT jobs_per_resume_limit INTO v_limit
  FROM get_tier_limits(v_tier);

  -- Check against LIFETIME count per resume (not current count!)
  IF v_lifetime_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'jobs_limit_reached',
      'current', v_lifetime_count,
      'limit', v_limit,
      'tier', v_tier,
      'upgrade_required', TRUE,
      'message', format('You have reached your job description limit (%s/%s) for this resume. Upgrade to add more.', v_lifetime_count, v_limit)
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

-- =====================================================
-- Step 6: Add Comments for Documentation
-- =====================================================

COMMENT ON COLUMN user_profiles.resumes_lifetime_count IS 'Lifetime count of resumes uploaded (never decreases on deletion) - used for paywall enforcement';
COMMENT ON COLUMN resumes.jobs_created_count IS 'Lifetime count of jobs created for this resume (never decreases on deletion) - used for paywall enforcement';
COMMENT ON FUNCTION increment_resume_lifetime_count IS 'Trigger function to increment lifetime resume counter - fires on INSERT only, never decrements';
COMMENT ON FUNCTION increment_job_per_resume_count IS 'Trigger function to increment per-resume job counter - fires on INSERT only, never decrements';

-- =====================================================
-- TESTING QUERIES (for manual verification)
-- =====================================================

-- Verify backfill worked:
-- SELECT user_id, tier, resumes_lifetime_count,
--        (SELECT COUNT(*) FROM resumes WHERE user_id = up.user_id) as current_count
-- FROM user_profiles up;

-- Verify per-resume job counts:
-- SELECT r.id, r.user_id, r.jobs_created_count,
--        (SELECT COUNT(*) FROM jobs WHERE resume_id = r.id) as current_count
-- FROM resumes r;

-- Test paywall functions:
-- SELECT can_upload_resume('user-id-here');
-- SELECT can_add_job('user-id-here', 'resume-id-here');
