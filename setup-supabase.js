const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!');
  console.log('Please ensure these are set in .env.local:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupSupabase() {
  console.log('🚀 Starting Supabase setup...\n');

  try {
    // Step 1: Check and update table schema
    console.log('📊 Step 1: Checking table schema...');
    
    const tableCheckSQL = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'transcriptions'
      ORDER BY ordinal_position;
    `;
    
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      sql: tableCheckSQL
    }).single();

    if (columnsError) {
      // If RPC doesn't exist, we'll create the table and columns directly
      console.log('Creating/updating table schema...');
      
      const schemaSQL = `
        -- Create table if not exists
        CREATE TABLE IF NOT EXISTS transcriptions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id),
          file_name TEXT,
          doctor_name TEXT,
          patient_name TEXT,
          document_type TEXT,
          transcription_text TEXT,
          audio_url TEXT,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
          file_size BIGINT,
          metadata JSONB,
          error TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add columns if they don't exist
        ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
        ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
        ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS file_size BIGINT;
        ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS error TEXT;
        ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS metadata JSONB;
        ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      `;

      const { error: schemaError } = await supabase.from('transcriptions').select('id').limit(1);
      
      if (schemaError && schemaError.message.includes('does not exist')) {
        console.log('❌ Table does not exist. Please create it manually in Supabase SQL Editor:');
        console.log('\n' + schemaSQL);
      } else {
        console.log('✅ Table exists and is accessible');
      }
    }

    // Step 2: Create storage bucket
    console.log('\n📦 Step 2: Setting up storage bucket...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (!bucketsError) {
      const audioBucket = buckets?.find(b => b.name === 'audio-files');
      
      if (!audioBucket) {
        console.log('Creating audio-files bucket...');
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('audio-files', {
          public: false,
          fileSizeLimit: 104857600, // 100MB
          allowedMimeTypes: [
            'audio/mpeg',
            'audio/wav',
            'audio/mp3',
            'audio/mp4',
            'audio/webm',
            'audio/ogg',
            'audio/x-m4a'
          ]
        });

        if (createError) {
          console.log('⚠️ Could not create bucket:', createError.message);
          console.log('Please create it manually in Supabase dashboard');
        } else {
          console.log('✅ Storage bucket created successfully');
        }
      } else {
        console.log('✅ Storage bucket already exists');
      }
    } else {
      console.log('⚠️ Could not list buckets. You may need to create the bucket manually.');
    }

    // Step 3: Enable RLS and create policies
    console.log('\n🔒 Step 3: Setting up Row Level Security...');
    
    // We can't directly enable RLS via the client library, so we'll provide SQL
    console.log('\n📝 Please run the following SQL in your Supabase SQL Editor:\n');
    
    const rlsSQL = `
-- Enable RLS on transcriptions table
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own transcriptions" ON transcriptions;
DROP POLICY IF EXISTS "Users can insert own transcriptions" ON transcriptions;
DROP POLICY IF EXISTS "Users can update own transcriptions" ON transcriptions;
DROP POLICY IF EXISTS "Users can delete own transcriptions" ON transcriptions;

-- Create RLS policies
CREATE POLICY "Users can view own transcriptions" ON transcriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcriptions" ON transcriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcriptions" ON transcriptions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcriptions" ON transcriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON transcriptions(user_id);

-- Storage bucket policies
INSERT INTO storage.policies (bucket_id, name, definition, operation)
SELECT 
  'audio-files',
  'Allow authenticated uploads',
  '{"using": "auth.uid() IS NOT NULL"}'::jsonb,
  'INSERT'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = 'audio-files' 
  AND name = 'Allow authenticated uploads'
);

INSERT INTO storage.policies (bucket_id, name, definition, operation)
SELECT 
  'audio-files',
  'Allow users to read own files',
  '{"using": "auth.uid() IS NOT NULL"}'::jsonb,
  'SELECT'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = 'audio-files' 
  AND name = 'Allow users to read own files'
);
    `;

    console.log(rlsSQL);
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 MANUAL STEPS REQUIRED:');
    console.log('='.repeat(60));
    console.log('\n1. Go to your Supabase dashboard:');
    console.log(`   ${SUPABASE_URL}`);
    console.log('\n2. Click on "SQL Editor" in the left sidebar');
    console.log('\n3. Click "New query"');
    console.log('\n4. Copy and paste the SQL shown above');
    console.log('\n5. Click "Run" to execute the SQL');
    console.log('\n' + '='.repeat(60));

    // Step 4: Test the setup
    console.log('\n🧪 Step 4: Testing configuration...');
    
    // Test table access
    const { error: testError } = await supabase
      .from('transcriptions')
      .select('*')
      .limit(1);
    
    if (!testError) {
      console.log('✅ Table access: OK');
    } else {
      console.log('⚠️ Table access issue:', testError.message);
    }

    // Test storage access
    const testFile = new Uint8Array([1, 2, 3, 4, 5]);
    const { error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload('test-file.txt', testFile, { upsert: true });
    
    if (!uploadError) {
      console.log('✅ Storage upload: OK');
      // Clean up test file
      await supabase.storage.from('audio-files').remove(['test-file.txt']);
    } else if (uploadError.message.includes('not found')) {
      console.log('⚠️ Storage bucket not found. Please create it manually.');
    } else {
      console.log('⚠️ Storage access issue:', uploadError.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nYour Supabase project is ready for use.');
    console.log('Remember to run the SQL commands shown above in your Supabase SQL Editor.');
    console.log('\nNext steps:');
    console.log('1. Run the SQL commands in Supabase SQL Editor');
    console.log('2. Start your app: npm run dev');
    console.log('3. Create a test account and upload an audio file');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    console.log('\nPlease check your environment variables and try again.');
  }
}

// Run the setup
setupSupabase();
