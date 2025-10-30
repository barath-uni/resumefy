-- Add AI insights columns to jobs table for Phase 3B
-- These columns store the results of agentic AI orchestration

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
ADD COLUMN IF NOT EXISTS fit_score_breakdown JSONB,
ADD COLUMN IF NOT EXISTS missing_skills JSONB,
ADD COLUMN IF NOT EXISTS recommendations JSONB;

-- Add comments for documentation
COMMENT ON COLUMN jobs.fit_score IS 'AI-calculated fit score (0-100%) showing how well the resume matches the job description';
COMMENT ON COLUMN jobs.fit_score_breakdown IS 'Detailed breakdown of fit score: { keywords: 40, experience: 40, qualifications: 20 }';
COMMENT ON COLUMN jobs.missing_skills IS 'Array of missing skills with certification suggestions';
COMMENT ON COLUMN jobs.recommendations IS 'Array of actionable recommendations to improve chances of getting hired';
