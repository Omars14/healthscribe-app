-- Complete database schema for the Next.js Dashboard
-- Run this in your NEW Supabase project's SQL editor

-- Create transcriptions table with ALL columns
CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT,
  doctor_name TEXT,
  patient_name TEXT,
  document_type TEXT,
  transcription_text TEXT,
  audio_url TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'processing', 'completed', 'failed')),
  file_size BIGINT,
  duration INTEGER,
  error TEXT,
  metadata JSONB,
  upload_id TEXT,
  storage_provider TEXT DEFAULT 'supabase',
  audio_file_name TEXT,
  upload_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcriptions_doctor_name ON transcriptions(doctor_name);
CREATE INDEX IF NOT EXISTS idx_transcriptions_upload_id ON transcriptions(upload_id);

-- Enable Row Level Security
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy: Users can view their own transcriptions
CREATE POLICY "Users can view own transcriptions" ON transcriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own transcriptions
CREATE POLICY "Users can insert own transcriptions" ON transcriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own transcriptions
CREATE POLICY "Users can update own transcriptions" ON transcriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own transcriptions
CREATE POLICY "Users can delete own transcriptions" ON transcriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Allow anon users to create transcriptions (for before login)
CREATE POLICY "Anon users can create transcriptions" ON transcriptions
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Policy: Service role has full access (for admin operations)
CREATE POLICY "Service role has full access" ON transcriptions
  TO service_role
  USING (true);

-- Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_transcriptions_updated_at
  BEFORE UPDATE ON transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for audio files (optional)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to audio files bucket
CREATE POLICY "Public can read audio files" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'audio-files');

-- Allow authenticated users to upload audio files
CREATE POLICY "Authenticated users can upload audio files" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'audio-files');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Verify the setup
SELECT 'Tables created successfully!' as message;

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'transcriptions'
ORDER BY ordinal_position;
