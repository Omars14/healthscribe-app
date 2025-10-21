-- ============================================================================
-- HEALTHSCRIBE DATABASE SCHEMA INITIALIZATION
-- Run this script against the Supabase PostgreSQL database to create all
-- required tables, indexes, policies, and functions
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create public schema (usually exists but ensure it's there)
CREATE SCHEMA IF NOT EXISTS public;

-- ============================================================================
-- CREATE TRANSCRIPTIONS TABLE
-- This is the CRITICAL table we're missing
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT,
  doctor_name TEXT,
  patient_name TEXT,
  document_type TEXT,
  audio_url TEXT,
  transcription_text TEXT DEFAULT '',
  formatted_document TEXT,
  status TEXT DEFAULT 'pending',
  error TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- CREATE USER_PROFILES TABLE (companion table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_active TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON public.transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON public.transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON public.transcriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR TRANSCRIPTIONS
-- Users can only see and modify their own transcriptions
-- ============================================================================

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Users can create transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Users can update their own transcriptions" ON public.transcriptions;

-- Allow users to view their own transcriptions
CREATE POLICY "Users can view their own transcriptions" ON public.transcriptions
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    user_id IS NULL  -- Allow system records without user_id
  );

-- Allow authenticated users to create transcriptions
CREATE POLICY "Users can create transcriptions" ON public.transcriptions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    user_id IS NULL  -- Allow system to create records
  );

-- Allow users to update their own transcriptions
CREATE POLICY "Users can update their own transcriptions" ON public.transcriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES FOR USER_PROFILES
-- Users can view their own profile, admins can view all
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STORAGE BUCKET SETUP
-- Create public URL bucket for audio files
-- ============================================================================

-- Create storage bucket for audio files (if not exists)
-- Note: We do this via Supabase API, not raw SQL
-- The bucket "audio-files" should be created with permissions set via the dashboard

-- ============================================================================
-- CREATE AUDIO-FILES BUCKET POLICY
-- Users can upload to their own folder, view their own files
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own audio files" ON storage.objects;

-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload their own audio files" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-files' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      (storage.foldername(name))[1] = 'anonymous'
    )
  );

-- Allow users to view their own files
CREATE POLICY "Users can view their own audio files" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'audio-files' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      (storage.foldername(name))[1] = 'anonymous'
    )
  );

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_transcriptions_updated_at ON public.transcriptions;
CREATE TRIGGER update_transcriptions_updated_at
  BEFORE UPDATE ON public.transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;

-- Grant table permissions
GRANT ALL ON public.transcriptions TO postgres;
GRANT SELECT, INSERT, UPDATE ON public.transcriptions TO authenticated;

GRANT ALL ON public.user_profiles TO postgres;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

-- Grant sequence permissions (for any auto-incrementing columns)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- ============================================================================
-- COMPLETION
-- ============================================================================
-- Schema initialization complete!
-- Tables created:
--   - public.transcriptions
--   - public.user_profiles
--
-- Indexes created for optimal performance
-- RLS Policies enabled and configured
-- Triggers set up for automatic timestamp updates
-- ============================================================================
