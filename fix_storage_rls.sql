-- Disable RLS on storage tables permanently
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies that might interfere
DO $$
DECLARE
    policy_name record;
BEGIN
    FOR policy_name IN
        SELECT policyname FROM pg_policies WHERE schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                      policy_name.policyname, 'storage', 'buckets');
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                      policy_name.policyname, 'storage', 'objects');
    END LOOP;
END $$;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND (tablename = 'buckets' OR tablename = 'objects')
ORDER BY tablename;

-- Verify bucket exists
SELECT id, name, owner, public 
FROM storage.buckets 
WHERE name = 'audio-files';

-- If bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, owner, public, file_size_limit, allowed_mime_types)
SELECT 'audio-files', 'audio-files', '1'::uuid, true, 104857600, '{"audio/*","video/*"}'
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'audio-files');

-- Final verification
SELECT id, name, owner, public FROM storage.buckets WHERE name = 'audio-files';
