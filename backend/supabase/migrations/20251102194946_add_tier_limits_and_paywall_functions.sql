-- =====================================================
-- RESUMEFY PAYWALL SYSTEM - TIER LIMITS & ENFORCEMENT
-- Created: 2025-11-02
-- Purpose: Add tier-based limits with centralized control
-- =====================================================

-- =====================================================
-- 1. ADD TIER AND USAGE TRACKING COLUMNS
-- =====================================================

-- Add tier management columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'pro')),
ADD COLUMN IF NOT EXISTS resumes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS resumes_limit INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS jobs_per_resume_limit INTEGER DEFAULT 5;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON user_profiles(tier);

-- =====================================================
-- 2. CENTRALIZED TIER LIMITS CONFIGURATION
-- Single source of truth for all tier limits
-- =====================================================

CREATE OR REPLACE FUNCTION get_tier_limits(p_tier TEXT)
RETURNS TABLE(
  resumes_limit INTEGER,
  jobs_per_resume_limit INTEGER,
  can_generate_pdfs BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE p_tier
      WHEN 'free' THEN 1
      WHEN 'basic' THEN 10
      WHEN 'pro' THEN 50
      ELSE 1
    END AS resumes_limit,
    CASE p_tier
      WHEN 'free' THEN 5
      WHEN 'basic' THEN 50
      WHEN 'pro' THEN 250
      ELSE 5
    END AS jobs_per_resume_limit,
    CASE p_tier
      WHEN 'free' THEN FALSE  -- Free tier CANNOT generate PDFs
      ELSE TRUE                -- Basic and Pro CAN generate PDFs
    END AS can_generate_pdfs;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_tier_limits IS 'Centralized tier limits configuration - modify here to change limits for all tiers';

-- =====================================================
-- 3. RESUME UPLOAD LIMIT CHECK
-- =====================================================

CREATE OR REPLACE FUNCTION can_upload_resume(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tier TEXT;
  v_current_count INTEGER;
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

  -- Get current resume count
  SELECT COUNT(*) INTO v_current_count
  FROM resumes
  WHERE user_id = p_user_id;

  -- Get limit for tier
  SELECT resumes_limit INTO v_limit
  FROM get_tier_limits(v_tier);

  -- Return result
  IF v_current_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'resume_limit_reached',
      'current', v_current_count,
      'limit', v_limit,
      'tier', v_tier,
      'upgrade_required', TRUE,
      'message', format('You have reached your resume limit (%s/%s). Upgrade to upload more resumes.', v_current_count, v_limit)
    );
  ELSE
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'current', v_current_count,
      'limit', v_limit,
      'tier', v_tier,
      'remaining', v_limit - v_current_count
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_upload_resume IS 'Check if user can upload another resume based on their tier';

-- =====================================================
-- 4. JOB DESCRIPTION LIMIT CHECK
-- =====================================================

CREATE OR REPLACE FUNCTION can_add_job(p_user_id UUID, p_resume_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tier TEXT;
  v_current_count INTEGER;
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

  -- Get current job count for this resume
  SELECT COUNT(*) INTO v_current_count
  FROM jobs
  WHERE resume_id = p_resume_id;

  -- Get limit for tier
  SELECT jobs_per_resume_limit INTO v_limit
  FROM get_tier_limits(v_tier);

  -- Return result
  IF v_current_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'jobs_limit_reached',
      'current', v_current_count,
      'limit', v_limit,
      'tier', v_tier,
      'upgrade_required', TRUE,
      'message', format('You have reached your job description limit (%s/%s) for this resume. Upgrade to add more.', v_current_count, v_limit)
    );
  ELSE
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'current', v_current_count,
      'limit', v_limit,
      'tier', v_tier,
      'remaining', v_limit - v_current_count
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_add_job IS 'Check if user can add another job description for a specific resume';

-- =====================================================
-- 5. PDF GENERATION LIMIT CHECK (Critical Paywall)
-- =====================================================

CREATE OR REPLACE FUNCTION can_generate_pdf(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tier TEXT;
  v_can_generate BOOLEAN;
BEGIN
  -- Get user tier
  SELECT tier INTO v_tier
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- If no profile exists, default to free
  IF v_tier IS NULL THEN
    v_tier := 'free';
  END IF;

  -- Get permission
  SELECT can_generate_pdfs INTO v_can_generate
  FROM get_tier_limits(v_tier);

  -- Return result
  IF NOT v_can_generate THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'pdf_generation_requires_upgrade',
      'tier', v_tier,
      'upgrade_required', TRUE,
      'message', 'PDF generation requires Basic or Pro plan. Upgrade to generate unlimited tailored resumes.'
    );
  ELSE
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'tier', v_tier
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_generate_pdf IS 'Check if user can generate PDF resumes (free tier blocked)';

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_tier_limits TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION can_upload_resume TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION can_add_job TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION can_generate_pdf TO authenticated, service_role, anon;

-- =====================================================
-- 7. SET DEFAULT TIER FOR EXISTING USERS
-- =====================================================

-- Update existing user_profiles to have 'free' tier if NULL
UPDATE user_profiles
SET tier = 'free'
WHERE tier IS NULL;

-- =====================================================
-- DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN user_profiles.tier IS 'User subscription tier: free (1 resume, 5 jobs, no PDFs), basic (10 resumes, 50 jobs, unlimited PDFs), pro (50 resumes, 250 jobs, unlimited PDFs)';
COMMENT ON COLUMN user_profiles.resumes_count IS 'Cached count of resumes uploaded (updated via triggers)';
COMMENT ON COLUMN user_profiles.resumes_limit IS 'Maximum resumes allowed for this user tier';
COMMENT ON COLUMN user_profiles.jobs_per_resume_limit IS 'Maximum job descriptions per resume for this user tier';
