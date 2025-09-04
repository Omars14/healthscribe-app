-- Simple storage policies using RLS
-- Run this if the previous approach doesn't work

-- Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own audio files" ON storage.objects;

-- Policy 1: Allow authenticated users to upload to audio-files bucket
CREATE POLICY "Authenticated users can upload audio files" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'audio-files');

-- Policy 2: Allow anyone to view files in audio-files bucket (for public URLs)
CREATE POLICY "Anyone can view audio files" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audio-files');

-- Policy 3: Allow users to delete their own files
CREATE POLICY "Users can delete their own audio files" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-files' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Verify the bucket is set to public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'audio-files';

-- Check the configuration
SELECT 'Bucket Configuration:' as info;
SELECT id, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'audio-files';

SELECT 'Storage Policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';
