#!/bin/bash
echo "🔧 FIXING AUTH SERVICE ENDPOINT"
echo "================================"

cd /var/www/healthscribe

echo "📝 Checking current auth service code..."
tail -30 auth-service.js

echo ""
echo "🔧 Adding /v1/health endpoint..."
cat >> auth-service.js << 'EOF'

// Health check endpoints
app.get('/v1/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

EOF

echo "✅ Endpoint added."

echo "🔄 Restarting auth service..."
pm2 restart auth-service

echo "⏳ Waiting for restart..."
sleep 3

echo "🧪 Testing endpoints..."
echo "Testing /auth/health:"
curl -s -k https://healthscribe.pro/auth/health
echo ""

echo "Testing /auth/v1/health:"
curl -s -k https://healthscribe.pro/auth/v1/health
echo ""

echo "✅ Auth service endpoint fix complete!"


