#!/usr/bin/env node

/**
 * Fix Schema as Postgres User
 * 
 * This script will add the missing 'error' column using postgres user
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

// Function to fix the schema
async function fixSchema() {
  console.log('🔧 Fixing database schema as postgres user...');
  
  try {
    const client = await pgPool.connect();
    
    // Add the missing 'error' column to transcriptions table
    await client.query(`
      ALTER TABLE transcriptions 
      ADD COLUMN IF NOT EXISTS error TEXT;
    `);
    
    client.release();
    
    console.log('✅ Schema fixed - added error column to transcriptions table');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to fix schema:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Fixing Schema as Postgres User');
  console.log('==================================');
  
  const schemaFixed = await fixSchema();
  
  if (schemaFixed) {
    console.log('\n🎉 Schema fix completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Run the migration script: node fix-schema-and-migrate.js');
    console.log('2. Test your application at http://www.healthscribe.pro');
    console.log('3. Test login functionality');
  } else {
    console.log('\n❌ Schema fix failed');
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




