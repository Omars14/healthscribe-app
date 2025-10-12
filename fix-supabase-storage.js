#!/usr/bin/env node

/**
 * Fix Supabase Storage Permissions and Audio File Upload Issues
 * This script will configure storage buckets and permissions for audio file uploads
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Fixing Supabase Storage Permissions and Audio Upload Issues...\n');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkStorageService() {
  console.log('🔍 Checking storage service status...');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Storage service error:', error.message);
      return false;
    }
    
    console.log('✅ Storage service is accessible');
    console.log(`📦 Found ${buckets.length} buckets:`);
    
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    return buckets;
  } catch (error) {
    console.error('❌ Storage service not accessible:', error.message);
    return false;
  }
}

async function createAudioBucket() {
  console.log('\n🪣 Creating/configuring audio-files bucket...');
  
  try {
    // Try to create the bucket
    const { data: bucket, error: createError } = await supabase.storage.createBucket('audio-files', {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
      allowedMimeTypes: [
        'audio/mp4',      // .m4a
        'audio/mpeg',     // .mp3
        'audio/wav',      // .wav
        'audio/x-wav',    // .wav alternative
        'audio/wave',     // .wav alternative
        'audio/aac',      // .aac
        'audio/flac',     // .flac
        'audio/ogg',      // .ogg
        'audio/webm',     // .webm
        'audio/x-m4a',    // .m4a alternative
        'audio/mp4a-latm', // .m4a alternative
        'audio/3gpp',     // .3gp
        'audio/amr',      // .amr
        'application/octet-stream' // Fallback for unrecognized audio types
      ]
    });
    
    if (createError) {
      if (createError.message.includes('already exists')) {
        console.log('ℹ️  Bucket already exists, updating configuration...');
        
        // Update bucket configuration
        const { error: updateError } = await supabase.storage.updateBucket('audio-files', {
          public: false,
          fileSizeLimit: 50 * 1024 * 1024,
          allowedMimeTypes: [
            'audio/mp4',
            'audio/mpeg',
            'audio/wav',
            'audio/x-wav',
            'audio/wave',
            'audio/aac',
            'audio/flac',
            'audio/ogg',
            'audio/webm',
            'audio/x-m4a',
            'audio/mp4a-latm',
            'audio/3gpp',
            'audio/amr',
            'application/octet-stream'
          ]
        });
        
        if (updateError) {
          console.error('❌ Failed to update bucket:', updateError.message);
          return false;
        }
        
        console.log('✅ Bucket configuration updated');
      } else {
        console.error('❌ Failed to create bucket:', createError.message);
        return false;
      }
    } else {
      console.log('✅ Bucket created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error with bucket:', error.message);
    return false;
  }
}

async function setupStoragePolicies() {
  console.log('\n🔐 Setting up storage policies...');
  
  const policies = [
    {
      name: 'Allow authenticated users to upload audio files',
      sql: `
        CREATE POLICY "Allow authenticated users to upload audio files" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'audio-files' AND
          auth.role() = 'authenticated' AND
          auth.uid() = owner
        );
      `
    },
    {
      name: 'Allow authenticated users to view their own audio files',
      sql: `
        CREATE POLICY "Allow authenticated users to view their own audio files" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'audio-files' AND
          auth.role() = 'authenticated' AND
          auth.uid() = owner
        );
      `
    },
    {
      name: 'Allow authenticated users to update their own audio files',
      sql: `
        CREATE POLICY "Allow authenticated users to update their own audio files" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'audio-files' AND
          auth.role() = 'authenticated' AND
          auth.uid() = owner
        );
      `
    },
    {
      name: 'Allow authenticated users to delete their own audio files',
      sql: `
        CREATE POLICY "Allow authenticated users to delete their own audio files" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'audio-files' AND
          auth.role() = 'authenticated' AND
          auth.uid() = owner
        );
      `
    }
  ];
  
  let successCount = 0;
  
  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Policy already exists: ${policy.name}`);
          successCount++;
        } else {
          console.error(`❌ Failed to create policy "${policy.name}":`, error.message);
        }
      } else {
        console.log(`✅ Created policy: ${policy.name}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error creating policy "${policy.name}":`, err.message);
    }
  }
  
  console.log(`📊 Storage policies: ${successCount}/${policies.length} configured`);
  return successCount === policies.length;
}

async function testFileUpload() {
  console.log('\n🧪 Testing file upload functionality...');
  
  try {
    // Create a small test file (simulating an audio file)
    const testContent = Buffer.from('This is a test audio file content');
    const testFileName = `test-audio-${Date.now()}.m4a`;
    
    console.log(`📤 Uploading test file: ${testFileName}...`);
    
    const { data, error } = await supabase.storage
      .from('audio-files')
      .upload(testFileName, testContent, {
        contentType: 'audio/mp4',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Test upload failed:', error.message);
      return false;
    }
    
    console.log('✅ Test upload successful!');
    console.log(`   File path: ${data.path}`);
    
    // Try to get the file info
    const { data: fileInfo, error: infoError } = await supabase.storage
      .from('audio-files')
      .list('', {
        search: testFileName
      });
    
    if (infoError) {
      console.error('❌ Failed to list file:', infoError.message);
    } else {
      console.log('✅ File listing works');
    }
    
    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('audio-files')
      .remove([testFileName]);
    
    if (deleteError) {
      console.log(`⚠️  Could not delete test file: ${deleteError.message}`);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test upload error:', error.message);
    return false;
  }
}

async function checkDatabasePermissions() {
  console.log('\n🗄️  Checking database permissions...');
  
  try {
    // Check if user can access transcriptions table
    const { data, error } = await supabase
      .from('transcriptions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database access error:', error.message);
      return false;
    }
    
    console.log('✅ Database access working');
    
    // Check if storage.objects table is accessible
    const { data: storageData, error: storageError } = await supabase
      .from('storage.objects')
      .select('count')
      .limit(1);
    
    if (storageError) {
      console.error('❌ Storage objects access error:', storageError.message);
    } else {
      console.log('✅ Storage objects table accessible');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database permission error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Environment Check:');
  console.log('   - Supabase URL:', SUPABASE_URL ? '✅' : '❌');
  console.log('   - Service Key:', SERVICE_KEY ? '✅' : '❌');
  
  // Run diagnostics and fixes
  const steps = [
    { name: 'Check storage service', fn: checkStorageService },
    { name: 'Create/configure audio bucket', fn: createAudioBucket },
    { name: 'Setup storage policies', fn: setupStoragePolicies },
    { name: 'Check database permissions', fn: checkDatabasePermissions },
    { name: 'Test file upload', fn: testFileUpload }
  ];
  
  let allSuccess = true;
  
  for (const step of steps) {
    console.log(`\n🔄 ${step.name}...`);
    const result = await step.fn();
    
    if (!result) {
      allSuccess = false;
      console.log(`❌ ${step.name} failed`);
    } else {
      console.log(`✅ ${step.name} completed`);
    }
  }
  
  console.log('\n📋 Summary:');
  if (allSuccess) {
    console.log('🎉 All storage issues have been fixed!');
    console.log('\n✅ Supported audio formats:');
    console.log('   - .m4a (audio/mp4, audio/x-m4a)');
    console.log('   - .mp3 (audio/mpeg)');
    console.log('   - .wav (audio/wav, audio/x-wav)');
    console.log('   - .aac (audio/aac)');
    console.log('   - .flac (audio/flac)');
    console.log('   - .ogg (audio/ogg)');
    console.log('   - .webm (audio/webm)');
    console.log('   - .3gp (audio/3gpp)');
    console.log('   - .amr (audio/amr)');
    console.log('\n🎯 Users should now be able to upload .m4a files successfully!');
  } else {
    console.log('❌ Some issues remain. Check the errors above.');
    console.log('\n🚨 Manual steps may be required:');
    console.log('   1. SSH into VPS and check Supabase storage service');
    console.log('   2. Verify storage bucket configuration');
    console.log('   3. Check RLS policies on storage.objects table');
  }
}

main().catch(console.error);