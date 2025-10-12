-- =====================================================
-- Comprehensive Database Fix for Transcription History and Admin Panel
-- For user: omars14@gmail.com
-- =====================================================

\echo '=========================================='
\echo 'Phase 1: DIAGNOSTIC - Current State'
\echo '=========================================='

-- Check if auth.users table exists and find the user
\echo '1. Checking auth.users for omars14@gmail.com...'
SELECT 
    id, 
    email, 
    created_at, 
    last_sign_in_at,
    email_confirmed_at,
    (raw_user_meta_data->>'full_name') as full_name
FROM auth.users 
WHERE email = 'omars14@gmail.com';

-- Check if user_profiles table exists
\echo '2. Checking if user_profiles table exists...'
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
) as user_profiles_exists;

-- Check user_profiles table structure
\echo '3. Checking user_profiles table structure...'
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check if user profile exists
\echo '4. Checking user profile for omars14@gmail.com...'
SELECT * FROM public.user_profiles WHERE email = 'omars14@gmail.com';

-- Count all transcriptions
\echo '5. Counting all transcriptions in database...'
SELECT COUNT(*) as total_transcriptions FROM public.transcriptions;

-- Count transcriptions for this user (if user exists)
\echo '6. Counting transcriptions for omars14@gmail.com...'
SELECT COUNT(*) as user_transcriptions 
FROM public.transcriptions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'omars14@gmail.com');

-- Check for orphaned transcriptions (no user_id)
\echo '7. Checking for orphaned transcriptions...'
SELECT COUNT(*) as orphaned_transcriptions 
FROM public.transcriptions 
WHERE user_id IS NULL;

-- Sample transcriptions
\echo '8. Sample of recent transcriptions...'
SELECT 
    t.id, 
    t.file_name, 
    t.doctor_name,
    t.created_at,
    t.user_id,
    u.email as user_email
FROM public.transcriptions t
LEFT JOIN auth.users u ON u.id = t.user_id
ORDER BY t.created_at DESC
LIMIT 10;

-- Check RLS policies
\echo '9. Checking RLS policies on user_profiles and transcriptions...'
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd,
    SUBSTRING(qual::text, 1, 50) as condition_preview
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'transcriptions')
ORDER BY tablename, policyname;

\echo ''
\echo '=========================================='
\echo 'Phase 2: FIXES - Creating/Updating Schema'
\echo '=========================================='

-- Create user_role enum if it doesn't exist
\echo '10. Creating user_role enum...'
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'editor', 'transcriptionist');
        RAISE NOTICE 'Created user_role enum';
    ELSE
        RAISE NOTICE 'user_role enum already exists';
    END IF;
END $$;

-- Create user_profiles table if it doesn't exist
\echo '11. Creating user_profiles table if needed...'
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'transcriptionist',
    assigned_editor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    last_active TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS on user_profiles
\echo '12. Enabling RLS on user_profiles...'
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes
\echo '13. Creating indexes on user_profiles...'
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_active ON public.user_profiles(role, is_active);

-- Ensure transcriptions table has required columns
\echo '14. Adding missing columns to transcriptions table...'
ALTER TABLE public.transcriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.transcriptions ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE public.transcriptions ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.transcriptions ADD COLUMN IF NOT EXISTS error TEXT;
ALTER TABLE public.transcriptions ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.transcriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes on transcriptions
\echo '15. Creating indexes on transcriptions...'
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON public.transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON public.transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON public.transcriptions(created_at);

\echo ''
\echo '=========================================='
\echo 'Phase 3: USER PROFILE - Creating Admin User'
\echo '=========================================='

-- Insert or update user profile with admin role
\echo '16. Creating/updating admin profile for omars14@gmail.com...'
DO $$
DECLARE
    user_uuid UUID;
    user_email TEXT := 'omars14@gmail.com';
