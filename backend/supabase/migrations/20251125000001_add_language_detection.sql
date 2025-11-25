-- Migration: Add language detection columns to tailored_content_cache
-- Issue #1 Fix: Track detected language to ensure output matches input language

-- Add detected_language column (ISO 639-1 code, e.g., "en", "pt", "es")
ALTER TABLE tailored_content_cache
ADD COLUMN IF NOT EXISTS detected_language TEXT;

-- Add detected_language_name column (full name, e.g., "English", "Portuguese")
ALTER TABLE tailored_content_cache
ADD COLUMN IF NOT EXISTS detected_language_name TEXT;

-- Add helpful comment
COMMENT ON COLUMN tailored_content_cache.detected_language IS 'ISO 639-1 language code detected from resume (e.g., "en", "pt", "es")';
COMMENT ON COLUMN tailored_content_cache.detected_language_name IS 'Full language name (e.g., "English", "Portuguese", "Spanish")';

-- Create index for querying by language (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_tailored_content_cache_language ON tailored_content_cache(detected_language);
