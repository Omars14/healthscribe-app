#!/usr/bin/env node

/**
 * Data Migration Script: Cloud Supabase to Self-Hosted Supabase
 * 
 * This script migrates your data from the cloud Supabase instance
 * to your self-hosted Supabase instance.
 * 
 * Usage:
 * 1. Update the configuration below with your credentials
 * 2. Run: node migrate-data-to-self-hosted.js
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configuration
const CLOUD_SUPABASE_URL = 'https://yaznemrwbingjwqutbvb.supabase.co';
const CLOUD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjA0MzAsImV4cCI6MjA3MTAzNjQzMH0.uluQzD4-m91tUq0gOrUNOfR9rlN0Ry4tAPlxp-PWrIo';
const CLOUD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ2MDQzMCwiZXhwIjoyMDcxMDM2NDMwfQ.9Ib029SJ7rGbBI4JMoEKacX4LMOZbzOedDZ9JGtuXas';

// Self-hosted Supabase configuration (update these after setup)
const SELF_HOSTED_URL = 'https://supabase.healthscribe.pro';
const SELF_HOSTED_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const SELF_HOSTED_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create clients
const cloudClient = createClient(CLOUD_SUPABASE_URL, CLOUD_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const selfHostedClient = createClient(SELF_HOSTED_URL, SELF_HOSTED_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Tables to migrate (in order of dependencies)
const TABLES_TO_MIGRATE = [
  'user_profiles',
  'document_templates',
  'transcriptions',
  'reviews',
  'transcription_edits',
  'transcription_metrics'
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
    
    // Test self-hosted connection
    const { data: selfHostedData, error: selfHostedError } = await selfHostedClient
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (selfHostedError) {
      console.error('❌ Self-hosted Supabase connection failed:', selfHostedError.message);
      console.log('💡 Make sure your self-hosted Supabase is running and accessible');
      return false;
    }
    console.log('✅ Self-hosted Supabase connection successful');
    
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
    
    // Insert data into self-hosted
    const { data: insertData, error: insertError } = await selfHostedClient
      .from(tableName)
      .insert(cloudData);
    
    if (insertError) {
      console.error(`❌ Failed to insert data into self-hosted ${tableName}:`, insertError.message);
      return { success: false, count: 0 };
    }
    
    console.log(`✅ Successfully migrated ${cloudData.length} records to self-hosted ${tableName}`);
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
      
      // Create bucket in self-hosted if it doesn't exist
      const { data: existingBucket, error: checkError } = await selfHostedClient.storage.getBucket(bucket.name);
      
      if (checkError && checkError.message.includes('not found')) {
        // Create the bucket
        const { data: newBucket, error: createError } = await selfHostedClient.storage.createBucket(bucket.name, {
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

async function main() {
  console.log('🚀 Starting Supabase Data Migration');
  console.log('====================================');
  console.log(`📤 Source: ${CLOUD_SUPABASE_URL}`);
  console.log(`📥 Destination: ${SELF_HOSTED_URL}`);
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
  
  // Summary
  console.log('\n📋 Migration Summary');
  console.log('====================');
  console.log(`✅ Successful tables: ${successfulTables}`);
  console.log(`❌ Failed tables: ${failedTables}`);
  console.log(`📊 Total records migrated: ${totalMigrated}`);
  console.log(`📁 Storage migration: ${storageResult.success ? 'Completed' : 'Failed'}`);
  
  if (failedTables === 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env.local with the new self-hosted API keys');
    console.log('2. Test your application with the new database');
    console.log('3. Verify all functionality works correctly');
    console.log('4. Consider keeping the cloud instance as backup for a while');
  } else {
    console.log('\n⚠️  Migration completed with some errors');
    console.log('Please review the failed tables and retry if necessary');
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




