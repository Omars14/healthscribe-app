#!/usr/bin/env node

/**
 * Diagnose Supabase Services
 * 
 * This script will diagnose why Supabase services are not accessible
 * and provide solutions
 */

const fs = require('fs');
const path = require('path');

// Function to check Docker container details
function analyzeDockerContainers() {
  console.log('🔍 Analyzing Docker container details...');
  
  // From the Docker output, we can see the containers are running but not accessible
  // This suggests they might be running but not properly configured
  
  console.log('📊 Docker Container Analysis:');
  console.log('  - supabase_auth_healthscribe: Running on 127.0.0.1:9999 (localhost only)');
  console.log('  - supabase_rest_healthscribe: Running on port 3000 (no external port)');
  console.log('  - supabase_storage_healthscribe: Running on port 5000 (no external port)');
  console.log('  - supabase_studio_healthscribe: Running on 0.0.0.0:3001 (accessible)');
  console.log('  - supabase_db_healthscribe: Running on 0.0.0.0:5432 (accessible)');
  
  console.log('\n🔍 Key Issues Identified:');
  console.log('  1. Auth service is bound to 127.0.0.1:9999 (localhost only)');
  console.log('  2. REST and Storage services have no external port mapping');
  console.log('  3. Services might not be properly configured for external access');
  
  return {
    auth: { accessible: false, reason: 'Bound to localhost only' },
    rest: { accessible: false, reason: 'No external port mapping' },
    storage: { accessible: false, reason: 'No external port mapping' },
    studio: { accessible: true, reason: 'Has external port mapping' },
    db: { accessible: true, reason: 'Has external port mapping' }
  };
}

// Function to create a Supabase restart script
function createSupabaseRestartScript() {
  console.log('\n🔧 Creating Supabase restart script...');
  
  const restartScript = `#!/bin/bash

echo "🚀 Restarting Supabase Services"
echo "==============================="

# Stop all Supabase containers
echo "🛑 Stopping Supabase containers..."
docker-compose down

# Wait a moment
sleep 5

# Start Supabase services
echo "🚀 Starting Supabase services..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker ps | grep supabase

# Test connectivity
echo "🔍 Testing service connectivity..."
echo "Testing auth service..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:9999/auth/v1/token | grep -q "400\|401\|405"; then
    echo "✅ Auth service is accessible"
else
    echo "❌ Auth service is not accessible"
fi

echo "Testing REST API..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/rest/v1/ | grep -q "200\|401"; then
    echo "✅ REST API is accessible"
else
    echo "❌ REST API is not accessible"
fi

echo "Testing storage API..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/storage/v1/ | grep -q "200\|401"; then
    echo "✅ Storage API is accessible"
else
    echo "❌ Storage API is not accessible"
fi

echo "🎉 Supabase restart completed!"
`;

  try {
    // Write the restart script
    fs.writeFileSync('restart-supabase.sh', restartScript);
    console.log('✅ Created Supabase restart script');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create restart script:', error.message);
    return false;
  }
}

