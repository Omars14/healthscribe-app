-- Quick User Setup for New Supabase Project
-- This script helps you create your first user account

-- Option 1: Use Supabase Dashboard (RECOMMENDED)
-- 1. Go to https://supabase.com/dashboard/project/yaznemrwbingjwqutbvb/auth/users
-- 2. Click "Add user" → "Create new user"
-- 3. Enter:
--    Email: omars14@gmail.com
--    Password: (choose a secure password)
--    Auto Confirm Email: ✓ (check this)
-- 4. Click "Create user"

-- Option 2: Use Sign Up in Your App
-- 1. Temporarily modify your sign-in page to allow sign-up
-- 2. Sign up with omars14@gmail.com
-- 3. Check your email for confirmation (or auto-confirm in dashboard)

-- Option 3: Use SQL (Advanced - requires existing auth.users entry)
-- If you already have a user created but need to verify it:
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email = 'omars14@gmail.com';

-- To check if user exists:
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'omars14@gmail.com';

-- Note: You cannot directly insert into auth.users via SQL.
-- Users must be created through Supabase Auth API or Dashboard.
