-- Add new parsing_status values for Phase 3C (Template Engine)
-- Needed for: blocks_extracted, layout_decided, pdf_generated

-- Drop existing constraint
ALTER TABLE resumes DROP CONSTRAINT IF EXISTS resumes_parsing_status_check;

-- Add new constraint with Phase 3C statuses
ALTER TABLE resumes ADD CONSTRAINT resumes_parsing_status_check
CHECK (parsing_status IN (
  'pending',
  'processing',
  'completed',
  'failed',
  'blocks_extracted',   -- Phase 3C.1: Flexible blocks extracted
  'layout_decided',     -- Phase 3C.2: Layout decision made
  'pdf_generated'       -- Phase 3C.3: PDF rendered and uploaded
));

COMMENT ON CONSTRAINT resumes_parsing_status_check ON resumes IS
'Phase 3A: pending -> processing -> completed (text extraction)
Phase 3C: completed -> blocks_extracted -> layout_decided -> pdf_generated';