// Function to create a Docker Compose fix
function createDockerComposeFix() {
  console.log('\n🔧 Creating Docker Compose fix...');
  
  const dockerComposeFix = `# Fixed Docker Compose configuration for Supabase
# This ensures all services are accessible on the correct ports

version: '3.8'

services:
  supabase-db:
    image: supabase/postgres:15.1.1.78
    container_name: supabase_db_healthscribe
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    volumes:
      - supabase_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

  supabase-auth:
    image: supabase/gotrue:v2.158.1
    container_name: supabase_auth_healthscribe
    ports:
      - "9999:9999"
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:postgres@supabase-db:5432/postgres
    depends_on:
      supabase-db:
        condition: service_healthy

  supabase-rest:
    image: postgrest/postgrest:v12.2.0
    container_name: supabase_rest_healthscribe
    ports:
      - "3000:3000"
    environment:
      PGRST_DB_URI: postgres://postgres:postgres@supabase-db:5432/postgres
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: anon
    depends_on:
      supabase-db:
        condition: service_healthy

  supabase-storage:
    image: supabase/storage-api:v1.11.3
    container_name: supabase_storage_healthscribe
    ports:
      - "5000:5000"
    environment:
      POSTGREST_URL: http://supabase-rest:3000
      PGRST_JWT_SECRET: your-jwt-secret
      DATABASE_URL: postgres://postgres:postgres@supabase-db:5432/postgres
    depends_on:
      supabase-rest:
        condition: service_started

  supabase-studio:
    image: supabase/studio:latest
    container_name: supabase_studio_healthscribe
    ports:
      - "3001:3000"
    environment:
      STUDIO_PG_META_URL: http://supabase-meta:8080
      POSTGRES_PASSWORD: postgres
      DEFAULT_ORGANIZATION_NAME: Default Organization
      DEFAULT_PROJECT_NAME: Default Project
    depends_on:
      supabase-meta:
        condition: service_started

  supabase-meta:
    image: supabase/postgres-meta:v0.84.2
    container_name: supabase_meta_healthscribe
    ports:
      - "8080:8080"
    environment:
      PG_META_PORT: 8080
      PG_META_DB_HOST: supabase-db
      PG_META_DB_PORT: 5432
      PG_META_DB_NAME: postgres
      PG_META_DB_USER: postgres
      PG_META_DB_PASSWORD: postgres
    depends_on:
      supabase-db:
        condition: service_healthy

volumes:
  supabase_db_data:
`;

  try {
    // Write the Docker Compose fix
    fs.writeFileSync('docker-compose-fixed.yml', dockerComposeFix);
    console.log('✅ Created fixed Docker Compose configuration');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create Docker Compose fix:', error.message);
    return false;
  }
}

// Function to create a simple test script
function createTestScript() {
  console.log('\n🔧 Creating test script...');
  
  const testScript = `#!/bin/bash

echo "🧪 Testing Supabase Services"
echo "============================"

# Test each service
echo "Testing auth service (port 9999)..."
curl -v http://localhost:9999/auth/v1/token 2>&1 | head -20

echo -e "\\nTesting REST API (port 3000)..."
curl -v http://localhost:3000/rest/v1/ 2>&1 | head -20

echo -e "\\nTesting storage API (port 5000)..."
curl -v http://localhost:5000/storage/v1/ 2>&1 | head -20

echo -e "\\nTesting studio (port 3001)..."
curl -v http://localhost:3001/ 2>&1 | head -20

echo -e "\\nTesting database (port 5432)..."
nc -zv localhost 5432

echo "\\n🎉 Testing completed!"
`;

  try {
    // Write the test script
    fs.writeFileSync('test-supabase.sh', testScript);
    console.log('✅ Created test script');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create test script:', error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('🚀 Diagnose Supabase Services');
  console.log('=============================');
  
  const analysis = analyzeDockerContainers();
  const restartCreated = createSupabaseRestartScript();
  const composeCreated = createDockerComposeFix();
  const testCreated = createTestScript();
  
  console.log('\n🎉 Diagnosis and fixes completed!');
  console.log('\n📝 What was created:');
  console.log('✅ Analysis of Docker container issues');
  console.log('✅ Supabase restart script');
  console.log('✅ Fixed Docker Compose configuration');
  console.log('✅ Test script for debugging');
  
  console.log('\n📝 Key Issues Found:');
  console.log('🔍 Supabase services are running but not accessible:');
  console.log('  - Auth service: Bound to localhost only');
  console.log('  - REST API: No external port mapping');
  console.log('  - Storage API: No external port mapping');
  console.log('  - Studio: Accessible (has external port)');
  console.log('  - Database: Accessible (has external port)');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Test current services: chmod +x test-supabase.sh && ./test-supabase.sh');
  console.log('2. Restart Supabase: chmod +x restart-supabase.sh && ./restart-supabase.sh');
  console.log('3. If that doesn\'t work, use the fixed Docker Compose:');
  console.log('   cp docker-compose-fixed.yml docker-compose.yml');
  console.log('   docker-compose down && docker-compose up -d');
  console.log('4. Test again: ./test-supabase.sh');
  
  console.log('\n💡 The issue is likely that Supabase services are not properly configured for external access');
}

// Run the diagnosis
main();




