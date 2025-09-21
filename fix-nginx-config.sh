#!/bin/bash

# Fix nginx configuration to work without SSL certificates

echo "🔧 Fixing nginx configuration..."

# Create a simple HTTP-only configuration
cat > /etc/nginx/sites-available/www.healthscribe.pro << 'EOF'
server {
    listen 80;
    server_name www.healthscribe.pro;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Main application
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
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/www.healthscribe.pro /etc/nginx/sites-enabled/

# Remove any other problematic configs
rm -f /etc/nginx/sites-enabled/supabase.healthscribe.pro
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    echo "🚀 Starting nginx..."
    systemctl restart nginx
    systemctl status nginx --no-pager
    echo "✅ Nginx is now running!"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

echo ""
echo "🎉 Nginx configuration fixed!"
echo "Your application will be accessible at: http://www.healthscribe.pro"
echo "SSL certificates can be added later with: certbot --nginx -d www.healthscribe.pro"




