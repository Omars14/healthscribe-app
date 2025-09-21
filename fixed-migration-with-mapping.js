#!/usr/bin/env node

/**
 * Fixed Migration with Column Mapping
 * 
 * This script will migrate data with proper column mapping between cloud and local databases
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Configuration
const CLOUD_SUPABASE_URL = 'https://yaznemrwbingjwqutbvb.supabase.co';
const CLOUD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ2MDQzMCwiZXhwIjoyMDcxMDM2NDMwfQ.9Ib029SJ7rGbBI4JMoEKacX4LMOZbzOedDZ9JGtuXas';

// PostgreSQL configuration
const POSTGRES_CONFIG = {
  user: 'healthscribe_user',
  host: 'localhost',
  database: 'healthscribe',
  password: 'password123',
  port: 5432,
};

// Create clients
const cloudClient = createClient(CLOUD_SUPABASE_URL, CLOUD_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const pgPool = new Pool(POSTGRES_CONFIG);

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
    
    // Test PostgreSQL connection
    const client = await pgPool.connect();
    const result = await client.query('SELECT version()');
    client.release();
    
    console.log('✅ PostgreSQL connection successful');
    console.log(`📊 PostgreSQL version: ${result.rows[0].version.split(' ')[0]}`);
    
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

// Function to migrate user_profiles with proper column mapping
async function migrateUserProfiles() {
  console.log('\n📦 Migrating table: user_profiles');
  
  try {
    // Get all data from cloud
    const { data: cloudData, error: fetchError } = await cloudClient
      .from('user_profiles')
      .select('*');
    
    if (fetchError) {
      console.error(`❌ Failed to fetch data from cloud user_profiles:`, fetchError.message);
      return { success: false, count: 0 };
    }
    
    if (!cloudData || cloudData.length === 0) {
      console.log(`ℹ️  No data found in cloud user_profiles`);
      return { success: true, count: 0 };
    }
    
    console.log(`📥 Found ${cloudData.length} records in cloud user_profiles`);
    
    // Map cloud columns to local columns
    const mappedData = cloudData.map(record => {
      return {
        id: record.id,
        user_id: record.id, // Map cloud 'id' to local 'user_id'
        email: record.email,
        full_name: record.full_name,
        role: record.role,
        assigned_editor_id: record.assigned_editor_id,
        created_at: record.created_at,
        updated_at: record.updated_at,
        last_active: record.last_active,
        is_active: record.is_active,
        metadata: record.metadata,
        specialty: record.specialty
      };
    });
    
    // Insert data into PostgreSQL
    let totalInserted = 0;
    let totalErrors = 0;
    
    const client = await pgPool.connect();
    
    for (const record of mappedData) {
      try {
        const query = `
          INSERT INTO user_profiles (
            id, user_id, email, full_name, role, assigned_editor_id, 
            created_at, updated_at, last_active, is_active, metadata, specialty
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            assigned_editor_id = EXCLUDED.assigned_editor_id,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at,
            last_active = EXCLUDED.last_active,
            is_active = EXCLUDED.is_active,
            metadata = EXCLUDED.metadata,
            specialty = EXCLUDED.specialty
        `;
        
        await client.query(query, [
          record.id,
          record.user_id,
          record.email,
          record.full_name,
          record.role,
          record.assigned_editor_id,
          record.created_at,
          record.updated_at,
          record.last_active,
          record.is_active,
          record.metadata,
          record.specialty
        ]);
        
        totalInserted++;
      } catch (singleError) {
        totalErrors++;
        console.error(`❌ Failed to insert user profile ${totalInserted + totalErrors}:`, singleError.message);
      }
    }
    
    client.release();
    
    console.log(`✅ Successfully migrated ${totalInserted} user profiles to PostgreSQL`);
    if (totalErrors > 0) {
      console.log(`⚠️  ${totalErrors} user profiles failed to migrate`);
    }
    
    return { success: true, count: totalInserted };
    
  } catch (error) {
    console.error(`❌ Migration failed for user_profiles:`, error.message);
    return { success: false, count: 0 };
  }
}

// Function to migrate transcriptions with proper column mapping
async function migrateTranscriptions() {
  console.log('\n📦 Migrating table: transcriptions');
  
  try {
    // Get all data from cloud
    const { data: cloudData, error: fetchError } = await cloudClient
      .from('transcriptions')
      .select('*');
    
    if (fetchError) {
      console.error(`❌ Failed to fetch data from cloud transcriptions:`, fetchError.message);
      return { success: false, count: 0 };
    }
    
    if (!cloudData || cloudData.length === 0) {
      console.log(`ℹ️  No data found in cloud transcriptions`);
      return { success: true, count: 0 };
    }
    
    console.log(`📥 Found ${cloudData.length} records in cloud transcriptions`);
    
    // Filter out records with null user_id
    const validData = cloudData.filter(record => record.user_id !== null && record.user_id !== undefined);
    const invalidCount = cloudData.length - validData.length;
    
    if (invalidCount > 0) {
      console.log(`⚠️  Skipping ${invalidCount} transcriptions with null user_id`);
    }
    
    // Insert data into PostgreSQL in batches
    const batchSize = 25;
    let totalInserted = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < validData.length; i += batchSize) {
      const batch = validData.slice(i, i + batchSize);
      
      try {
        const client = await pgPool.connect();
        
        for (const record of batch) {
          try {
            const query = `
              INSERT INTO transcriptions (
                id, user_id, file_name, doctor_name, patient_name, document_type,
                transcription_text, audio_url, status, file_size, metadata,
                storage_provider, created_at, updated_at, formatting_model,
                is_formatted, version, error
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
              ON CONFLICT (id) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                file_name = EXCLUDED.file_name,
                doctor_name = EXCLUDED.doctor_name,
                patient_name = EXCLUDED.patient_name,
                document_type = EXCLUDED.document_type,
                transcription_text = EXCLUDED.transcription_text,
                audio_url = EXCLUDED.audio_url,
                status = EXCLUDED.status,
                file_size = EXCLUDED.file_size,
                metadata = EXCLUDED.metadata,
                storage_provider = EXCLUDED.storage_provider,
                created_at = EXCLUDED.created_at,
                updated_at = EXCLUDED.updated_at,
                formatting_model = EXCLUDED.formatting_model,
                is_formatted = EXCLUDED.is_formatted,
                version = EXCLUDED.version,
                error = EXCLUDED.error
            `;
            
            await client.query(query, [
              record.id,
              record.user_id,
              record.file_name,
              record.doctor_name,
              record.patient_name,
              record.document_type,
              record.transcription_text,
              record.audio_url,
              record.status,
              record.file_size,
              record.metadata,
              record.storage_provider,
              record.created_at,
              record.updated_at,
              record.formatting_model,
              record.is_formatted,
              record.version,
              record.error
            ]);
            
            totalInserted++;
          } catch (singleError) {
            totalErrors++;
            console.error(`❌ Failed to insert transcription ${totalInserted + totalErrors}:`, singleError.message);
          }
        }
        
        client.release();
        
        // Add delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (batchError) {
        console.error(`❌ Failed to process batch ${Math.floor(i/batchSize) + 1}:`, batchError.message);
      }
    }
    
    console.log(`✅ Successfully migrated ${totalInserted} transcriptions to PostgreSQL`);
    if (totalErrors > 0) {
      console.log(`⚠️  ${totalErrors} transcriptions failed to migrate`);
    }
    
    return { success: true, count: totalInserted };
    
  } catch (error) {
    console.error(`❌ Migration failed for transcriptions:`, error.message);
    return { success: false, count: 0 };
  }
}

// Function to verify migration
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  try {
    // Count records in cloud
    const { count: cloudUserCount, error: cloudUserError } = await cloudClient
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    const { count: cloudTransCount, error: cloudTransError } = await cloudClient
      .from('transcriptions')
      .select('*', { count: 'exact', head: true });
    
    if (cloudUserError) {
      console.error(`❌ Failed to count cloud user_profiles:`, cloudUserError.message);
    }
    
    if (cloudTransError) {
      console.error(`❌ Failed to count cloud transcriptions:`, cloudTransError.message);
    }
    
    // Count records in PostgreSQL
    const client = await pgPool.connect();
    const userResult = await client.query('SELECT COUNT(*) FROM user_profiles');
    const transResult = await client.query('SELECT COUNT(*) FROM transcriptions');
    client.release();
    
    const postgresUserCount = parseInt(userResult.rows[0].count);
    const postgresTransCount = parseInt(transResult.rows[0].count);
    
    console.log(`📊 user_profiles: Cloud=${cloudUserCount}, PostgreSQL=${postgresUserCount}`);
    console.log(`📊 transcriptions: Cloud=${cloudTransCount}, PostgreSQL=${postgresTransCount}`);
    
    if (postgresUserCount > 0) {
      console.log('✅ User profiles migrated - login should work!');
      return true;
    } else {
      console.log('❌ No user profiles migrated - login will not work!');
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error verifying migration:`, error.message);
    return false;
  }
}

// Main migration function
async function main() {
  console.log('🚀 Fixed Migration with Column Mapping');
  console.log('======================================');
  console.log(`📤 Source: ${CLOUD_SUPABASE_URL}`);
  console.log(`📥 Destination: PostgreSQL (localhost:5432/healthscribe)`);
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
  
  // Migrate user_profiles first (critical for login)
  const userResult = await migrateUserProfiles();
  if (userResult.success) {
    totalMigrated += userResult.count;
    successfulTables++;
  } else {
    failedTables++;
  }
  
  // Add delay between tables
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Migrate transcriptions
  const transResult = await migrateTranscriptions();
  if (transResult.success) {
    totalMigrated += transResult.count;
    successfulTables++;
  } else {
    failedTables++;
  }
  
  // Verify migration
  const verificationResult = await verifyMigration();
  
  // Summary
  console.log('\n📋 Migration Summary');
  console.log('====================');
  console.log(`✅ Successful tables: ${successfulTables}`);
  console.log(`❌ Failed tables: ${failedTables}`);
  console.log(`📊 Total records migrated: ${totalMigrated}`);
  console.log(`🔍 Verification: ${verificationResult ? 'Passed' : 'Failed'}`);
  console.log(`⏭️  Audio files: Skipped (as requested)`);
  
  if (verificationResult) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Test your application at http://www.healthscribe.pro');
    console.log('2. Test login functionality - this should now work!');
    console.log('3. Verify all transcriptions are visible');
    console.log('4. Get SSL certificates: certbot --nginx -d www.healthscribe.pro');
    console.log('5. Update your DNS to point to the VPS');
    console.log('\n💡 Note: Audio files were not migrated - users can re-upload as needed');
  } else {
    console.log('\n⚠️  Migration completed with critical errors');
    console.log('Login functionality may not work - user profiles not migrated');
  }
  
  // Close database connection
  await pgPool.end();
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




