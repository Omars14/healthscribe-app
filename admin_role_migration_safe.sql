-- Admin Role Management System (Safe Version)
-- This migration adds admin functionality safely without any table dependencies

-- Step 1: Create user_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'editor', 'transcriptionist');
  END IF;
END$$;

-- Step 2: Add columns to user_profiles if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_active ON user_profiles(role, is_active);

-- Step 4: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;

-- Step 5: Create new admin policies
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'admin'
    ) OR auth.uid() = id
  );

CREATE POLICY "Admins can manage all profiles" ON user_profiles
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'admin'
    )
  );

-- Step 6: Function to list all users (simplified version)
CREATE OR REPLACE FUNCTION admin_list_users(
  search_query TEXT DEFAULT NULL,
  role_filter user_role DEFAULT NULL,
  is_active_filter BOOLEAN DEFAULT NULL,
  page_size INT DEFAULT 50,
  page_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role user_role,
  assigned_editor_id UUID,
  assigned_editor_name TEXT,
  is_active BOOLEAN,
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  transcription_count BIGINT,
  review_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.assigned_editor_id,
    editor.full_name AS assigned_editor_name,
    COALESCE(up.is_active, true) AS is_active,
    up.last_active,
    up.created_at,
    up.updated_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    0::BIGINT AS transcription_count,  -- Will be updated when transcriptions table exists
    0::BIGINT AS review_count           -- Will be updated when reviews table exists
  FROM user_profiles up
  LEFT JOIN auth.users au ON au.id = up.id
  LEFT JOIN user_profiles editor ON editor.id = up.assigned_editor_id
  WHERE 
    (search_query IS NULL OR 
     up.email ILIKE '%' || search_query || '%' OR 
     up.full_name ILIKE '%' || search_query || '%')
    AND (role_filter IS NULL OR up.role = role_filter)
    AND (is_active_filter IS NULL OR COALESCE(up.is_active, true) = is_active_filter)
  ORDER BY up.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;

-- Step 7: Function to update user role
CREATE OR REPLACE FUNCTION admin_update_user_role(
  user_id UUID,
  new_role user_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Prevent removing the last admin
  IF new_role != 'admin' AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id 
    AND role = 'admin'
  ) THEN
    IF (SELECT COUNT(*) FROM user_profiles WHERE role = 'admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last admin';
    END IF;
  END IF;

  -- Update the role
  UPDATE user_profiles
  SET 
    role = new_role,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Step 8: Function to assign editor to transcriptionist
CREATE OR REPLACE FUNCTION admin_assign_editor(
  transcriptionist_id UUID,
  editor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Verify editor is actually an editor (if not null)
  IF editor_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = editor_id 
    AND role = 'editor'
  ) THEN
    RAISE EXCEPTION 'Selected user is not an editor';
  END IF;

  -- Update the assignment
  UPDATE user_profiles
  SET 
    assigned_editor_id = editor_id,
    updated_at = NOW()
  WHERE id = transcriptionist_id
  AND role = 'transcriptionist';
END;
$$;

-- Step 9: Function to bulk update users
CREATE OR REPLACE FUNCTION admin_bulk_update_users(
  user_ids UUID[],
  update_role user_role DEFAULT NULL,
  update_editor_id UUID DEFAULT NULL,
  update_is_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  updated_count INT,
  error_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_rows INT := 0;
  error_rows INT := 0;
  user_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Process each user
  FOREACH user_id IN ARRAY user_ids
  LOOP
    BEGIN
      UPDATE user_profiles
      SET 
        role = COALESCE(update_role, role),
        assigned_editor_id = CASE 
          WHEN update_editor_id IS NOT NULL THEN update_editor_id
          ELSE assigned_editor_id
        END,
        is_active = COALESCE(update_is_active, is_active),
        updated_at = NOW()
      WHERE id = user_id;
      
      updated_rows := updated_rows + 1;
    EXCEPTION WHEN OTHERS THEN
      error_rows := error_rows + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT updated_rows, error_rows;
END;
$$;

-- Step 10: Function to get user statistics
CREATE OR REPLACE FUNCTION admin_get_user_stats()
RETURNS TABLE (
  total_users BIGINT,
  admins_count BIGINT,
  editors_count BIGINT,
  transcriptionists_count BIGINT,
  active_users BIGINT,
  inactive_users BIGINT,
  users_last_30_days BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*) AS total_users,
    COUNT(*) FILTER (WHERE role = 'admin') AS admins_count,
    COUNT(*) FILTER (WHERE role = 'editor') AS editors_count,
    COUNT(*) FILTER (WHERE role = 'transcriptionist') AS transcriptionists_count,
    COUNT(*) FILTER (WHERE COALESCE(is_active, true) = true) AS active_users,
    COUNT(*) FILTER (WHERE COALESCE(is_active, true) = false) AS inactive_users,
    COUNT(*) FILTER (WHERE last_active >= NOW() - INTERVAL '30 days') AS users_last_30_days
  FROM user_profiles;
END;
$$;

-- Step 11: Function to deactivate user
CREATE OR REPLACE FUNCTION admin_deactivate_user(
  user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Prevent deactivating yourself
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot deactivate your own account';
  END IF;

  -- Prevent deactivating the last admin
  IF EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id 
    AND role = 'admin'
  ) THEN
    IF (SELECT COUNT(*) FROM user_profiles WHERE role = 'admin' AND COALESCE(is_active, true) = true) <= 1 THEN
      RAISE EXCEPTION 'Cannot deactivate the last active admin';
    END IF;
  END IF;

  -- Deactivate the user
  UPDATE user_profiles
  SET 
    is_active = false,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Step 12: Grant permissions
GRANT EXECUTE ON FUNCTION admin_list_users TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION admin_assign_editor TO authenticated;
GRANT EXECUTE ON FUNCTION admin_bulk_update_users TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_user_stats TO authenticated;
GRANT EXECUTE ON FUNCTION admin_deactivate_user TO authenticated;

-- Step 13: Create activity tracking trigger function
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET last_active = NOW()
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Triggers for activity tracking will be added as tables are created
-- For now, the last_active field can be updated manually or through the application

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE 'Admin role management system installed successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Set your first admin user with: UPDATE user_profiles SET role = ''admin'' WHERE email = ''your-email@example.com'';';
  RAISE NOTICE '2. Add SUPABASE_SERVICE_ROLE_KEY to your environment variables';
  RAISE NOTICE '3. Access the admin panel at /dashboard/admin/users';
END$$;
