-- Configure the existing audio-files bucket for public access
-- This allows authenticated users to upload and anyone to read files (via public URLs)

-- First, check if the bucket exists and its current settings
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'audio-files';

-- Update bucket configuration to ensure it's properly set up
UPDATE storage.buckets 
SET 
  public = true,  -- Make bucket public so files can be accessed via public URLs
  file_size_limit = 104857600,  -- 100MB limit
  allowed_mime_types = ARRAY[
    'audio/mpeg',
    'audio/wav', 
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/mp3',
    'audio/x-wav',
    'audio/wave'
  ]
WHERE id = 'audio-files';

-- Remove existing policies to start fresh (optional - comment out if you want to keep existing policies)
DELETE FROM storage.policies WHERE bucket_id = 'audio-files';

-- Create storage policies for the audio-files bucket

-- 1. Allow authenticated users to upload files
INSERT INTO storage.policies (bucket_id, name, definition, check_expression)
VALUES (
  'audio-files',
  'Allow authenticated users to upload',
  '{"operation": "INSERT"}',
  'auth.role() = ''authenticated'''
)
ON CONFLICT (bucket_id, name) DO UPDATE
SET definition = EXCLUDED.definition,
    check_expression = EXCLUDED.check_expression;

-- 2. Allow authenticated users to update their own files
INSERT INTO storage.policies (bucket_id, name, definition, check_expression)
VALUES (
  'audio-files',
  'Allow users to update own files',
  '{"operation": "UPDATE"}',
  'auth.uid()::text = (storage.foldername(name))[1]'
)
ON CONFLICT (bucket_id, name) DO UPDATE
SET definition = EXCLUDED.definition,
    check_expression = EXCLUDED.check_expression;

-- 3. Allow authenticated users to delete their own files
INSERT INTO storage.policies (bucket_id, name, definition, check_expression)
VALUES (
  'audio-files',
  'Allow users to delete own files',
  '{"operation": "DELETE"}',
  'auth.uid()::text = (storage.foldername(name))[1]'
)
ON CONFLICT (bucket_id, name) DO UPDATE
SET definition = EXCLUDED.definition,
    check_expression = EXCLUDED.check_expression;

-- 4. Allow all users (including anonymous) to read files
-- This is needed for public URLs to work
INSERT INTO storage.policies (bucket_id, name, definition, check_expression)
VALUES (
  'audio-files',
  'Allow public read access',
  '{"operation": "SELECT"}',
  'true'  -- Always allow read access
)
ON CONFLICT (bucket_id, name) DO UPDATE
SET definition = EXCLUDED.definition,
    check_expression = EXCLUDED.check_expression;

-- Verify the policies were created
SELECT * FROM storage.policies WHERE bucket_id = 'audio-files';

-- Note: If you're getting permission errors, you might need to use the Supabase Dashboard
-- Go to Storage → audio-files → Policies and configure them there with the UI
