-- =====================================================
-- ADD PDF GENERATION COLUMNS TO JOBS TABLE
-- Purpose: Support job-centric PDF generation with templates A, B, C
-- =====================================================

-- Add pdf_url column to store generated PDF signed URL
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add generation_status to track PDF generation state
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'pending'
CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed'));

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_jobs_generation_status ON jobs(generation_status);

-- Add updated_at tracking for jobs
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

COMMENT ON COLUMN jobs.pdf_url IS 'Signed URL of generated PDF for this job + template combination';
COMMENT ON COLUMN jobs.generation_status IS 'Status of PDF generation: pending (not started), generating (in progress), completed (done), failed (error)';
COMMENT ON COLUMN jobs.updated_at IS 'Last update timestamp for tracking generation progress';
