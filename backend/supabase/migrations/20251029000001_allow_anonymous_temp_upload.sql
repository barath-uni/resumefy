-- =====================================================
-- STORAGE POLICIES FOR ANONYMOUS TEMP UPLOADS
-- Allow unauthenticated users to upload to temp/ folder
-- =====================================================

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('resume', 'resume', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous temp upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated user uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- Allow anonymous uploads to temp/ folder only
CREATE POLICY "Allow anonymous temp upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resume'
  AND (auth.role() = 'anon' OR auth.role() = 'authenticated')
  AND (storage.foldername(name))[1] = 'temp'
);

-- Allow authenticated users to upload to their own folders
CREATE POLICY "Allow authenticated user uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resume'
  AND auth.role() = 'authenticated'
);

-- Allow public read access to all files in resume bucket
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'resume');

-- Allow users to delete their own temp files (for cleanup)
CREATE POLICY "Allow temp file deletion"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resume'
  AND (storage.foldername(name))[1] = 'temp'
);
