#!/usr/bin/env node

/**
 * Fix Supabase Storage Issues on VPS via SSH
 * This script will SSH into the VPS and fix all storage bucket and permission issues
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

console.log('🚀 Fixing Supabase Storage Issues on VPS...\n');

// VPS connection details (update these if needed)
const VPS_HOST = 'healthscribe.pro'; // or your VPS IP
const VPS_USER = 'root';

async function runSSHCommand(command) {
  try {
    console.log(`🔄 Running: ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);
    const { stdout, stderr } = await execPromise(`ssh ${VPS_USER}@${VPS_HOST} "${command}"`);
    
    if (stderr && !stderr.includes('Warning')) {
      console.log(`⚠️  stderr: ${stderr}`);
    }
    
    if (stdout) {
      console.log(`✅ Output:\n${stdout}`);
    }
    
    return { success: true, stdout, stderr };
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function fixSupabaseStorage() {
  console.log('🔧 Step 1: Checking Docker containers...\n');
  
  // Check running containers
  await runSSHCommand('docker ps --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}" | grep supabase');
  
  console.log('\n🔧 Step 2: Finding Supabase DB container...\n');
  
  // Find the correct DB container name
  const dbCheck = await runSSHCommand('docker ps --format "{{.Names}}" | grep -E "(supabase.*db|db.*supabase)" | head -1');
  
  let dbContainer = 'supabase_db_supabase'; // default
  if (dbCheck.success && dbCheck.stdout.trim()) {
    dbContainer = dbCheck.stdout.trim();
  }
  
  console.log(`📦 Using DB container: ${dbContainer}\n`);
  
  console.log('🔧 Step 3: Running SQL fixes...\n');
  
  // Create the comprehensive SQL fix
  const sqlFix = `
-- Fix Supabase Storage for Audio File Uploads
-- This addresses m4a upload issues and other audio formats

-- 1) Ensure the audio-files bucket exists with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  false,
  52428800, -- 50MB limit
  ARRAY[
    'audio/mp4',       -- .m4a primary MIME type
    'audio/x-m4a',     -- .m4a alternative
    'audio/mp4a-latm', -- .m4a encoder variant
    'audio/mpeg',      -- .mp3
    'audio/wav',       -- .wav
    'audio/x-wav',     -- .wav alternative
    'audio/wave',      -- .wav alternative
    'audio/aac',       -- .aac
    'audio/flac',      -- .flac
    'audio/ogg',       -- .ogg
    'audio/webm',      -- .webm audio
    'audio/3gpp',      -- .3gp audio
    'audio/amr',       -- .amr
    'application/octet-stream' -- fallback for unrecognized
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'audio/mp4','audio/x-m4a','audio/mp4a-latm',
    'audio/mpeg','audio/wav','audio/x-wav','audio/wave',
    'audio/aac','audio/flac','audio/ogg','audio/webm',
    'audio/3gpp','audio/amr','application/octet-stream'
  ]::text[];

-- 2) Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3) Drop existing policies if they exist (clean slate)
DROP POLICY IF EXISTS "allow_audio_insert" ON storage.objects;
DROP POLICY IF EXISTS "allow_audio_select" ON storage.objects;
DROP POLICY IF EXISTS "allow_audio_update" ON storage.objects;
DROP POLICY IF EXISTS "allow_audio_delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own audio files" ON storage.objects;

-- 4) Create comprehensive RLS policies
CREATE POLICY "allow_audio_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-files'
    AND auth.role() = 'authenticated'
    AND owner = auth.uid()
  );

CREATE POLICY "allow_audio_select"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'audio-files'
    AND (
      owner = auth.uid() OR
      auth.role() = 'service_role'
    )
  );

CREATE POLICY "allow_audio_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'audio-files'
    AND auth.role() = 'authenticated'
    AND owner = auth.uid()
  );

CREATE POLICY "allow_audio_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'audio-files'
    AND auth.role() = 'authenticated'
    AND owner = auth.uid()
  );

-- 5) Verify the bucket was created/updated
SELECT id, name, public, file_size_limit, array_length(allowed_mime_types, 1) as mime_count
FROM storage.buckets 
WHERE id = 'audio-files';

-- 6) Verify policies were created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%audio%';
  
SELECT 'Storage fix complete!' as status;
`;

  // Write SQL to a temporary file and execute
  await runSSHCommand(`cat > /tmp/fix_storage.sql << 'EOF'
${sqlFix}
EOF`);

  // Execute the SQL
  const sqlResult = await runSSHCommand(`docker exec -i ${dbContainer} psql -U supabase_admin -d postgres < /tmp/fix_storage.sql`);
  
  if (!sqlResult.success) {
    console.error('❌ SQL execution failed!');
    return false;
  }
  
  console.log('\n🔧 Step 4: Restarting storage services...\n');
  
  // Find and restart storage containers
  await runSSHCommand('docker ps --format "{{.Names}}" | grep -i storage | xargs -r docker restart');
  
  console.log('\n🔧 Step 5: Testing storage API...\n');
  
  // Test storage API
  await runSSHCommand(`curl -s -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTg1MTQwMTAsImV4cCI6MjM4OTIzNDAxMH0.qjBCdR_u9CWR9Fhx1VwoZdBdtetp_h9bE9qEieyQM_4" "https://supabase.healthscribe.pro/storage/v1/bucket/audio-files"`);
  
  // Clean up
  await runSSHCommand('rm -f /tmp/fix_storage.sql');
  
  return true;
}

async function main() {
  try {
    console.log(`🔌 Connecting to VPS: ${VPS_USER}@${VPS_HOST}\n`);
    
    // Test SSH connection
    const testResult = await runSSHCommand('echo "SSH connection successful"');
    if (!testResult.success) {
      console.error('❌ Cannot connect to VPS via SSH');
      console.log('💡 Make sure you can run: ssh root@healthscribe.pro');
      return;
    }
    
    const success = await fixSupabaseStorage();
    
    if (success) {
      console.log('\n🎉 SUCCESS! Storage issues have been fixed!');
      console.log('\n✅ What was fixed:');
      console.log('   📦 Audio bucket configured with proper MIME types');
      console.log('   🔐 RLS policies set up for authenticated users');
      console.log('   📝 Support added for all audio formats including .m4a');
      console.log('   🔄 Storage services restarted');
      console.log('\n🎯 Supported formats:');
      console.log('   - .m4a (audio/mp4, audio/x-m4a, audio/mp4a-latm)');
      console.log('   - .mp3 (audio/mpeg)');
      console.log('   - .wav (audio/wav, audio/x-wav, audio/wave)');
      console.log('   - .aac, .flac, .ogg, .webm, .3gp, .amr');
      console.log('   - Fallback support (application/octet-stream)');
      console.log('\n🚀 Users should now be able to upload .m4a files successfully!');
    } else {
      console.error('\n❌ Some issues occurred. Check the output above.');
    }
    
  } catch (error) {
    console.error('💥 Script failed:', error.message);
  }
}

main().catch(console.error);