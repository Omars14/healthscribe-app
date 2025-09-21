-- Complete Database Schema for HealthScribe Migration
-- This script creates all tables and configurations needed for the application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema and basic tables (if not already created by init.sql)
CREATE SCHEMA IF NOT EXISTS auth;

-- Create user_role enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'editor', 'transcriptionist');
    END IF;
END$$;

-- Create review_status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE review_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'completed');
    END IF;
END$$;

-- Create user_profiles table
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

-- Create transcriptions table
CREATE TABLE IF NOT EXISTS public.transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transcriptionist_id UUID REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  original_filename TEXT,
  file_path TEXT,
  transcription_text TEXT,
  confidence_score DECIMAL,
  duration_seconds INTEGER,
  file_size_bytes INTEGER,
  mime_type TEXT,
  language TEXT DEFAULT 'en',
  status TEXT DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  review_status review_status DEFAULT NULL,
  review_id UUID,
  is_final BOOLEAN DEFAULT FALSE,
  final_version TEXT
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcription_id UUID NOT NULL REFERENCES transcriptions(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  status review_status DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  editor_notes TEXT,
  original_text TEXT,
  edited_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create review_comments table
CREATE TABLE IF NOT EXISTS public.review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  timestamp_reference DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create audit_log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_assigned_editor ON public.user_profiles(assigned_editor_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_active ON public.user_profiles(role, is_active);
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON public.transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON public.transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON public.transcriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_transcriptions_review_status ON public.transcriptions(review_status);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_assigned_to ON public.reviews(assigned_to);
CREATE INDEX IF NOT EXISTS idx_reviews_requested_by ON public.reviews(requested_by);
CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON public.review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.user_profiles WHERE role = 'admin'
    ) OR auth.uid() = id
  );

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.user_profiles WHERE role = 'admin'
    )
  );

-- Create RLS policies for transcriptions
DROP POLICY IF EXISTS "Users can view their own transcriptions" ON public.transcriptions;
CREATE POLICY "Users can view their own transcriptions" ON public.transcriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own transcriptions" ON public.transcriptions;
CREATE POLICY "Users can create their own transcriptions" ON public.transcriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own transcriptions" ON public.transcriptions;
CREATE POLICY "Users can update their own transcriptions" ON public.transcriptions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transcriptions" ON public.transcriptions;
CREATE POLICY "Admins can view all transcriptions" ON public.transcriptions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.user_profiles WHERE role = 'admin'
    )
  );

-- Create RLS policies for reviews
DROP POLICY IF EXISTS "Users can view their own review requests" ON public.reviews;
CREATE POLICY "Users can view their own review requests" ON public.reviews
  FOR SELECT USING (
    requested_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Transcriptionists can create review requests" ON public.reviews;
CREATE POLICY "Transcriptionists can create review requests" ON public.reviews
  FOR INSERT WITH CHECK (
    requested_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'transcriptionist'
    )
  );

DROP POLICY IF EXISTS "Editors can update reviews assigned to them" ON public.reviews;
CREATE POLICY "Editors can update reviews assigned to them" ON public.reviews
  FOR UPDATE USING (
    assigned_to = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'editor'
    )
  );

-- Create RLS policies for review_comments
DROP POLICY IF EXISTS "Users can view comments on their reviews" ON public.review_comments;
CREATE POLICY "Users can view comments on their reviews" ON public.review_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_comments.review_id
      AND (r.requested_by = auth.uid() OR r.assigned_to = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can add comments to their reviews" ON public.review_comments;
CREATE POLICY "Users can add comments to their reviews" ON public.review_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_comments.review_id
      AND (r.requested_by = auth.uid() OR r.assigned_to = auth.uid())
    )
  );

-- Create RLS policies for audit_log (admin only)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_log;
CREATE POLICY "Admins can view audit logs" ON public.audit_log
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.user_profiles WHERE role = 'admin'
    )
  );

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transcriptions_updated_at ON public.transcriptions;
CREATE TRIGGER update_transcriptions_updated_at
  BEFORE UPDATE ON public.transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update last_active on any user activity
CREATE OR REPLACE FUNCTION public.update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles
  SET last_active = NOW()
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for transcriptions table
DROP TRIGGER IF EXISTS update_last_active_on_transcription ON public.transcriptions;
CREATE TRIGGER update_last_active_on_transcription
  AFTER INSERT OR UPDATE ON public.transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_last_active();

-- Create function to automatically assign editor based on transcriptionist
CREATE OR REPLACE FUNCTION public.assign_editor_to_review()
RETURNS TRIGGER AS $$
BEGIN
  -- If no editor is assigned, get the transcriptionist's assigned editor
  IF NEW.assigned_to IS NULL THEN
    SELECT assigned_editor_id INTO NEW.assigned_to
    FROM public.user_profiles
    WHERE id = NEW.requested_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign editor
DROP TRIGGER IF EXISTS auto_assign_editor ON public.reviews;
CREATE TRIGGER auto_assign_editor
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_editor_to_review();

-- Create function to log audit trail
CREATE OR REPLACE FUNCTION public.create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for important tables
DROP TRIGGER IF EXISTS audit_reviews ON public.reviews;
CREATE TRIGGER audit_reviews
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.create_audit_log();

DROP TRIGGER IF EXISTS audit_transcriptions ON public.transcriptions;
CREATE TRIGGER audit_transcriptions
  AFTER UPDATE ON public.transcriptions
  FOR EACH ROW
  WHEN (OLD.transcription_text IS DISTINCT FROM NEW.transcription_text
    OR OLD.final_version IS DISTINCT FROM NEW.final_version)
  EXECUTE FUNCTION public.create_audit_log();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Create admin functions (simplified versions)
CREATE OR REPLACE FUNCTION public.admin_list_users(
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
    SELECT 1 FROM public.user_profiles
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
    COALESCE((SELECT COUNT(*) FROM public.transcriptions WHERE transcriptionist_id = up.id), 0) AS transcription_count,
    0::BIGINT AS review_count  -- Placeholder for future reviews table
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON au.id = up.id
  LEFT JOIN public.user_profiles editor ON editor.id = up.assigned_editor_id
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.admin_list_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_last_active TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_editor_to_review TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_audit_log TO authenticated;

-- Insert a test admin user (you can remove this in production)
-- This will be created when we run the migration with actual user data




