-- Disable RLS on storage tables - run as superuser (postgres)
-- First, become the table owner to make changes
SET ROLE supabase_storage_admin;

ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

RESET ROLE;

-- Now verify as postgres superuser
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND (tablename = 'buckets' OR tablename = 'objects')
ORDER BY tablename;

-- Verify bucket exists (as postgres)
SELECT id, name, owner, public 
FROM storage.buckets 
WHERE name = 'audio-files';
