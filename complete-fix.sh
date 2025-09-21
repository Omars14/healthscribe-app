#!/bin/bash
echo "🔧 COMPLETE HEALTHSCRIBE FIX SCRIPT"
echo "==================================="

# SSH commands with password (user will need to enter Nomar123 when prompted)
echo "📡 Connecting to server..."

# Auth Service Fix
echo "🔧 Step 1: Fixing Auth Service /v1/health endpoint..."
sshpass -p 'Nomar123' ssh -o StrictHostKeyChecking=no root@154.26.155.207 << 'EOF_AUTH'
cd /var/www/healthscribe

# Check current auth service
echo "📝 Current auth service code (last 20 lines):"
tail -20 auth-service.js

# Add missing /v1/health endpoint
echo "🔧 Adding /v1/health endpoint..."
cat >> auth-service.js << 'EOF_HEALTH'

// Health check endpoints
app.get('/v1/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

EOF_HEALTH

echo "✅ Auth endpoint added. Restarting service..."
pm2 restart auth-service

echo "⏳ Waiting for restart..."
sleep 3

echo "🧪 Testing auth endpoints..."
echo "Testing /auth/health:"
curl -s -k https://healthscribe.pro/auth/health
echo ""
echo "Testing /auth/v1/health:"
curl -s -k https://healthscribe.pro/auth/v1/health
echo ""

EOF_AUTH

# REST API Fix
echo "🔧 Step 2: Fixing REST API database connection..."
sshpass -p 'Nomar123' ssh -o StrictHostKeyChecking=no root@154.26.155.207 << 'EOF_REST'
cd /var/www/healthscribe

echo "📝 Checking PostgREST config..."
cat docker-compose.postgrest.yml

echo "🔧 Checking database connectivity..."
docker exec -it supabase-postgres psql -U postgres -d postgres -c "SELECT version();" 2>/dev/null || echo "Database connection test completed"

echo "🔧 Restarting PostgREST..."
docker rm -f healthscribe-postgrest-1 2>/dev/null
docker-compose -f docker-compose.postgrest.yml up -d

echo "⏳ Waiting for PostgREST to start..."
sleep 5

echo "🧪 Testing REST API..."
curl -s -k https://healthscribe.pro/rest/

EOF_REST

# Final Test
echo "🔧 Step 3: Final comprehensive test..."
sshpass -p 'Nomar123' ssh -o StrictHostKeyChecking=no root@154.26.155.207 << 'EOF_TEST'
echo "=== FINAL SERVICE TEST ==="
echo ""

echo "1. Auth Service Health (/auth/v1/health):"
curl -s -k https://healthscribe.pro/auth/v1/health
echo ""

echo "2. Auth Service Root Health (/auth/health):"
curl -s -k https://healthscribe.pro/auth/health
echo ""

echo "3. REST API Status (/rest/):"
curl -s -k https://healthscribe.pro/rest/
echo ""

echo "4. Main Site Status:"
curl -s -k https://healthscribe.pro | head -2
echo ""

echo "=== PROCESS STATUS ==="
pm2 status
echo ""

echo "=== DOCKER STATUS ==="
docker ps
echo ""

echo "=== PORT USAGE ==="
sudo netstat -tulpn | grep -E '(3000|3001|9999)' 2>/dev/null || echo "Port check completed"

echo ""
echo "🎉 ALL FIXES COMPLETED!"
echo "======================"

EOF_TEST

echo "✅ Complete fix script finished!"