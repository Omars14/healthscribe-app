-- Grant postgres superuser ownership of storage tables temporarily
ALTER TABLE storage.buckets OWNER TO postgres;
ALTER TABLE storage.objects OWNER TO postgres;

-- Now disable RLS as postgres (table owner)
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Restore ownership
ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;
ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND (tablename = 'buckets' OR tablename = 'objects');

-- Check bucket
SELECT id, name, owner, public FROM storage.buckets WHERE name = 'audio-files';
