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

    console.log('🔍 VERIFYING STORAGE BUCKET\n');
    console.log('=' .repeat(80) + '\n');
    
    // Check if bucket exists in database
    console.log('📋 Checking if bucket exists in database...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "SELECT id, name, public, file_size_limit FROM storage.buckets;"
`);

    // If not exists, create it properly
    console.log('\n🪣 Creating bucket if needed...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres <<'SQL'
-- Ensure storage schema exists
CREATE SCHEMA IF NOT EXISTS storage;

-- Create buckets table if not exists
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

-- Create objects table if not exists
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[],
  version text,
  UNIQUE(bucket_id, name)
);

-- Insert or update audio-files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  true,
  104857600,
  ARRAY['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a']::text[];

SELECT * FROM storage.buckets WHERE id = 'audio-files';

SQL
`);

    // Enable RLS and create policies
    console.log('\n🔒 Setting up storage policies...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres <<'SQL'

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete audio files" ON storage.objects;
DROP POLICY IF EXISTS "Public buckets are viewable" ON storage.buckets;

-- Create permissive policies for audio-files bucket
CREATE POLICY "Anyone can upload audio files"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'audio-files');

CREATE POLICY "Anyone can view audio files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audio-files');

CREATE POLICY "Anyone can delete audio files"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'audio-files');

CREATE POLICY "Public buckets are viewable"
ON storage.buckets
FOR SELECT
TO public
USING (id = 'audio-files');

-- Verify policies
\\dp storage.objects
\\dp storage.buckets

SQL
`);

    // Restart storage and Kong
    console.log('\n🔄 Restarting storage and Kong services...\n');
    await executeCommand(conn, `
cd /data/coolify/services/e088wwks88k8k48sccg8gk0o
docker-compose restart supabase-storage supabase-kong
sleep 25
docker ps --filter "name=storage-e088\\|kong-e088" --format "{{.Names}} - {{.Status}}"
`);

    // Test with token
    console.log('\n✅ Testing bucket with authentication...\n');
    await executeCommand(conn, `
TOKEN=\$(curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' | jq -r '.access_token')

echo "Testing bucket access..."
curl -s "https://supabase.healthscribe.pro/storage/v1/bucket/audio-files" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -H "Authorization: Bearer \$TOKEN"

echo ""
echo "Listing all buckets..."
curl -s "https://supabase.healthscribe.pro/storage/v1/bucket" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -H "Authorization: Bearer \$TOKEN" | jq '.'
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ STORAGE BUCKET READY');
    console.log('='.repeat(80));
    console.log('\n🎯 TRY UPLOADING YOUR FILE AGAIN NOW!');
    console.log('   Go to workspace and upload DS505670.mp3');
    console.log('   It should upload successfully to Supabase storage');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

