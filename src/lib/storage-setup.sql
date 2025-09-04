-- Supabase Storage Bucket Setup for Audio Files
-- Run this in your Supabase SQL Editor

-- Note: The bucket creation is handled by the API code if it doesn't exist
-- These are the RLS policies for the audio-files bucket

-- Enable RLS on storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload their own audio files
CREATE POLICY "Users can upload their own audio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-files' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   (storage.foldername(name))[1] = 'anonymous')
);

-- Policy: Allow authenticated users to view their own audio files
CREATE POLICY "Users can view their own audio files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   (storage.foldername(name))[1] = 'anonymous')
);

-- Policy: Allow authenticated users to delete their own audio files
CREATE POLICY "Users can delete their own audio files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow public/anonymous users to upload to anonymous folder
CREATE POLICY "Anonymous users can upload audio files"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'audio-files' AND
  (storage.foldername(name))[1] = 'anonymous'
);

-- Policy: Allow service role full access (for server-side operations)
CREATE POLICY "Service role has full access to audio files"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'audio-files')
WITH CHECK (bucket_id = 'audio-files');

-- Make sure the audio_url column exists in transcriptions table
ALTER TABLE transcriptions 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Add index on audio_url for faster lookups
CREATE INDEX IF NOT EXISTS idx_transcriptions_audio_url 
ON transcriptions(audio_url);

-- Update any existing records that might have empty audio_url
-- (This is optional - only if you want to backfill)
-- UPDATE transcriptions 
-- SET audio_url = '' 
-- WHERE audio_url IS NULL;
