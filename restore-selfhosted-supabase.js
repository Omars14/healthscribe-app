#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const SSH_HOST = '154.26.155.207';
const SSH_USER = 'root';
const SSH_PASS = 'Nomar123';

async function main() {
  console.log('🔧 Restoring Self-Hosted Supabase...\n');

  try {
    const restoreCmd = `
      sshpass -p '${SSH_PASS}' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} << 'ENDSSH'
        set -e
        
        echo "============================================"
        echo "STEP 1: Check Current State"
        echo "============================================"
        
        # Check if Supabase directory exists
        if [ -d "/opt/supabase" ]; then
          echo "✅ Found /opt/supabase"
          cd /opt/supabase/docker
        elif [ -d "/data/supabase" ]; then
          echo "✅ Found /data/supabase"
          cd /data/supabase/docker
        else
          echo "❌ Supabase not found, will install..."
          
          echo ""
          echo "============================================"
          echo "STEP 2: Installing Supabase"
          echo "============================================"
          
          cd /opt
          git clone --depth 1 https://github.com/supabase/supabase
          cd supabase/docker
          
          echo "✅ Cloned Supabase repository"
        fi
        
        echo ""
        echo "============================================"
        echo "STEP 3: Configure Environment"
        echo "============================================"
        
        # Check if .env exists
        if [ ! -f ".env" ]; then
          echo "Creating .env file..."
          cp .env.example .env
          
          # Generate JWT secret
          JWT_SECRET=\$(openssl rand -base64 32)
          
          # Update .env with proper values
          sed -i "s|JWT_SECRET=.*|JWT_SECRET=\$JWT_SECRET|" .env
          sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=Nomar123|" .env
          sed -i "s|SITE_URL=.*|SITE_URL=https://healthscribe.pro|" .env
          sed -i "s|API_EXTERNAL_URL=.*|API_EXTERNAL_URL=https://supabase.healthscribe.pro|" .env
          sed -i "s|SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=https://supabase.healthscribe.pro|" .env
          
          echo "✅ Created and configured .env"
        else
          echo "✅ .env file exists"
        fi
        
        # Show current JWT secret for application config
        JWT_SECRET=\$(grep "JWT_SECRET=" .env | cut -d= -f2)
        echo "JWT Secret: \$JWT_SECRET"
        
        echo ""
        echo "============================================"
        echo "STEP 4: Start Supabase Services"
        echo "============================================"
        
        # Stop any existing services
        docker-compose down 2>/dev/null || true
        
        # Start services
        echo "Starting Supabase services..."
        docker-compose up -d
        
        echo "⏳ Waiting 30 seconds for services to start..."
        sleep 30
        
        echo ""
        echo "============================================"
        echo "STEP 5: Verify Services"
        echo "============================================"
        
        docker-compose ps
        
        echo ""
        echo "============================================"
        echo "STEP 6: Check Auth Service"
        echo "============================================"
        
        # Wait for auth to be ready
        for i in {1..10}; do
          if curl -s http://localhost:8000/auth/v1/health | grep -q "ok"; then
            echo "✅ Auth service is healthy!"
            break
          else
            echo "⏳ Waiting for auth service... (\$i/10)"
            sleep 3
          fi
        done
        
        echo ""
        echo "============================================"
        echo "STEP 7: Setup Database Schema"
        echo "============================================"
        
        # Get database container name
        DB_CONTAINER=\$(docker-compose ps -q db)
        
        # Wait for database to be ready
        echo "Waiting for database..."
        for i in {1..10}; do
          if docker exec "\$DB_CONTAINER" pg_isready -U postgres; then
            echo "✅ Database is ready!"
            break
          else
            echo "⏳ Waiting for database... (\$i/10)"
            sleep 3
          fi
        done
        
        # Check if our user exists
        USER_EXISTS=\$(docker exec "\$DB_CONTAINER" psql -U postgres -d postgres -tAc "SELECT COUNT(*) FROM auth.users WHERE email = 'omars14@gmail.com';")
        
        if [ "\$USER_EXISTS" = "1" ]; then
          echo "✅ User omars14@gmail.com exists"
        else
          echo "⚠️ User does not exist, will need to create after auth is working"
        fi
        
        echo ""
        echo "============================================"
        echo "STEP 8: Configure Nginx Proxy"
        echo "============================================"
        
        # Create nginx config for Supabase
        cat > /tmp/supabase-nginx.conf << 'NGINXEOF'
# Supabase API Gateway
upstream supabase_api {
    server localhost:8000;
}

server {
    listen 80;
    server_name supabase.healthscribe.pro;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name supabase.healthscribe.pro;
    
    # SSL - will be configured by Certbot
    ssl_certificate /etc/letsencrypt/live/supabase.healthscribe.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/supabase.healthscribe.pro/privkey.pem;
    
    # Proxy to Supabase Kong API Gateway
    location / {
        proxy_pass http://supabase_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,apikey' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }
}
NGINXEOF

        # Check if SSL cert exists
        if [ -f "/etc/letsencrypt/live/supabase.healthscribe.pro/fullchain.pem" ]; then
          echo "✅ SSL certificate exists"
          cp /tmp/supabase-nginx.conf /etc/nginx/sites-available/supabase.healthscribe.pro
        else
          echo "⚠️ SSL certificate not found, creating HTTP-only config first..."
          # Create HTTP-only version for initial cert request
          sed 's/listen 443 ssl http2;/listen 80;/' /tmp/supabase-nginx.conf | \
          sed '/ssl_certificate/d' | \
          sed '/return 301/,+1d' | \
          sed 's/server {/server {/' > /etc/nginx/sites-available/supabase.healthscribe.pro
        fi
        
        # Enable site
        ln -sf /etc/nginx/sites-available/supabase.healthscribe.pro /etc/nginx/sites-enabled/
        
        # Test nginx config
        nginx -t && systemctl reload nginx
        
        echo ""
        echo "============================================"
        echo "STEP 9: Get SSL Certificate (if needed)"
        echo "============================================"
        
        if [ ! -f "/etc/letsencrypt/live/supabase.healthscribe.pro/fullchain.pem" ]; then
          echo "Requesting SSL certificate..."
          certbot --nginx -d supabase.healthscribe.pro --non-interactive --agree-tos --email omars14@gmail.com || echo "Certbot failed, may need manual setup"
          
          # Update nginx config with SSL
          if [ -f "/etc/letsencrypt/live/supabase.healthscribe.pro/fullchain.pem" ]; then
            cp /tmp/supabase-nginx.conf /etc/nginx/sites-available/supabase.healthscribe.pro
            nginx -t && systemctl reload nginx
            echo "✅ SSL certificate obtained and configured"
          fi
        fi
        
        echo ""
        echo "============================================"
        echo "FINAL STATUS"
        echo "============================================"
        
        echo ""
        echo "📊 Docker Services:"
        docker-compose ps | grep -E "Up|STATUS"
        
        echo ""
        echo "🌐 Endpoints:"
        echo "  - Internal: http://localhost:8000"
        echo "  - External: https://supabase.healthscribe.pro"
        
        echo ""
        echo "🔐 Testing Auth Endpoint:"
        curl -s http://localhost:8000/auth/v1/health | head -3
        
        echo ""
        echo ""
        echo "✅ Supabase restoration complete!"
        
        # Get the JWT secret and anon key
        echo ""
        echo "============================================"
        echo "IMPORTANT: APPLICATION CONFIGURATION"
        echo "============================================"
        
        ANON_KEY=\$(grep "ANON_KEY=" .env | cut -d= -f2)
        SERVICE_KEY=\$(grep "SERVICE_ROLE_KEY=" .env | cut -d= -f2)
        
        echo ""
        echo "Update your application .env.local with:"
        echo "NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro"
        echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=\$ANON_KEY"
        echo "SUPABASE_SERVICE_ROLE_KEY=\$SERVICE_KEY"
        
ENDSSH
    `;

    const { stdout } = await execAsync(restoreCmd, { maxBuffer: 1024 * 1024 * 10 });
    console.log(stdout);

    console.log('\n' + '='.repeat(80));
    console.log('🎉 SUPABASE RESTORATION PROCESS COMPLETED');
    console.log('='.repeat(80));
    console.log('\n📝 NEXT STEPS:');
    console.log('\n1. Update local .env.local with the keys shown above');
    console.log('2. Commit and push changes');
    console.log('3. Test login at https://healthscribe.pro/login');
    console.log('4. User credentials: omars14@gmail.com / Nomar123');
    console.log('\n⚠️ If auth still fails:');
    console.log('- SSH: ssh root@154.26.155.207');
    console.log('- Check logs: cd /opt/supabase/docker && docker-compose logs auth');
    console.log('- Restart: docker-compose restart');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stdout) console.log('\nOutput:', error.stdout);
    if (error.stderr) console.error('\nErrors:', error.stderr);
    
    console.log('\n🔄 Manual fallback steps:');
    console.log('1. SSH: ssh root@154.26.155.207');
    console.log('2. cd /opt/supabase/docker');
    console.log('3. docker-compose up -d');
    console.log('4. docker-compose logs -f auth');
    process.exit(1);
  }
}

main();

