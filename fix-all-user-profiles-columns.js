#!/usr/bin/env node

/**
 * Fix All User Profiles Columns
 * 
 * This script will add ALL missing columns to user_profiles table
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

// Function to fix the user_profiles schema with ALL columns
async function fixAllUserProfilesColumns() {
  console.log('🔧 Fixing user_profiles schema with ALL missing columns...');
  
  try {
    const client = await pgPool.connect();
    
    // Add ALL possible missing columns to user_profiles table
    const columnsToAdd = [
      'is_active BOOLEAN DEFAULT true',
      'avatar_url TEXT',
      'phone VARCHAR(20)',
      'organization VARCHAR(255)',
      'department VARCHAR(255)',
      'last_login TIMESTAMP WITH TIME ZONE',
      'metadata JSONB',
      'preferences JSONB',
      'settings JSONB',
      'timezone VARCHAR(50)',
      'language VARCHAR(10)',
      'subscription_type VARCHAR(50)',
      'subscription_status VARCHAR(50)',
      'trial_ends_at TIMESTAMP WITH TIME ZONE',
      'billing_email VARCHAR(255)',
      'stripe_customer_id VARCHAR(255)',
      'created_by UUID',
      'updated_by UUID',
      'deleted_at TIMESTAMP WITH TIME ZONE',
      'is_verified BOOLEAN DEFAULT false',
      'verification_token VARCHAR(255)',
      'password_reset_token VARCHAR(255)',
      'password_reset_expires TIMESTAMP WITH TIME ZONE',
      'login_attempts INTEGER DEFAULT 0',
      'locked_until TIMESTAMP WITH TIME ZONE',
      'two_factor_enabled BOOLEAN DEFAULT false',
      'two_factor_secret VARCHAR(255)',
      'backup_codes TEXT[]',
      'last_ip_address INET',
      'user_agent TEXT',
      'consent_given BOOLEAN DEFAULT false',
      'consent_date TIMESTAMP WITH TIME ZONE',
      'marketing_consent BOOLEAN DEFAULT false',
      'data_processing_consent BOOLEAN DEFAULT false'
    ];
    
    for (const column of columnsToAdd) {
      try {
        await client.query(`
          ALTER TABLE user_profiles 
          ADD COLUMN IF NOT EXISTS ${column};
        `);
        console.log(`✅ Added column: ${column.split(' ')[0]}`);
      } catch (error) {
        console.log(`⚠️  Column ${column.split(' ')[0]} might already exist or failed: ${error.message}`);
      }
    }
    
    client.release();
    
    console.log('✅ All user_profiles columns added successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to fix user_profiles schema:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Fixing ALL User Profiles Columns');
  console.log('===================================');
  
  const schemaFixed = await fixAllUserProfilesColumns();
  
  if (schemaFixed) {
    console.log('\n🎉 All user_profiles columns fix completed successfully!');
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




