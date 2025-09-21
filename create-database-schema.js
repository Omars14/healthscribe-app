#!/usr/bin/env node

/**
 * Database Schema Creation Script
 * 
 * This script creates the necessary tables in the PostgreSQL database
 * before running the data migration.
 */

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

// PostgreSQL configuration
const POSTGRES_CONFIG = {
  user: 'healthscribe_user',
  host: 'localhost',
  database: 'healthscribe',
  password: 'password123',
  port: 5432,
};

const pgPool = new Pool(POSTGRES_CONFIG);

// Database schema
const SCHEMA_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcriptions table
CREATE TABLE IF NOT EXISTS transcriptions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    file_name VARCHAR(500),
    doctor_name VARCHAR(255),
    patient_name VARCHAR(255),
    document_type VARCHAR(100),
    transcription_text TEXT,
    audio_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    file_size BIGINT,
    metadata JSONB,
    storage_provider VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    formatting_model VARCHAR(100),
    is_formatted BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcription edits table
CREATE TABLE IF NOT EXISTS transcription_edits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    original_text TEXT,
    edited_text TEXT,
    edit_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcription metrics table
CREATE TABLE IF NOT EXISTS transcription_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    accuracy_score DECIMAL(5,2),
    processing_time INTEGER,
    word_count INTEGER,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_transcription_id ON reviews(transcription_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_transcription_edits_transcription_id ON transcription_edits(transcription_id);
CREATE INDEX IF NOT EXISTS idx_transcription_metrics_transcription_id ON transcription_metrics(transcription_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transcriptions_updated_at ON transcriptions;
CREATE TRIGGER update_transcriptions_updated_at
    BEFORE UPDATE ON transcriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

// Function to create schema
async function createSchema() {
  console.log('🏗️  Creating database schema...');
  
  try {
    const client = await pgPool.connect();
    
    // Execute the schema SQL
    await client.query(SCHEMA_SQL);
    
    client.release();
    
    console.log('✅ Database schema created successfully!');
    
    // Verify tables were created
    const verifyClient = await pgPool.connect();
    const result = await verifyClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    verifyClient.release();
    
    console.log('\n📋 Created tables:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to create schema:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Database Schema Creation');
  console.log('============================');
  console.log(`📥 Target: PostgreSQL (localhost:5432/healthscribe)`);
  console.log('');
  
  const success = await createSchema();
  
  if (success) {
    console.log('\n🎉 Schema creation completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Run the data migration: node migrate-data-final.js');
    console.log('2. Test your application');
  } else {
    console.log('\n❌ Schema creation failed');
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

// Run schema creation
main().catch((error) => {
  console.error('❌ Schema creation failed:', error);
  process.exit(1);
});




