-- =====================================================
-- Add file upload fields to email_captures table
-- Created: 2025-10-28
-- Purpose: Store uploaded resume info before user authenticates
-- =====================================================

ALTER TABLE email_captures
ADD COLUMN IF NOT EXISTS uploaded_file_url TEXT,
ADD COLUMN IF NOT EXISTS uploaded_file_name TEXT,
ADD COLUMN IF NOT EXISTS uploaded_file_size INTEGER,
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP DEFAULT NOW();

COMMENT ON COLUMN email_captures.uploaded_file_url IS 'Supabase Storage URL for uploaded resume file';
COMMENT ON COLUMN email_captures.uploaded_file_name IS 'Original filename of uploaded resume';
COMMENT ON COLUMN email_captures.uploaded_file_size IS 'File size in bytes';
COMMENT ON COLUMN email_captures.uploaded_at IS 'When file was uploaded';
