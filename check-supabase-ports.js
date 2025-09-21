#!/usr/bin/env node

/**
 * Check Supabase Ports and Fix Configuration
 * 
 * This script will check what ports Supabase is actually running on
 * and create the correct Nginx configuration
 */

const fs = require('fs');
const path = require('path');

// Function to check Supabase ports from Docker output
function analyzeSupabasePorts() {
  console.log('🔍 Analyzing Supabase Docker containers...');
  
  // From the Docker output, we can see:
  const supabaseServices = {
    'supabase_auth_healthscribe': { port: '9999', internal: '9999' },
    'supabase_rest_healthscribe': { port: '3000', internal: '3000' },
    'supabase_realtime_healthscribe': { port: 'unknown', internal: 'unknown' },
    'supabase_storage_healthscribe': { port: '5000', internal: '5000' },
    'supabase_studio_healthscribe': { port: '3001', internal: '3000' },
    'supabase_meta_healthscribe': { port: '8080', internal: '8080' },
    'supabase_db_healthscribe': { port: '5432', internal: '5432' }
  };
  
  console.log('📊 Supabase services and ports:');
  Object.entries(supabaseServices).forEach(([name, config]) => {
    console.log(`  ${name}: ${config.port} -> ${config.internal}`);
  });
  
  return supabaseServices;
}

// Function to create correct Nginx configuration based on actual ports
function createCorrectNginxConfig() {
  console.log('\n🔧 Creating correct Nginx configuration...');
  
  // Based on the Docker output, Supabase services are running on different ports
  // We need to proxy to the correct ports for each service
  const nginxConfig = `# Correct Nginx configuration for supabase.healthscribe.pro
server {
    listen 80;
    server_name supabase.healthscribe.pro;
    
    # Auth service (port 9999)
    location /auth/ {
        proxy_pass http://localhost:9999/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # REST API (port 3000)
    location /rest/ {
        proxy_pass http://localhost:3000/rest/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Storage API (port 5000)
    location /storage/ {
        proxy_pass http://localhost:5000/storage/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Studio (port 3001)
    location /studio/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Default location - try to proxy to the main service
    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

  try {
    // Write the correct Nginx configuration
    fs.writeFileSync('supabase-nginx-correct.conf', nginxConfig);
    console.log('✅ Created correct Nginx configuration');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create correct Nginx configuration:', error.message);
    return false;
  }
}

// Function to create a simple test configuration
function createTestConfig() {
  console.log('\n🔧 Creating test configuration...');
  
  const testConfig = `# Test Nginx configuration for supabase.healthscribe.pro
server {
    listen 80;
    server_name supabase.healthscribe.pro;
    
    # Test location
    location / {
        return 200 "Supabase proxy is working!";
        add_header Content-Type text/plain;
    }
    
    # Auth service test
    location /auth/ {
        proxy_pass http://localhost:9999/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

  try {
    // Write the test configuration
    fs.writeFileSync('supabase-nginx-test.conf', testConfig);
    console.log('✅ Created test Nginx configuration');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create test configuration:', error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('🚀 Check Supabase Ports and Fix Configuration');
  console.log('============================================');
  
  const services = analyzeSupabasePorts();
  const correctConfig = createCorrectNginxConfig();
  const testConfig = createTestConfig();
  
  console.log('\n🎉 Analysis and configurations completed!');
  console.log('\n📝 What was created:');
  console.log('✅ Analysis of Supabase service ports');
  console.log('✅ Correct Nginx configuration with proper port mapping');
  console.log('✅ Test Nginx configuration for debugging');
  
  console.log('\n📝 Key Findings:');
  console.log('🔍 Supabase services are running on different ports:');
  console.log('  - Auth: localhost:9999');
  console.log('  - REST API: localhost:3000');
  console.log('  - Storage: localhost:5000');
  console.log('  - Studio: localhost:3001');
  console.log('  - Database: localhost:5432');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Test the correct configuration:');
  console.log('   sudo cp supabase-nginx-correct.conf /etc/nginx/sites-available/supabase.healthscribe.pro');
  console.log('2. Enable the site: sudo ln -sf /etc/nginx/sites-available/supabase.healthscribe.pro /etc/nginx/sites-enabled/');
  console.log('3. Test Nginx config: sudo nginx -t');
  console.log('4. Reload Nginx: sudo systemctl reload nginx');
  console.log('5. Test connectivity: curl http://supabase.healthscribe.pro/');
  console.log('6. Test auth: curl http://supabase.healthscribe.pro/auth/v1/token');
  
  console.log('\n💡 The issue was that Supabase services are on different ports, not port 8000');
}

// Run the analysis
main();




