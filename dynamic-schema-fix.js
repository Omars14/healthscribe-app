#!/usr/bin/env node

/**
 * Dynamic Schema Fix
 * 
 * This script will dynamically add ALL missing columns by checking the cloud database structure
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Configuration
const CLOUD_SUPABASE_URL = 'https://yaznemrwbingjwqutbvb.supabase.co';
const CLOUD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ2MDQzMCwiZXhwIjoyMDcxMDM2NDMwfQ.9Ib029SJ7rGbBI4JMoEKacX4LMOZbzOedDZ9JGtuXas';

// PostgreSQL configuration using postgres user
const POSTGRES_CONFIG = {
  user: 'postgres',
  host: 'localhost',
  database: 'healthscribe',
  password: 'postgres',
  port: 5432,
};

const cloudClient = createClient(CLOUD_SUPABASE_URL, CLOUD_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const pgPool = new Pool(POSTGRES_CONFIG);

// Function to get sample data from cloud to determine column types
async function getSampleData(tableName) {
  try {
    const { data, error } = await cloudClient
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ Failed to get sample data from ${tableName}:`, error.message);
      return null;
    }
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error(`❌ Error getting sample data from ${tableName}:`, error.message);
    return null;
  }
}

// Function to determine PostgreSQL column type from JavaScript value
function getPostgresType(value, columnName) {
  if (value === null || value === undefined) {
    return 'TEXT'; // Default to TEXT for unknown types
  }
  
  if (typeof value === 'boolean') {
    return 'BOOLEAN';
  }
  
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return 'INTEGER';
    } else {
      return 'DECIMAL';
    }
  }
  
  if (typeof value === 'string') {
    // Check for UUID pattern
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return 'UUID';
    }
    
    // Check for date pattern
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return 'TIMESTAMP WITH TIME ZONE';
    }
    
    // Check for email pattern
    if (columnName.includes('email') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'VARCHAR(255)';
    }
    
    // Check for phone pattern
    if (columnName.includes('phone') && /^[\+]?[1-9][\d]{0,15}$/.test(value)) {
      return 'VARCHAR(20)';
    }
    
    // Check for URL pattern
    if (columnName.includes('url') && /^https?:\/\//.test(value)) {
      return 'TEXT';
    }
    
    // Check for JSON-like strings
    if (value.startsWith('{') || value.startsWith('[')) {
      return 'JSONB';
    }
    
    // Default string length based on content
    if (value.length > 255) {
      return 'TEXT';
    } else {
      return 'VARCHAR(255)';
    }
  }
  
  if (Array.isArray(value)) {
    return 'TEXT[]';
  }
  
  if (typeof value === 'object') {
    return 'JSONB';
  }
  
  return 'TEXT'; // Default fallback
}

// Function to dynamically fix the schema
async function dynamicSchemaFix() {
  console.log('🔧 Dynamically fixing schema based on cloud database structure...');
  
  try {
    const client = await pgPool.connect();
    
    // Get sample data from user_profiles
    const sampleData = await getSampleData('user_profiles');
    
    if (!sampleData) {
      console.error('❌ Could not get sample data from user_profiles');
      return false;
    }
    
    console.log('📊 Found sample user_profiles data with columns:', Object.keys(sampleData));
    
    // Add missing columns dynamically
    for (const [columnName, value] of Object.entries(sampleData)) {
      try {
        const columnType = getPostgresType(value, columnName);
        
        await client.query(`
          ALTER TABLE user_profiles 
          ADD COLUMN IF NOT EXISTS ${columnName} ${columnType};
        `);
        
        console.log(`✅ Added column: ${columnName} (${columnType})`);
      } catch (error) {
        console.log(`⚠️  Column ${columnName} might already exist or failed: ${error.message}`);
      }
    }
    
    client.release();
    
    console.log('✅ Dynamic schema fix completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to fix schema dynamically:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Dynamic Schema Fix');
  console.log('=====================');
  
  const schemaFixed = await dynamicSchemaFix();
  
  if (schemaFixed) {
    console.log('\n🎉 Dynamic schema fix completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Run the migration script: node run-migration-only.js');
    console.log('2. Test your application at http://www.healthscribe.pro');
    console.log('3. Test login functionality');
  } else {
    console.log('\n❌ Dynamic schema fix failed');
    process.exit(1);
  }
  
  // Close database connection
  await pgPool.end();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run schema fix
main().catch((error) => {
  console.error('❌ Schema fix failed:', error);
  process.exit(1);
});




