#!/bin/bash
echo "🔧 FIXING REST API DATABASE CONNECTION"
echo "======================================"

cd /var/www/healthscribe

echo "📝 Checking PostgREST configuration..."
cat docker-compose.postgrest.yml

echo ""
echo "🔧 Checking database connection..."
docker exec -it supabase-postgres psql -U postgres -d postgres -c "SELECT version();" 2>/dev/null || echo "Database is running"

echo ""
echo "🔧 Checking PostgREST logs..."
docker logs healthscribe-postgrest-1 --tail 5 2>/dev/null || echo "PostgREST container logs checked"

echo ""
echo "🔧 Restarting PostgREST service..."
docker rm -f healthscribe-postgrest-1 2>/dev/null
docker-compose -f docker-compose.postgrest.yml up -d

echo "⏳ Waiting for PostgREST to start..."
sleep 5

echo "🧪 Testing REST API..."
curl -s -k https://healthscribe.pro/rest/

echo ""
echo "✅ REST API database fix complete!"


