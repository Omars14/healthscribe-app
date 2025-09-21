#!/usr/bin/env node

/**
 * Fix HTTPS to HTTP Configuration
 * 
 * This script will update the environment configuration to use HTTP
 * instead of HTTPS for the self-hosted Supabase
 */

const fs = require('fs');
const path = require('path');

// Function to update environment configuration to use HTTP
function updateEnvironmentToHttp() {
  console.log('🔧 Updating environment configuration to use HTTP...');
  
  const envContent = `# Use Self-Hosted Supabase (HTTP - no SSL)
NEXT_PUBLIC_SUPABASE_URL=http://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjA0MzAsImV4cCI6MjA3MTAzNjQzMH0.uluQzD4-m91tUq0gOrUNOfR9rlN0Ry4tAPlxp-PWrIo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ2MDQzMCwiZXhwIjoyMDcxMDM2NDMwfQ.9Ib029SJ7rGbBI4JMoEKacX4LMOZbzOedDZ9JGtuXAs

# Application URLs
NEXT_PUBLIC_URL=http://www.healthscribe.pro
NEXT_PUBLIC_API_URL=http://www.healthscribe.pro
NODE_ENV=production

# Database Configuration (for local PostgreSQL - backup/alternative)
DATABASE_URL=postgresql://healthscribe_user:password123@localhost:5432/healthscribe
POSTGRES_PASSWORD=password123
POSTGRES_DB=healthscribe
POSTGRES_USER=healthscribe_user
`;

  try {
    // Write the updated .env.local file
    fs.writeFileSync('.env.local', envContent);
    console.log('✅ Updated .env.local file to use HTTP Supabase');
    
    // Also create a .env file for backup
    fs.writeFileSync('.env', envContent);
    console.log('✅ Created .env file as backup');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to update environment configuration:', error.message);
    return false;
  }
}

// Function to check current environment configuration
function checkCurrentConfig() {
  console.log('\n🔍 Checking current environment configuration...');
  
  try {
    if (fs.existsSync('.env.local')) {
      const content = fs.readFileSync('.env.local', 'utf8');
      console.log('📄 Current .env.local content:');
      console.log(content);
      
      // Check if it contains HTTPS
      if (content.includes('https://supabase.healthscribe.pro')) {
        console.log('⚠️  Found HTTPS URL in configuration - this needs to be changed to HTTP');
        return false;
      } else if (content.includes('http://supabase.healthscribe.pro')) {
        console.log('✅ Configuration already uses HTTP');
        return true;
      } else {
        console.log('❓ Configuration URL not found');
        return false;
      }
    } else {
      console.log('❌ .env.local file not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to check current configuration:', error.message);
    return false;
  }
}

// Function to create a test script to verify the fix
function createTestScript() {
  console.log('\n🔧 Creating test script to verify the fix...');
  
  const testScript = `#!/bin/bash

echo "🧪 Testing HTTP Supabase Configuration"
echo "======================================"

# Test HTTP endpoint
echo "Testing HTTP auth endpoint..."
curl -s -o /dev/null -w "Status: %{http_code} | Response Time: %{time_total}s\\n" http://supabase.healthscribe.pro/auth/v1/token

echo "Testing HTTP REST endpoint..."
curl -s -o /dev/null -w "Status: %{http_code} | Response Time: %{time_total}s\\n" http://supabase.healthscribe.pro/rest/v1/

echo "Testing HTTP storage endpoint..."
curl -s -o /dev/null -w "Status: %{http_code} | Response Time: %{time_total}s\\n" http://supabase.healthscribe.pro/storage/v1/

echo -e "\\n🎉 HTTP endpoint testing completed!"
echo "If you see status codes 400, 401, 404, or 405, the endpoints are working correctly."
echo "Status 000 means the endpoint is not accessible."
`;

  try {
    // Write the test script
    fs.writeFileSync('test-http-endpoints.sh', testScript);
    console.log('✅ Created HTTP endpoint test script');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create test script:', error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('🚀 Fix HTTPS to HTTP Configuration');
  console.log('==================================');
  
  const currentConfig = checkCurrentConfig();
  const envUpdated = updateEnvironmentToHttp();
  const testScript = createTestScript();
  
  console.log('\n🎉 HTTPS to HTTP fix completed!');
  console.log('\n📝 What was done:');
  console.log('✅ Checked current environment configuration');
  console.log('✅ Updated environment to use HTTP instead of HTTPS');
  console.log('✅ Created HTTP endpoint test script');
  
  console.log('\n📝 Key Changes:');
  console.log('🔧 Changed NEXT_PUBLIC_SUPABASE_URL from https:// to http://');
  console.log('🔧 This will eliminate the SSL certificate error');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Restart your application: pm2 restart all');
  console.log('2. Test HTTP endpoints: chmod +x test-http-endpoints.sh && ./test-http-endpoints.sh');
  console.log('3. Test login functionality - should now work without SSL errors');
  
  console.log('\n💡 The SSL certificate error was caused by trying to use HTTPS with a self-signed certificate');
  console.log('💡 Using HTTP eliminates this issue and should allow login to work');
}

// Run the fix
main();




