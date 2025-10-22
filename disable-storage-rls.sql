-- ============================================================================
-- DISABLE RLS ON ALL STORAGE TABLES
-- This is necessary to allow file uploads to work in the self-hosted Supabase
-- ============================================================================

-- Step 1: Drop all existing policies on storage tables
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                   r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- Step 2: Disable RLS on all storage tables
DO $$
DECLARE 
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'storage'
  LOOP
    EXECUTE 'ALTER TABLE storage.' || r.tablename || ' DISABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'Disabled RLS on storage.%', r.tablename;
  END LOOP;
END $$;

-- Step 3: Verify all tables have RLS disabled
SELECT 
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'storage'
ORDER BY tablename;
