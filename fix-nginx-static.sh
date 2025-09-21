#!/bin/bash
echo "🔧 FIXING NGINX STATIC FILE CONFIGURATION"
echo "========================================="

cd /var/www/healthscribe

echo "1. Current Nginx configuration (static files section):"
grep -A 10 -B 5 "_next\|static" /etc/nginx/sites-available/healthscribe.pro
echo ""

echo "2. Adding static file handling before the main location block..."
sudo sed -i '/location \/ {/i\
# Static files for Next.js\
    location /_next/static/ {\
        proxy_pass http://localhost:3000;\
        expires 1y;\
        add_header Cache-Control "public, immutable";\
    }\
\
    # Static assets\
    location /static/ {\
        proxy_pass http://localhost:3000;\
        expires 1y;\
        add_header Cache-Control "public, immutable";\
    }\
' /etc/nginx/sites-available/healthscribe.pro

echo ""
echo "3. Updated Nginx configuration:"
grep -A 15 "_next\|static\|location /" /etc/nginx/sites-available/healthscribe.pro
echo ""

echo "4. Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid"
    echo "5. Reloading Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Nginx config has errors"
    exit 1
fi

echo ""
echo "6. Testing static file serving..."
curl -s -I https://healthscribe.pro/_next/static/chunks/2478-f63b236ada49e3c3.js | head -3

echo ""
echo "✅ STATIC FILE CONFIGURATION COMPLETE!"


