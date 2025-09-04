const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...\n');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "public.transcriptions" does not exist')) {
        console.log('❌ Table "transcriptions" does not exist!');
        console.log('\n📝 Please create the table with this SQL in Supabase SQL Editor:\n');
        console.log(`
CREATE TABLE transcriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  file_name TEXT,
  doctor_name TEXT,
  patient_name TEXT,
  document_type TEXT,
  transcription_text TEXT,
  audio_url TEXT,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  file_size BIGINT,
  metadata JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_transcriptions_status ON transcriptions(status);
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at DESC);
CREATE INDEX idx_transcriptions_user_id ON transcriptions(user_id);
        `);
        return;
      } else {
        console.log('⚠️ Error querying table:', error.message);
        console.log('\n📝 The table might be missing columns. Add these if needed:\n');
        console.log(`
ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS error TEXT;
ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add indexes if not exist
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON transcriptions(user_id);
        `);
      }
    } else {
      console.log('✅ Table "transcriptions" exists and is accessible!');
      
      // Check if we have any records
      const { count } = await supabase
        .from('transcriptions')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 Current record count: ${count || 0}`);
    }
    
    // Check Row Level Security
    console.log('\n🔒 Checking Row Level Security (RLS)...');
    console.log('Note: RLS status cannot be checked via client. Please verify in Supabase dashboard.');
    console.log('\nRecommended RLS policies:');
    console.log(`
-- Enable RLS
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own transcriptions
CREATE POLICY "Users can view own transcriptions" ON transcriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own transcriptions
CREATE POLICY "Users can insert own transcriptions" ON transcriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own transcriptions
CREATE POLICY "Users can update own transcriptions" ON transcriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own transcriptions
CREATE POLICY "Users can delete own transcriptions" ON transcriptions
  FOR DELETE USING (auth.uid() = user_id);
    `);
    
    // Check storage buckets
    console.log('\n📦 Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('⚠️ Could not list storage buckets (may require service role key)');
    } else {
      const audioBucket = buckets?.find(b => b.name === 'audio-files');
      if (audioBucket) {
        console.log('✅ Storage bucket "audio-files" exists!');
      } else {
        console.log('❌ Storage bucket "audio-files" not found!');
        console.log('\n📝 Create it in Supabase dashboard or with this SQL:');
        console.log(`
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', false);
        `);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDatabaseSchema();
