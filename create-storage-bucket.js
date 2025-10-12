#!/usr/bin/env node

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

function executeCommand(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let output = '';

      stream.on('close', () => {
        resolve(output);
      }).on('data', (data) => {
        output += data.toString();
        process.stdout.write(data.toString());
      });
    });
  });
}

async function main() {
  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', resolve).on('error', reject).connect(SSH_CONFIG);
    });

    console.log('🪣 CREATING STORAGE BUCKET IN SELF-HOSTED SUPABASE\n');
    console.log('=' .repeat(80) + '\n');
    
    // Create the audio-files bucket and configure policies
    console.log('📦 Step 1: Creating audio-files bucket...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres <<'SQL'

-- Create the audio-files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  true,
  104857600,  -- 100MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/mp3', 'audio/x-wav', 'audio/wave']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

SELECT id, name, public FROM storage.buckets WHERE id = 'audio-files';

SQL
`);

    // Create storage policies
    console.log('\n🔒 Step 2: Creating storage policies...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres <<'SQL'

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their audio files" ON storage.objects;
DROP POLICY IF EXISTS "Public audio files are publicly accessible" ON storage.objects;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload their own audio files
CREATE POLICY "Users can upload audio files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-files' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own audio files
CREATE POLICY "Users can view their audio files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy: Public access to audio files
CREATE POLICY "Public audio files are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audio-files' AND public = true);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their audio files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Verify policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%audio%';

SQL
`);

    // Restart storage service
    console.log('\n🔄 Step 3: Restarting storage service...\n');
    await executeCommand(conn, `
cd /data/coolify/services/e088wwks88k8k48sccg8gk0o
docker-compose restart supabase-storage
sleep 20
docker ps --filter "name=storage-e088" --format "{{.Status}}"
`);

    // Test storage
    console.log('\n✅ Step 4: Testing storage bucket...\n');
    await executeCommand(conn, `
curl -s "https://supabase.healthscribe.pro/storage/v1/bucket/audio-files" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA"
`);

    // List all buckets
    console.log('\n\n📋 Step 5: Listing all buckets...\n');
    await executeCommand(conn, `
curl -s "https://supabase.healthscribe.pro/storage/v1/bucket" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" | jq '.'
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ STORAGE BUCKET CREATED AND CONFIGURED');
    console.log('='.repeat(80));
    console.log('\n📊 BUCKET DETAILS:');
    console.log('   Name: audio-files');
    console.log('   Public: Yes');
    console.log('   Max file size: 100MB');
    console.log('   Allowed types: MP3, WAV, M4A, OGG, WEBM');
    console.log('\n🔒 POLICIES CREATED:');
    console.log('   ✅ Users can upload their own files');
    console.log('   ✅ Users can view their own files');
    console.log('   ✅ Users can delete their own files');
    console.log('   ✅ Public files are accessible');
    console.log('\n🎯 TRY UPLOADING NOW!');
    console.log('   The storage bucket error should be gone');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

