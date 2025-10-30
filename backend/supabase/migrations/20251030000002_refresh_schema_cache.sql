-- Force schema cache refresh for AI insights columns
-- This migration is a no-op but forces Supabase to refresh its schema cache

DO $$
BEGIN
  -- Check if columns exist, if not add them (should already exist from previous migration)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'fit_score') THEN
    ALTER TABLE jobs ADD COLUMN fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'fit_score_breakdown') THEN
    ALTER TABLE jobs ADD COLUMN fit_score_breakdown JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'missing_skills') THEN
    ALTER TABLE jobs ADD COLUMN missing_skills JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'recommendations') THEN
    ALTER TABLE jobs ADD COLUMN recommendations JSONB;
  END IF;
END $$;

-- Refresh schema cache by touching the table
SELECT * FROM jobs LIMIT 0;
