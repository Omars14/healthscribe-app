#!/bin/bash
echo "🔧 FIXING AUTH SERVICE ENDPOINT PATH"
echo "===================================="

cd /var/www/healthscribe

echo "📝 Current auth service endpoints:"
grep -n "app.get.*health" auth-service.js

echo ""
echo "🔧 Fixing endpoint path from /auth/v1/health to /v1/health..."

# Fix the endpoint path
sed -i 's|app.get('\''/auth/v1/health|app.get('\''/v1/health|g' auth-service.js

echo "✅ Endpoint path fixed!"

echo "🔄 Restarting auth service..."
pm2 restart auth-service

echo "⏳ Waiting for restart..."
sleep 3

echo "🧪 Testing fixed endpoint..."
echo "Testing /auth/v1/health:"
curl -s -k https://healthscribe.pro/auth/v1/health

echo ""
echo "✅ Auth service endpoint fix complete!"


