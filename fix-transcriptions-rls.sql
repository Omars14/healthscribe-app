-- Fix RLS policies for transcriptions table
-- Run this in Supabase SQL Editor

-- First, check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'transcriptions';

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own transcriptions" ON transcriptions;
DROP POLICY IF EXISTS "Users can view their own transcriptions" ON transcriptions;
DROP POLICY IF EXISTS "Users can update their own transcriptions" ON transcriptions;
DROP POLICY IF EXISTS "Service role bypass" ON transcriptions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON transcriptions;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON transcriptions;

-- Create new policies

-- Allow authenticated users to insert transcriptions
CREATE POLICY "Enable insert for authenticated users" ON transcriptions
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to view their own transcriptions
CREATE POLICY "Enable select for authenticated users" ON transcriptions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR user_id IS NULL  -- Allow viewing anonymous transcriptions
);

-- Allow authenticated users to update their own transcriptions
CREATE POLICY "Enable update for authenticated users" ON transcriptions
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  OR user_id IS NULL
)
WITH CHECK (
  user_id = auth.uid() 
  OR user_id IS NULL
);

-- Allow service role to bypass RLS (for server-side operations)
CREATE POLICY "Service role bypass" ON transcriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'transcriptions';

-- Test by inserting a sample record (you can delete this after)
INSERT INTO transcriptions (
  file_name,
  doctor_name,
  patient_name,
  document_type,
  transcription_text,
  audio_url,
  user_id,
  created_at
) VALUES (
  'rls-test.mp3',
  'Dr. RLS Test',
  'RLS Patient',
  'consultation',
  '',
  'https://test.com/test.mp3',
  auth.uid(),  -- Will use current user's ID
  NOW()
) RETURNING id;

-- Clean up test record
DELETE FROM transcriptions WHERE file_name = 'rls-test.mp3';
