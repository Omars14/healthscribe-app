-- Disable RLS on storage tables using superuser
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND (tablename = 'buckets' OR tablename = 'objects');

-- Verify bucket exists - this should now work
SELECT id, name, owner, public FROM storage.buckets WHERE name = 'audio-files';

-- If bucket doesn't exist, try to create it
INSERT INTO storage.buckets (id, name, owner, public, file_size_limit, allowed_mime_types)
SELECT 'audio-files', 'audio-files', (SELECT usesysid FROM pg_user WHERE usename = 'supabase_storage_admin'), true, 104857600, '{"audio/*","video/*"}'
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'audio-files');

-- Final check
SELECT id, name, owner, public FROM storage.buckets WHERE name = 'audio-files';
