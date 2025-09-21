#!/usr/bin/env node

/**
 * Fix User Profiles Schema
 * 
 * This script will add the missing 'is_active' column to user_profiles table
 */

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

// PostgreSQL configuration using postgres user
const POSTGRES_CONFIG = {
  user: 'postgres',
  host: 'localhost',
  database: 'healthscribe',
  password: 'postgres',
  port: 5432,
};

const pgPool = new Pool(POSTGRES_CONFIG);

// Function to fix the user_profiles schema
async function fixUserProfilesSchema() {
  console.log('🔧 Fixing user_profiles schema as postgres user...');
  
  try {
    const client = await pgPool.connect();
    
    // Add the missing 'is_active' column to user_profiles table
    await client.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);
    
    // Also add any other missing columns that might exist in cloud
    await client.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `);
    
    await client.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
    `);
    
    await client.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS organization VARCHAR(255);
    `);
    
    await client.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS department VARCHAR(255);
    `);
    
    await client.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
    `);
    
    client.release();
    
    console.log('✅ User profiles schema fixed - added missing columns');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to fix user_profiles schema:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Fixing User Profiles Schema');
  console.log('===============================');
  
  const schemaFixed = await fixUserProfilesSchema();
  
  if (schemaFixed) {
    console.log('\n🎉 User profiles schema fix completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Run the migration script: node run-migration-only.js');
    console.log('2. Test your application at http://www.healthscribe.pro');
    console.log('3. Test login functionality');
  } else {
    console.log('\n❌ User profiles schema fix failed');
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




