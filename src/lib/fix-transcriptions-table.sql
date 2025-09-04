-- Add missing columns to transcriptions table if they don't exist
-- Run this in your Supabase SQL editor

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transcriptions' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE transcriptions 
    ADD COLUMN status VARCHAR(50) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_progress', 'processing', 'completed', 'failed'));
  END IF;
END $$;

-- Add file_size column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transcriptions' 
    AND column_name = 'file_size'
  ) THEN
    ALTER TABLE transcriptions 
    ADD COLUMN file_size BIGINT;
  END IF;
END $$;

-- Add error column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transcriptions' 
    AND column_name = 'error'
  ) THEN
    ALTER TABLE transcriptions 
    ADD COLUMN error TEXT;
  END IF;
END $$;

-- Add metadata column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transcriptions' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE transcriptions 
    ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transcriptions' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE transcriptions 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_doctor_name ON transcriptions(doctor_name);

-- Update existing rows to have a status if they don't have one
UPDATE transcriptions 
SET status = 'completed' 
WHERE status IS NULL AND transcription_text IS NOT NULL AND transcription_text != '';

UPDATE transcriptions 
SET status = 'pending' 
WHERE status IS NULL;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'transcriptions'
ORDER BY ordinal_position;
