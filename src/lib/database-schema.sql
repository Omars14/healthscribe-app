-- Add missing columns to transcriptions table if they don't exist

-- Add status column if it doesn't exist
ALTER TABLE transcriptions 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending' 
CHECK (status IN ('pending', 'in_progress', 'processing', 'completed', 'failed'));

-- Add file_size column if it doesn't exist
ALTER TABLE transcriptions 
ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Add error column if it doesn't exist
ALTER TABLE transcriptions 
ADD COLUMN IF NOT EXISTS error TEXT;

-- Add metadata column if it doesn't exist
ALTER TABLE transcriptions 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add updated_at column if it doesn't exist
ALTER TABLE transcriptions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create an index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON transcriptions(status);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at);

-- Create an index on doctor_name for filtering
CREATE INDEX IF NOT EXISTS idx_transcriptions_doctor_name ON transcriptions(doctor_name);

-- Update existing rows to have a status if they don't have one
UPDATE transcriptions 
SET status = 'completed' 
WHERE status IS NULL AND transcription_text IS NOT NULL AND transcription_text != '';

UPDATE transcriptions 
SET status = 'pending' 
WHERE status IS NULL;
