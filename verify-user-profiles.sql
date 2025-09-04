-- Just verify the user_profiles table exists and has data
SELECT 'Checking user_profiles table...' as status;

-- Check if table exists and count rows
SELECT COUNT(*) as user_count FROM public.user_profiles;

-- Show the structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles';

-- Check policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- If no users exist, insert for existing auth users
INSERT INTO public.user_profiles (id, email, role)
SELECT id, email, 'transcriptionist'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

SELECT 'User profiles table is ready!' as status;
