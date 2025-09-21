#!/bin/bash
echo "🔧 FINAL NGINX STATIC FILE FIX"
echo "=============================="

cd /var/www/healthscribe

echo "1. Creating new Nginx configuration..."
sudo cat > /etc/nginx/sites-available/healthscribe.pro << 'EOF'
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

    # Static files for Next.js - HIGHEST PRIORITY
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Static assets
    location /static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Auth service proxy
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

    # REST API proxy
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

    # Main app proxy - LOWEST PRIORITY (catch-all)
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
}
EOF

echo "2. Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid"
    echo "3. Reloading Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully"

    echo ""
    echo "4. Testing static file serving..."
    sleep 2
    curl -s -I https://healthscribe.pro/_next/static/chunks/2478-f63b236ada49e3c3.js | head -3

    echo ""
    echo "5. Testing homepage..."
    curl -s https://healthscribe.pro | head -1

    echo ""
    echo "✅ NGINX STATIC FILE FIX COMPLETE!"
else
    echo "❌ Nginx config has errors"
    exit 1
fi