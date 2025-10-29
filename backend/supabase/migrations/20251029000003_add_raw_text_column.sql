-- =====================================================
-- ADD RAW TEXT EXTRACTION COLUMNS TO RESUMES TABLE
-- For Phase 3A: Library-based PDF text extraction
-- =====================================================

-- Add columns for storing extracted raw text
ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS raw_text TEXT,
ADD COLUMN IF NOT EXISTS page_count INTEGER,
ADD COLUMN IF NOT EXISTS extracted_at TIMESTAMP;

-- Add index for faster text searches (optional, for future features)
CREATE INDEX IF NOT EXISTS idx_resumes_extracted_at ON resumes(extracted_at DESC);

-- Comment the columns
COMMENT ON COLUMN resumes.raw_text IS 'Raw text extracted from PDF using pdf-parse library';
COMMENT ON COLUMN resumes.page_count IS 'Number of pages in the original PDF';
COMMENT ON COLUMN resumes.extracted_at IS 'Timestamp when text extraction completed';
