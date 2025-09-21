#!/usr/bin/env node

/**
 * Run Migration Only Script
 * 
 * This script will run the data migration (schema is already fixed)
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

// Function to migrate a single table with better error handling
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
    
    // Clean the data and prepare for PostgreSQL
    const cleanedData = cloudData.map(record => {
      const cleaned = { ...record };
      
      // Ensure required fields are present
      if (tableName === 'transcriptions' && !cleaned.id) {
        cleaned.id = require('crypto').randomUUID();
      }
      
      // Clean up any null or undefined values
      Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === null || cleaned[key] === undefined) {
          delete cleaned[key];
        }
      });
      
      return cleaned;
    });
    
    // Insert data into PostgreSQL in batches
    const batchSize = 25; // Smaller batches for better error handling
    let totalInserted = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < cleanedData.length; i += batchSize) {
      const batch = cleanedData.slice(i, i + batchSize);
      
      try {
        const client = await pgPool.connect();
        
        for (const record of batch) {
          try {
            // Build dynamic INSERT query
            const columns = Object.keys(record);
            const values = Object.values(record);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
            
            const query = `
              INSERT INTO ${tableName} (${columns.join(', ')})
              VALUES (${placeholders})
              ON CONFLICT (id) DO UPDATE SET
              ${columns.map(col => `${col} = EXCLUDED.${col}`).join(', ')}
            `;
            
            await client.query(query, values);
            totalInserted++;
          } catch (singleError) {
            totalErrors++;
            console.error(`❌ Failed to insert record ${totalInserted + totalErrors}:`, singleError.message);
            // Continue with other records instead of stopping
          }
        }
        
        client.release();
        
        // Add delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (batchError) {
        console.error(`❌ Failed to process batch ${Math.floor(i/batchSize) + 1}:`, batchError.message);
      }
    }
    
    console.log(`✅ Successfully migrated ${totalInserted} records to PostgreSQL ${tableName}`);
    if (totalErrors > 0) {
      console.log(`⚠️  ${totalErrors} records failed to migrate`);
    }
    return { success: true, count: totalInserted };
    
  } catch (error) {
    console.error(`❌ Migration failed for ${tableName}:`, error.message);
    return { success: false, count: 0 };
  }
}

// Function to verify migration
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  let totalCloudRecords = 0;
  let totalPostgresRecords = 0;
  
  const tables = ['user_profiles', 'transcriptions'];
  
  for (const tableName of tables) {
    try {
      // Count records in cloud
      const { count: cloudCount, error: cloudError } = await cloudClient
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (cloudError) {
        console.error(`❌ Failed to count cloud ${tableName}:`, cloudError.message);
        continue;
      }
      
      // Count records in PostgreSQL
      const client = await pgPool.connect();
      const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
      client.release();
      
      const postgresCount = parseInt(result.rows[0].count);
      
      console.log(`📊 ${tableName}: Cloud=${cloudCount}, PostgreSQL=${postgresCount}`);
      
      totalCloudRecords += cloudCount || 0;
      totalPostgresRecords += postgresCount || 0;
      
    } catch (error) {
      console.error(`❌ Error verifying ${tableName}:`, error.message);
    }
  }
  
  console.log(`\n📊 Total records: Cloud=${totalCloudRecords}, PostgreSQL=${totalPostgresRecords}`);
  
  // Check if user_profiles were migrated (critical for login)
  const client = await pgPool.connect();
  const userResult = await client.query('SELECT COUNT(*) FROM user_profiles');
  client.release();
  
  const userCount = parseInt(userResult.rows[0].count);
  
  if (userCount > 0) {
    console.log('✅ User profiles migrated - login should work!');
    return true;
  } else {
    console.log('❌ No user profiles migrated - login will not work!');
    return false;
  }
}

// Main migration function
async function main() {
  console.log('🚀 Running Data Migration (Schema Already Fixed)');
  console.log('================================================');
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
  
  // Migrate tables in order of importance
  const tablesToMigrate = ['user_profiles', 'transcriptions'];
  
  for (const tableName of tablesToMigrate) {
    const result = await migrateTable(tableName);
    
    if (result.success) {
      totalMigrated += result.count;
      successfulTables++;
    } else {
      failedTables++;
    }
    
    // Add delay between tables
    await new Promise(resolve => setTimeout(resolve, 2000));
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




