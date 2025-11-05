-- =====================================================
-- UPDATE: Tier Limits to Option 1 (Profitable Economics)
-- =====================================================
--
-- New limits:
-- Free: 1 resume, 5 jobs per resume = 5 max tailored resumes
-- Pro: 3 resumes, 25 jobs per resume = 75 max tailored resumes
-- Max: 10 resumes, 100 jobs per resume = 1,000 max tailored resumes
--
-- Economics at $0.01/tailoring:
-- Free: $0.05 AI cost (loss leader)
-- Pro: $0.75 AI cost → $8.24 profit (92% margin)
-- Max: $10.00 AI cost → $7.99 profit (44% margin)

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
      WHEN 'pro' THEN 3
      WHEN 'max' THEN 10
      ELSE 1  -- default to free tier limits
    END AS resumes_limit,
    CASE p_tier
      WHEN 'free' THEN 5
      WHEN 'pro' THEN 25
      WHEN 'max' THEN 100
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

-- Update comments
COMMENT ON FUNCTION get_tier_limits IS 'Tier limits: Free (1 resume, 5 jobs), Pro (3 resumes, 25 jobs), Max (10 resumes, 100 jobs)';
