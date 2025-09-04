-- Admin Role Management System
-- This migration adds comprehensive admin functionality for user role management

-- First, ensure user_role enum exists (might already exist from previous migration)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'editor', 'transcriptionist');
  END IF;
END$$;

-- Ensure user_profiles table has all necessary columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_active ON user_profiles(role, is_active);

-- Drop existing admin policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;

-- Create comprehensive admin policies
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- Function to list all users with detailed information (admin only)
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
    COALESCE(t_count.count, 0) AS transcription_count,
    0::BIGINT AS review_count  -- Placeholder since reviews table doesn't exist yet
  FROM user_profiles up
  LEFT JOIN auth.users au ON au.id = up.id
  LEFT JOIN user_profiles editor ON editor.id = up.assigned_editor_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS count
    FROM transcriptions
    WHERE transcriptionist_id = up.id
  ) t_count ON true
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

-- Function to update user role (admin only)
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

  -- Log the action
  INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
  SELECT 
    auth.uid(),
    'UPDATE_ROLE',
    'user_profiles',
    user_id,
    jsonb_build_object('role', up.role),
    jsonb_build_object('role', new_role)
  FROM user_profiles up
  WHERE up.id = user_id;
END;
$$;

-- Function to assign editor to transcriptionist (admin only)
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

  -- Verify editor is actually an editor
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

  -- Log the action
  INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
  SELECT 
    auth.uid(),
    'ASSIGN_EDITOR',
    'user_profiles',
    transcriptionist_id,
    jsonb_build_object('assigned_editor_id', up.assigned_editor_id),
    jsonb_build_object('assigned_editor_id', editor_id)
  FROM user_profiles up
  WHERE up.id = transcriptionist_id;
END;
$$;

-- Function to bulk update users (admin only)
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

  -- Log bulk action
  INSERT INTO audit_log (user_id, action, table_name, record_id, new_data)
  VALUES (
    auth.uid(),
    'BULK_UPDATE',
    'user_profiles',
    gen_random_uuid(),
    jsonb_build_object(
      'user_ids', user_ids,
      'updates', jsonb_build_object(
        'role', update_role,
        'editor_id', update_editor_id,
        'is_active', update_is_active
      ),
      'updated_count', updated_rows,
      'error_count', error_rows
    )
  );

  RETURN QUERY SELECT updated_rows, error_rows;
END;
$$;

-- Function to get user statistics (admin only)
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

-- Function to deactivate user (soft delete, admin only)
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
    IF (SELECT COUNT(*) FROM user_profiles WHERE role = 'admin' AND is_active = true) <= 1 THEN
      RAISE EXCEPTION 'Cannot deactivate the last active admin';
    END IF;
  END IF;

  -- Deactivate the user
  UPDATE user_profiles
  SET 
    is_active = false,
    updated_at = NOW()
  WHERE id = user_id;

  -- Log the action
  INSERT INTO audit_log (user_id, action, table_name, record_id, new_data)
  VALUES (
    auth.uid(),
    'DEACTIVATE_USER',
    'user_profiles',
    user_id,
    jsonb_build_object('is_active', false)
  );
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION admin_list_users TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION admin_assign_editor TO authenticated;
GRANT EXECUTE ON FUNCTION admin_bulk_update_users TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_user_stats TO authenticated;
GRANT EXECUTE ON FUNCTION admin_deactivate_user TO authenticated;

-- Create trigger to update last_active on any user activity
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET last_active = NOW()
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to track user activity
DROP TRIGGER IF EXISTS update_last_active_on_transcription ON transcriptions;
CREATE TRIGGER update_last_active_on_transcription
  AFTER INSERT OR UPDATE ON transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();

-- Note: Trigger for reviews table will be added when reviews table is created