BEGIN
    -- Get user ID
    SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User % not found in auth.users table!', user_email;
    END IF;
    
    RAISE NOTICE 'Found user ID: %', user_uuid;
    
    -- Insert or update profile
    INSERT INTO public.user_profiles (id, email, role, is_active, created_at, updated_at)
    VALUES (
        user_uuid,
        user_email,
        'admin'::user_role,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
        role = 'admin'::user_role,
        is_active = true,
        updated_at = NOW();
    
    RAISE NOTICE 'Successfully created/updated admin profile for: %', user_email;
END $$;

\echo ''
\echo '=========================================='
\echo 'Phase 4: RLS POLICIES - Setting Up Security'
\echo '=========================================='

-- Drop existing policies to avoid conflicts
\echo '17. Dropping existing RLS policies...'
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Users can create their own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Users can update their own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Admins can view all transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Service role can do everything" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage transcriptions" ON public.transcriptions;

-- User Profiles RLS Policies
\echo '18. Creating RLS policies for user_profiles...'

CREATE POLICY "Users can view their own profile" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.user_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) OR auth.uid() = id
);

CREATE POLICY "Admins can manage all profiles"
ON public.user_profiles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Transcriptions RLS Policies
\echo '19. Creating RLS policies for transcriptions...'

CREATE POLICY "Users can view their own transcriptions"
ON public.transcriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transcriptions"
ON public.transcriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transcriptions"
ON public.transcriptions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transcriptions"
ON public.transcriptions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

\echo ''
\echo '=========================================='
\echo 'Phase 5: DATA INTEGRITY - Fix Orphaned Records'
\echo '=========================================='

-- Assign orphaned transcriptions to admin user
\echo '20. Assigning orphaned transcriptions to omars14@gmail.com...'
DO $$
DECLARE
    user_uuid UUID;
    orphaned_count INTEGER;
BEGIN
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'omars14@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Count orphaned records
        SELECT COUNT(*) INTO orphaned_count 
        FROM public.transcriptions 
        WHERE user_id IS NULL;
        
        IF orphaned_count > 0 THEN
            -- Assign them to the admin user
            UPDATE public.transcriptions
            SET user_id = user_uuid
            WHERE user_id IS NULL;
            
            RAISE NOTICE 'Assigned % orphaned transcriptions to omars14@gmail.com', orphaned_count;
        ELSE
            RAISE NOTICE 'No orphaned transcriptions found';
        END IF;
    END IF;
END $$;

\echo ''
\echo '=========================================='
\echo 'Phase 6: VERIFICATION - Final Checks'
\echo '=========================================='

-- Verify admin user profile
\echo '21. Verifying admin user profile...'
SELECT 
    id,
    email,
    role,
    is_active,
    created_at
FROM public.user_profiles 
WHERE email = 'omars14@gmail.com';

-- Count transcriptions for admin user
\echo '22. Counting transcriptions for admin user...'
SELECT 
    COUNT(*) as total_transcriptions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM public.transcriptions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'omars14@gmail.com');

-- Sample transcriptions for admin user
\echo '23. Sample transcriptions for admin user...'
SELECT 
    id,
    file_name,
    doctor_name,
    patient_name,
    status,
    created_at
FROM public.transcriptions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'omars14@gmail.com')
ORDER BY created_at DESC
LIMIT 5;

-- Verify RLS policies are in place
\echo '24. Verifying RLS policies...'
SELECT 
    tablename, 
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'transcriptions')
GROUP BY tablename;

\echo ''
\echo '=========================================='
\echo 'SUCCESS! Database fixes completed.'
\echo '=========================================='
\echo ''
\echo 'Next steps:'
\echo '1. Restart the Next.js application in Coolify'
\echo '2. Clear browser cache and cookies'
\echo '3. Login as omars14@gmail.com'
\echo '4. Check dashboard for transcription history'
\echo '5. Access admin panel at /dashboard/admin/users'
\echo ''

