-- Add missing_skills and recommendations columns to tailored_content_cache
ALTER TABLE tailored_content_cache
ADD COLUMN IF NOT EXISTS missing_skills JSONB,
ADD COLUMN IF NOT EXISTS recommendations JSONB;
