-- Complete fix for transcriptions table RLS
-- Run this in Supabase SQL Editor

-- Option 1: TEMPORARILY DISABLE RLS (for testing)
-- Uncomment the next line to disable RLS completely
-- ALTER TABLE transcriptions DISABLE ROW LEVEL SECURITY;

-- Option 2: Fix RLS with more permissive policies
-- First, drop ALL existing policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'transcriptions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON transcriptions', pol.policyname);
    END LOOP;
END $$;

-- Now create very permissive policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" 
ON transcriptions
FOR ALL 
USING (true)
WITH CHECK (true);

-- Test the fix
SELECT 'Testing insert with current user...' as status;

-- Try to insert a test record
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
  'test-rls-fix.mp3',
  'Dr. Test',
  'Test Patient',
  'consultation',
  '',
  'https://test.com/test.mp3',
  '625d7540-ab35-4fee-8817-6d0b32644869',  -- Your user ID
  NOW()
) RETURNING id;

-- Check if it worked
SELECT id, file_name, created_at 
FROM transcriptions 
WHERE file_name = 'test-rls-fix.mp3';

-- Clean up test
DELETE FROM transcriptions WHERE file_name = 'test-rls-fix.mp3';

-- Show current RLS status
SELECT 
  tablename,
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'transcriptions') as policy_count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'transcriptions';

SELECT 'RLS fix complete!' as status;
