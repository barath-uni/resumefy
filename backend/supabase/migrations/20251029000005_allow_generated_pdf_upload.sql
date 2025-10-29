-- Allow authenticated users to upload generated PDFs to their own folder
-- Folder structure: userId/resumeId/jobDescriptionId/generated_*.pdf

-- Policy: Users can upload to their own userId folder
CREATE POLICY "Allow authenticated users to upload generated PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resume'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own generated PDFs
CREATE POLICY "Allow users to read their own generated PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resume'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

COMMENT ON POLICY "Allow authenticated users to upload generated PDFs" ON storage.objects IS
'Users can upload generated PDFs to folders starting with their userId (structure: userId/resumeId/jobDescriptionId/generated_*.pdf)';
