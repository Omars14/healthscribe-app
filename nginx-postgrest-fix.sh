#!/bin/bash

echo "🔧 FIXING NGINX & POSTGREST CONFIGURATION"
echo "========================================="

# 1. Fix PostgREST docker-compose to use port 3001
echo "📝 Step 1: Updating PostgREST config to use port 3001..."
cat > docker-compose.postgrest.yml << 'EOF'
version: '3.8'

services:
  postgrest:
    image: postgrest/postgrest:latest
    container_name: healthscribe-postgrest-1
    ports:
      - "3001:3000"
    environment:
      PGRST_DB_URI: postgres://postgres:secure_password_2024@localhost:5432/postgres
      PGRST_DB_SCHEMA: public
      PGRST_DB_ANON_ROLE: postgres
      PGRST_JWT_SECRET: your-super-secret-jwt-token-with-at-least-32-characters-long
      PGRST_OPENAPI_SERVER_PROXY_URI: https://healthscribe.pro
    restart: unless-stopped
EOF

# 2. Fix nginx config to proxy /rest/ to port 3001
echo "🔧 Step 2: Updating nginx config for correct REST API routing..."
cat > /etc/nginx/sites-available/healthscribe.pro << 'EOF'
server {
    listen 80;
    server_name healthscribe.pro www.healthscribe.pro;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name healthscribe.pro www.healthscribe.pro;

    ssl_certificate /etc/letsencrypt/live/healthscribe.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/healthscribe.pro/privkey.pem;

    # SSL security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept' always;

    # Main app proxy - Next.js on port 3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Auth service proxy - port 9999
    location /auth/ {
        proxy_pass http://localhost:9999/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;

        # CORS for auth endpoints
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept' always;
    }

    # REST API proxy - PostgREST on port 3001
    location /rest/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;

        # CORS for API endpoints
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, apikey' always;
    }
}
EOF

# 3. Start PostgREST on port 3001
echo "🚀 Step 3: Starting PostgREST on port 3001..."
sudo docker-compose -f docker-compose.postgrest.yml down 2>/dev/null || true
sudo docker-compose -f docker-compose.postgrest.yml up -d

# 4. Wait for PostgREST to start
echo "⏳ Step 4: Waiting for PostgREST to start..."
sleep 5

# 5. Reload nginx
echo "🔄 Step 5: Reloading nginx configuration..."
sudo nginx -t && sudo systemctl reload nginx

# 6. Check all services
echo "📊 Step 6: Checking service status..."
echo "--- Docker Services ---"
sudo docker ps
echo ""
echo "--- Port Usage ---"
sudo netstat -tulpn | grep -E "(3000|3001|9999)"
echo ""
echo "--- PM2 Services ---"
pm2 status

echo ""
echo "🎉 CONFIGURATION FIXED!"
echo "======================"
echo "✅ Next.js: http://localhost:3000 (nginx /)"
echo "✅ Auth Service: http://localhost:9999 (nginx /auth/)"
echo "✅ PostgREST: http://localhost:3001 (nginx /rest/)"
echo ""
echo "🌐 Test URLs:"
echo "  Main Site: https://healthscribe.pro"
echo "  Auth Health: https://healthscribe.pro/auth/v1/health"
echo "  REST API: https://healthscribe.pro/rest/"