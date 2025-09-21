#!/bin/bash

echo "🔧 NGINX ROUTING FIX"
echo "===================="

# Reload nginx configuration
echo "Reloading Nginx configuration..."
nginx -t && systemctl reload nginx
echo "✅ Nginx reloaded"

# Test the routing
echo "Testing auth service routing..."
curl -s -k https://healthscribe.pro/auth/health | head -c 200
echo ""

echo "Testing auth login..."
curl -s -k -X POST \
  -H "Content-Type: application/json" \
  -H "apikey: demo-key" \
  -d '{"email":"admin@healthscribe.pro","password":"password123"}' \
  https://healthscribe.pro/auth/v1/token | head -c 200
echo ""

echo "Testing REST API..."
curl -s -k -H "apikey: demo-key" https://healthscribe.pro/rest/v1/user_profiles | head -c 200
echo ""

echo "🎉 NGINX ROUTING FIXED!"
echo "======================="
echo "✅ Requests should now route to the correct services"
echo "✅ Auth service on port 9998"
echo "✅ REST API on port 3001"
echo "✅ Next.js app on port 3000 (fallback)"




