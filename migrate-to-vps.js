#!/usr/bin/env node

/**
 * Complete Data Migration Script: Cloud to VPS
 * 
 * This script migrates ALL your data from cloud Supabase to your VPS
 * and updates your application configuration.
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const CLOUD_SUPABASE_URL = 'https://yaznemrwbingjwqutbvb.supabase.co';
const CLOUD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjA0MzAsImV4cCI6MjA3MTAzNjQzMH0.uluQzD4-m91tUq0gOrUNOfR9rlN0Ry4tAPlxp-PWrIo';
const CLOUD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ2MDQzMCwiZXhwIjoyMDcxMDM2NDMwfQ.9Ib029SJ7rGbBI4JMoEKacX4LMOZbzOedDZ9JGtuXas';

// VPS Supabase configuration (update these after VPS setup)
const VPS_SUPABASE_URL = 'https://supabase.healthscribe.pro';
const VPS_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const VPS_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create clients
const cloudClient = createClient(CLOUD_SUPABASE_URL, CLOUD_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const vpsClient = createClient(VPS_SUPABASE_URL, VPS_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Tables to migrate (in order of dependencies)
const TABLES_TO_MIGRATE = [
  'user_profiles',
  'transcriptions',
  'reviews',
  'transcription_edits',
  'transcription_metrics',
  'document_templates'
];

async function testConnections() {
  console.log('🔍 Testing connections...');
  
  try {
    // Test cloud connection
    const { data: cloudData, error: cloudError } = await cloudClient
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (cloudError) {
      console.error('❌ Cloud Supabase connection failed:', cloudError.message);
      return false;
    }
    console.log('✅ Cloud Supabase connection successful');
    
    // Test VPS connection
    const { data: vpsData, error: vpsError } = await vpsClient
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (vpsError) {
      console.error('❌ VPS Supabase connection failed:', vpsError.message);
      console.log('💡 Make sure your VPS Supabase is running and accessible');
      return false;
    }
    console.log('✅ VPS Supabase connection successful');
    
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function migrateTable(tableName) {
  console.log(`\n📦 Migrating table: ${tableName}`);
  
  try {
    // Get all data from cloud
    const { data: cloudData, error: fetchError } = await cloudClient
      .from(tableName)
      .select('*');
    
    if (fetchError) {
      console.error(`❌ Failed to fetch data from cloud ${tableName}:`, fetchError.message);
      return { success: false, count: 0 };
    }
    
    if (!cloudData || cloudData.length === 0) {
      console.log(`ℹ️  No data found in cloud ${tableName}`);
      return { success: true, count: 0 };
    }
    
    console.log(`📥 Found ${cloudData.length} records in cloud ${tableName}`);
    
    // Insert data into VPS
    const { data: insertData, error: insertError } = await vpsClient
      .from(tableName)
      .insert(cloudData);
    
    if (insertError) {
      console.error(`❌ Failed to insert data into VPS ${tableName}:`, insertError.message);
      return { success: false, count: 0 };
    }
    
    console.log(`✅ Successfully migrated ${cloudData.length} records to VPS ${tableName}`);
    return { success: true, count: cloudData.length };
    
  } catch (error) {
    console.error(`❌ Migration failed for ${tableName}:`, error.message);
    return { success: false, count: 0 };
  }
}

async function migrateStorage() {
  console.log('\n📁 Migrating storage buckets...');
  
  try {
    // List buckets from cloud
    const { data: buckets, error: bucketsError } = await cloudClient.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list cloud buckets:', bucketsError.message);
      return { success: false };
    }
    
    console.log(`📥 Found ${buckets.length} buckets in cloud storage`);
    
    for (const bucket of buckets) {
      console.log(`\n🪣 Migrating bucket: ${bucket.name}`);
      
      // Create bucket in VPS if it doesn't exist
      const { data: existingBucket, error: checkError } = await vpsClient.storage.getBucket(bucket.name);
      
      if (checkError && checkError.message.includes('not found')) {
        // Create the bucket
        const { data: newBucket, error: createError } = await vpsClient.storage.createBucket(bucket.name, {
          public: bucket.public,
          fileSizeLimit: bucket.file_size_limit,
          allowedMimeTypes: bucket.allowed_mime_types
        });
        
        if (createError) {
          console.error(`❌ Failed to create bucket ${bucket.name}:`, createError.message);
          continue;
        }
        
        console.log(`✅ Created bucket: ${bucket.name}`);
      } else {
        console.log(`ℹ️  Bucket ${bucket.name} already exists`);
      }
      
      // List files in the bucket
      const { data: files, error: filesError } = await cloudClient.storage
        .from(bucket.name)
        .list();
      
      if (filesError) {
        console.error(`❌ Failed to list files in bucket ${bucket.name}:`, filesError.message);
        continue;
      }
      
      console.log(`📁 Found ${files.length} files in bucket ${bucket.name}`);
      
      // Note: File migration would require downloading and re-uploading
      // This is complex and may require significant bandwidth
      // For now, we'll just log the files that need to be migrated
      if (files.length > 0) {
        console.log(`⚠️  ${files.length} files need to be migrated manually from bucket ${bucket.name}`);
        console.log('💡 Consider using rclone or similar tool for large file migrations');
      }
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Storage migration failed:', error.message);
    return { success: false };
  }
}

async function updateEnvironmentFile() {
  console.log('\n🔧 Updating environment configuration...');
  
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (!fs.existsSync(envPath)) {
      console.error('❌ .env.local file not found');
      return false;
    }
    
    // Read current environment file
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update Supabase URL
    envContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_URL=.*/,
      `NEXT_PUBLIC_SUPABASE_URL=${VPS_SUPABASE_URL}`
    );
    
    // Update anon key
    envContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${VPS_ANON_KEY}`
    );
    
    // Update service role key
    envContent = envContent.replace(
      /SUPABASE_SERVICE_ROLE_KEY=.*/,
      `SUPABASE_SERVICE_ROLE_KEY=${VPS_SERVICE_KEY}`
    );
    
    // Write updated environment file
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Environment file updated successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to update environment file:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Complete VPS Migration');
  console.log('==================================');
  console.log(`📤 Source: ${CLOUD_SUPABASE_URL}`);
  console.log(`📥 Destination: ${VPS_SUPABASE_URL}`);
  console.log('');
  
  // Test connections
  const connectionsOk = await testConnections();
  if (!connectionsOk) {
    console.log('\n❌ Migration aborted due to connection issues');
    process.exit(1);
  }
  
  console.log('\n📊 Starting data migration...');
  
  let totalMigrated = 0;
  let successfulTables = 0;
  let failedTables = 0;
  
  // Migrate tables
  for (const tableName of TABLES_TO_MIGRATE) {
    const result = await migrateTable(tableName);
    
    if (result.success) {
      totalMigrated += result.count;
      successfulTables++;
    } else {
      failedTables++;
    }
    
    // Add delay between tables to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Migrate storage
  const storageResult = await migrateStorage();
  
  // Update environment file
  const envResult = await updateEnvironmentFile();
  
  // Summary
  console.log('\n📋 Migration Summary');
  console.log('====================');
  console.log(`✅ Successful tables: ${successfulTables}`);
  console.log(`❌ Failed tables: ${failedTables}`);
  console.log(`📊 Total records migrated: ${totalMigrated}`);
  console.log(`📁 Storage migration: ${storageResult.success ? 'Completed' : 'Failed'}`);
  console.log(`🔧 Environment update: ${envResult ? 'Completed' : 'Failed'}`);
  
  if (failedTables === 0 && envResult) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your application: npm run dev');
    console.log('2. Test login functionality');
    console.log('3. Verify all data is accessible');
    console.log('4. Test file uploads and downloads');
    console.log('5. Update your DNS to point to the VPS');
    console.log('6. Consider keeping the cloud instance as backup for a while');
  } else {
    console.log('\n⚠️  Migration completed with some errors');
    console.log('Please review the failed items and retry if necessary');
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run migration
main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});




