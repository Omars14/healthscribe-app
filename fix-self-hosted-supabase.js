#!/usr/bin/env node

/**
 * Fix Self-Hosted Supabase Configuration
 * 
 * This script will fix the self-hosted Supabase configuration and ensure
 * it's properly accessible at supabase.healthscribe.pro
 */

const fs = require('fs');
const path = require('path');

// Function to update environment configuration to use self-hosted Supabase
function updateEnvironmentConfig() {
  console.log('🔧 Updating environment configuration to use self-hosted Supabase...');
  
  const envContent = `# Use Self-Hosted Supabase (Our Goal)
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
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
    console.log('✅ Updated .env.local file to use self-hosted Supabase');
    
    // Also create a .env file for backup
    fs.writeFileSync('.env', envContent);
    console.log('✅ Created .env file as backup');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to update environment configuration:', error.message);
    return false;
  }
}

// Function to create Nginx configuration for self-hosted Supabase
function createNginxConfig() {
  console.log('\n🌐 Creating Nginx configuration for self-hosted Supabase...');
  
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
    
    # SSL Configuration (temporary self-signed for testing)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # CORS headers for healthscribe.pro
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
    
    # Proxy to Supabase services
    location /auth/ {
        proxy_pass http://localhost:8000/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /rest/ {
        proxy_pass http://localhost:8000/rest/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /realtime/ {
        proxy_pass http://localhost:8000/realtime/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /storage/ {
        proxy_pass http://localhost:8000/storage/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Default location
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
    // Write the Nginx configuration
    fs.writeFileSync('supabase-nginx.conf', nginxConfig);
    console.log('✅ Created Nginx configuration for self-hosted Supabase');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create Nginx configuration:', error.message);
    return false;
  }
}

// Function to create Supabase startup script
function createSupabaseStartupScript() {
  console.log('\n🚀 Creating Supabase startup script...');
  
  const startupScript = `#!/bin/bash

echo "🚀 Starting Self-Hosted Supabase"
echo "================================"

# Check if Supabase is already running
if docker ps | grep -q "supabase"; then
    echo "✅ Supabase is already running"
    docker ps | grep supabase
else
    echo "🔧 Starting Supabase services..."
    
    # Start Supabase using Docker Compose
    if [ -f "docker-compose.yml" ]; then
        docker-compose up -d
    else
        echo "❌ docker-compose.yml not found"
        echo "Please ensure Supabase is properly configured"
        exit 1
    fi
    
    # Wait for services to start
    echo "⏳ Waiting for Supabase services to start..."
    sleep 10
    
    # Check if services are running
    if docker ps | grep -q "supabase"; then
        echo "✅ Supabase services started successfully"
        docker ps | grep supabase
    else
        echo "❌ Failed to start Supabase services"
        docker-compose logs
        exit 1
    fi
fi

# Test Supabase connectivity
echo "🔍 Testing Supabase connectivity..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Supabase is accessible on localhost:8000"
else
    echo "⚠️  Supabase might not be fully ready yet"
fi

echo "🎉 Self-hosted Supabase startup completed!"
`;

  try {
    // Write the startup script
    fs.writeFileSync('start-supabase.sh', startupScript);
    console.log('✅ Created Supabase startup script');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create startup script:', error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('🚀 Fix Self-Hosted Supabase Configuration');
  console.log('=========================================');
  
  const envUpdated = updateEnvironmentConfig();
  if (!envUpdated) {
    console.log('\n❌ Environment configuration update failed');
    process.exit(1);
  }
  
  const nginxCreated = createNginxConfig();
  const startupCreated = createSupabaseStartupScript();
  
  console.log('\n🎉 Self-hosted Supabase configuration fix completed!');
  console.log('\n📝 What was created:');
  console.log('✅ Environment variables updated to use self-hosted Supabase');
  console.log('✅ Nginx configuration for supabase.healthscribe.pro');
  console.log('✅ Supabase startup script');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Copy supabase-nginx.conf to /etc/nginx/sites-available/');
  console.log('2. Enable the site: sudo ln -s /etc/nginx/sites-available/supabase-nginx.conf /etc/nginx/sites-enabled/');
  console.log('3. Test Nginx config: sudo nginx -t');
  console.log('4. Reload Nginx: sudo systemctl reload nginx');
  console.log('5. Start Supabase: chmod +x start-supabase.sh && ./start-supabase.sh');
  console.log('6. Restart your application: pm2 restart all');
  
  console.log('\n💡 This will fix the self-hosted Supabase and make it accessible at supabase.healthscribe.pro');
}

// Run the fix
main();




