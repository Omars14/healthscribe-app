#!/usr/bin/env node

/**
 * Create Working Nginx Configuration
 * 
 * This script will create a properly formatted Nginx configuration
 * that will pass the nginx -t test
 */

const fs = require('fs');
const path = require('path');

// Function to create a working Nginx configuration
function createWorkingNginxConfig() {
  console.log('🔧 Creating working Nginx configuration...');
  
  const nginxConfig = `# Working Nginx configuration for supabase.healthscribe.pro
server {
    listen 80;
    server_name supabase.healthscribe.pro;
    
    # CORS headers - only in location blocks
    location / {
        # CORS headers
        add_header "Access-Control-Allow-Origin" "https://healthscribe.pro" always;
        add_header "Access-Control-Allow-Origin" "http://www.healthscribe.pro" always;
        add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header "Access-Control-Allow-Headers" "*" always;
        add_header "Access-Control-Allow-Credentials" "true" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header "Access-Control-Allow-Origin" "https://healthscribe.pro" always;
            add_header "Access-Control-Allow-Origin" "http://www.healthscribe.pro" always;
            add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header "Access-Control-Allow-Headers" "*" always;
            add_header "Access-Control-Allow-Credentials" "true" always;
            add_header "Access-Control-Max-Age" 1728000;
            add_header "Content-Type" "text/plain; charset=utf-8";
            add_header "Content-Length" 0;
            return 204;
        }
        
        # Proxy to Supabase
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

  try {
    // Write the working Nginx configuration
    fs.writeFileSync('supabase-nginx-working.conf', nginxConfig);
    console.log('✅ Created working Nginx configuration');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create working Nginx configuration:', error.message);
    return false;
  }
}

// Function to create a minimal configuration (no CORS for testing)
function createMinimalConfig() {
  console.log('🔧 Creating minimal Nginx configuration...');
  
  const minimalConfig = `# Minimal Nginx configuration for supabase.healthscribe.pro
server {
    listen 80;
    server_name supabase.healthscribe.pro;
    
    location / {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

  try {
    // Write the minimal configuration
    fs.writeFileSync('supabase-nginx-minimal.conf', minimalConfig);
    console.log('✅ Created minimal Nginx configuration');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create minimal configuration:', error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('🚀 Create Working Nginx Configuration');
  console.log('====================================');
  
  const workingCreated = createWorkingNginxConfig();
  const minimalCreated = createMinimalConfig();
  
  console.log('\n🎉 Nginx configurations created!');
  console.log('\n📝 What was created:');
  console.log('✅ Working Nginx configuration with CORS');
  console.log('✅ Minimal Nginx configuration (no CORS)');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Try the minimal configuration first:');
  console.log('   sudo cp supabase-nginx-minimal.conf /etc/nginx/sites-available/supabase.healthscribe.pro');
  console.log('2. Enable the site: sudo ln -sf /etc/nginx/sites-available/supabase.healthscribe.pro /etc/nginx/sites-enabled/');
  console.log('3. Test Nginx config: sudo nginx -t');
  console.log('4. If that works, reload Nginx: sudo systemctl reload nginx');
  console.log('5. If minimal works, try the working config with CORS');
  console.log('6. Restart your application: pm2 restart all');
  
  console.log('\n💡 The minimal config should definitely work - it has no CORS headers');
  console.log('💡 Once that works, we can add CORS headers back');
}

// Run the script
main();




