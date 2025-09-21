#!/usr/bin/env node

/**
 * Clean Data Migration Script: Cloud Supabase to Fresh Self-Hosted Supabase
 * 
 * This script migrates your data from the cloud Supabase instance
 * to your fresh self-hosted Supabase instance with proper error handling.
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configuration
const CLOUD_SUPABASE_URL = 'https://yaznemrwbingjwqutbvb.supabase.co';
const CLOUD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjA0MzAsImV4cCI6MjA3MTAzNjQzMH0.uluQzD4-m91tUq0gOrUNOfR9rlN0Ry4tAPlxp-PWrIo';
const CLOUD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ2MDQzMCwiZXhwIjoyMDcxMDM2NDMwfQ.9Ib029SJ7rGbBI4JMoEKacX4LMOZbzOedDZ9JGtuXas';

// Self-hosted Supabase configuration
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
  'transcriptions',
  'reviews',
  'transcription_edits',
  'transcription_metrics'
];

// Function to test connections
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

// Function to migrate a single table
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
    
    // Clean the data (remove any problematic fields)
    const cleanedData = cloudData.map(record => {
      // Remove any fields that might cause issues
      const cleaned = { ...record };
      
      // Ensure required fields are present
      if (tableName === 'transcriptions' && !cleaned.id) {
        cleaned.id = require('crypto').randomUUID();
      }
      
      // Clean up any null or undefined values that might cause issues
      Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === null || cleaned[key] === undefined) {
          delete cleaned[key];
        }
      });
      
      return cleaned;
    });
    
    // Insert data into self-hosted in batches to avoid overwhelming the database
    const batchSize = 50;
    let totalInserted = 0;
    
    for (let i = 0; i < cleanedData.length; i += batchSize) {
      const batch = cleanedData.slice(i, i + batchSize);
      
      const { data: insertData, error: insertError } = await selfHostedClient
        .from(tableName)
        .insert(batch);
      
      if (insertError) {
        console.error(`❌ Failed to insert batch ${Math.floor(i/batchSize) + 1} into self-hosted ${tableName}:`, insertError.message);
        
        // Try inserting records one by one to identify problematic records
        console.log(`🔍 Attempting individual record insertion for batch ${Math.floor(i/batchSize) + 1}...`);
        
        for (const record of batch) {
          try {
            const { error: singleError } = await selfHostedClient
              .from(tableName)
              .insert(record);
            
            if (singleError) {
              console.error(`❌ Failed to insert individual record:`, singleError.message);
              console.error(`Record:`, JSON.stringify(record, null, 2));
            } else {
              totalInserted++;
            }
          } catch (err) {
            console.error(`❌ Error inserting individual record:`, err.message);
          }
        }
      } else {
        totalInserted += batch.length;
      }
      
      // Add delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ Successfully migrated ${totalInserted} records to self-hosted ${tableName}`);
    return { success: true, count: totalInserted };
    
  } catch (error) {
    console.error(`❌ Migration failed for ${tableName}:`, error.message);
    return { success: false, count: 0 };
  }
}

// Function to migrate storage buckets (skip audio files)
async function migrateStorage() {
  console.log('\n📁 Setting up storage buckets (skipping audio files)...');
  
  try {
    // List buckets from cloud
    const { data: buckets, error: bucketsError } = await cloudClient.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list cloud buckets:', bucketsError.message);
      return { success: false };
    }
    
    console.log(`📥 Found ${buckets.length} buckets in cloud storage`);
    
    for (const bucket of buckets) {
      console.log(`\n🪣 Setting up bucket: ${bucket.name}`);
      
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
      
      // Skip audio file migration - just log what we're skipping
      if (bucket.name === 'audio-files') {
        console.log(`⏭️  Skipping audio files migration for bucket: ${bucket.name}`);
        console.log(`💡 Audio files will need to be re-uploaded by users as needed`);
        continue;
      }
      
      // For other buckets, just create the structure
      console.log(`✅ Bucket ${bucket.name} structure created (no files migrated)`);
    }
    
    console.log('\n📝 Storage Migration Summary:');
    console.log('  ✅ Storage buckets created');
    console.log('  ⏭️  Audio files skipped (as requested)');
    console.log('  💡 Users can re-upload audio files as needed');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Storage setup failed:', error.message);
    return { success: false };
  }
}

// Function to verify migration
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  let totalCloudRecords = 0;
  let totalSelfHostedRecords = 0;
  
  for (const tableName of TABLES_TO_MIGRATE) {
    try {
      // Count records in cloud
      const { count: cloudCount, error: cloudError } = await cloudClient
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (cloudError) {
        console.error(`❌ Failed to count cloud ${tableName}:`, cloudError.message);
        continue;
      }
      
      // Count records in self-hosted
      const { count: selfHostedCount, error: selfHostedError } = await selfHostedClient
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (selfHostedError) {
        console.error(`❌ Failed to count self-hosted ${tableName}:`, selfHostedError.message);
        continue;
      }
      
      console.log(`📊 ${tableName}: Cloud=${cloudCount}, Self-hosted=${selfHostedCount}`);
      
      totalCloudRecords += cloudCount || 0;
      totalSelfHostedRecords += selfHostedCount || 0;
      
    } catch (error) {
      console.error(`❌ Error verifying ${tableName}:`, error.message);
    }
  }
  
  console.log(`\n📊 Total records: Cloud=${totalCloudRecords}, Self-hosted=${totalSelfHostedRecords}`);
  
  if (totalSelfHostedRecords >= totalCloudRecords) {
    console.log('✅ Migration verification successful!');
    return true;
  } else {
    console.log('⚠️  Some records may not have been migrated successfully');
    return false;
  }
}

// Main migration function
async function main() {
  console.log('🚀 Starting Clean Data Migration');
  console.log('================================');
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
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Set up storage (skip audio files)
  const storageResult = await migrateStorage();
  
  // Verify migration
  const verificationResult = await verifyMigration();
  
  // Summary
  console.log('\n📋 Migration Summary');
  console.log('====================');
  console.log(`✅ Successful tables: ${successfulTables}`);
  console.log(`❌ Failed tables: ${failedTables}`);
  console.log(`📊 Total records migrated: ${totalMigrated}`);
  console.log(`📁 Storage setup: ${storageResult.success ? 'Completed' : 'Failed'}`);
  console.log(`🔍 Verification: ${verificationResult ? 'Passed' : 'Failed'}`);
  console.log(`⏭️  Audio files: Skipped (as requested)`);
  
  if (failedTables === 0 && verificationResult) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Test your application login functionality');
    console.log('2. Verify all transcriptions are visible');
    console.log('3. Test new file upload functionality');
    console.log('4. Update your DNS to point to the VPS');
    console.log('5. Consider keeping the cloud instance as backup for a while');
    console.log('\n💡 Note: Audio files were not migrated - users can re-upload as needed');
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
