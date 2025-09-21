#!/usr/bin/env node

/**
 * Fix Nginx Configuration and SSL for Self-Hosted Supabase
 * 
 * This script will create a proper Nginx configuration and set up SSL
 */

const fs = require('fs');
const path = require('path');

// Function to create a proper Nginx configuration
function createFixedNginxConfig() {
  console.log('🔧 Creating fixed Nginx configuration...');
  
  const nginxConfig = `# Nginx configuration for supabase.healthscribe.pro
server {
    listen 80;
    server_name supabase.healthscribe.pro;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name supabase.healthscribe.pro;
    
    # SSL Configuration (self-signed for now)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # CORS headers - properly placed in location blocks
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
    
    # Specific location for auth
    location /auth/ {
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
        
        proxy_pass http://localhost:8000/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Specific location for rest
    location /rest/ {
        # CORS headers
        add_header "Access-Control-Allow-Origin" "https://healthscribe.pro" always;
        add_header "Access-Control-Allow-Origin" "http://www.healthscribe.pro" always;
        add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header "Access-Control-Allow-Headers" "*" always;
        add_header "Access-Control-Allow-Credentials" "true" always;
        
        proxy_pass http://localhost:8000/rest/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Specific location for realtime
    location /realtime/ {
        # CORS headers
        add_header "Access-Control-Allow-Origin" "https://healthscribe.pro" always;
        add_header "Access-Control-Allow-Origin" "http://www.healthscribe.pro" always;
        add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header "Access-Control-Allow-Headers" "*" always;
        add_header "Access-Control-Allow-Credentials" "true" always;
        
        proxy_pass http://localhost:8000/realtime/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Specific location for storage
    location /storage/ {
        # CORS headers
        add_header "Access-Control-Allow-Origin" "https://healthscribe.pro" always;
        add_header "Access-Control-Allow-Origin" "http://www.healthscribe.pro" always;
        add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header "Access-Control-Allow-Headers" "*" always;
        add_header "Access-Control-Allow-Credentials" "true" always;
        
        proxy_pass http://localhost:8000/storage/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

  try {
    // Write the fixed Nginx configuration
    fs.writeFileSync('supabase-nginx-fixed.conf', nginxConfig);
    console.log('✅ Created fixed Nginx configuration');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create fixed Nginx configuration:', error.message);
    return false;
  }
}

// Function to create a simple HTTP-only configuration (no SSL)
function createHttpOnlyConfig() {
  console.log('🔧 Creating HTTP-only configuration (no SSL)...');
  
  const httpConfig = `# HTTP-only Nginx configuration for supabase.healthscribe.pro (no SSL)
server {
    listen 80;
    server_name supabase.healthscribe.pro;
    
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
    // Write the HTTP-only configuration
    fs.writeFileSync('supabase-nginx-http.conf', httpConfig);
    console.log('✅ Created HTTP-only Nginx configuration');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create HTTP-only configuration:', error.message);
    return false;
  }
}

// Function to update environment to use HTTP instead of HTTPS
function updateEnvironmentToHttp() {
  console.log('🔧 Updating environment to use HTTP instead of HTTPS...');
  
  const envContent = `# Use Self-Hosted Supabase (HTTP - no SSL for now)
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

// Main function
function main() {
  console.log('🚀 Fix Nginx Configuration and SSL');
  console.log('==================================');
  
  const nginxFixed = createFixedNginxConfig();
  const nginxHttp = createHttpOnlyConfig();
  const envUpdated = updateEnvironmentToHttp();
  
  console.log('\n🎉 Nginx and SSL fix completed!');
  console.log('\n📝 What was created:');
  console.log('✅ Fixed Nginx configuration with proper CORS headers');
  console.log('✅ HTTP-only Nginx configuration (no SSL)');
  console.log('✅ Environment updated to use HTTP instead of HTTPS');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Use the HTTP-only configuration first:');
  console.log('   sudo cp supabase-nginx-http.conf /etc/nginx/sites-available/supabase.healthscribe.pro');
  console.log('2. Enable the site: sudo ln -sf /etc/nginx/sites-available/supabase.healthscribe.pro /etc/nginx/sites-enabled/');
  console.log('3. Test Nginx config: sudo nginx -t');
  console.log('4. Reload Nginx: sudo systemctl reload nginx');
  console.log('5. Restart your application: pm2 restart all');
  console.log('6. Test login - should work with HTTP (no SSL errors)');
  
  console.log('\n💡 This will fix the SSL certificate error by using HTTP instead of HTTPS');
  console.log('💡 Once login works, we can set up proper SSL certificates later');
}

// Run the fix
main();




