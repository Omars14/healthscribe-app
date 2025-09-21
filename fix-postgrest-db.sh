#!/bin/bash
echo "🔧 FIXING POSTGREST DATABASE CONNECTION"
echo "======================================="

cd /var/www/healthscribe

echo "📝 Checking current PostgREST config..."
cat docker-compose.postgrest.yml

echo ""
echo "🔧 Checking database connectivity..."
docker exec -it supabase-postgres psql -U postgres -d postgres -c "SELECT version();"

echo ""
echo "🔧 Checking PostgREST container logs..."
docker logs healthscribe-postgrest-1 --tail 10

echo ""
echo "🔧 Restarting PostgREST with fresh connection..."
docker rm -f healthscribe-postgrest-1
docker-compose -f docker-compose.postgrest.yml up -d

echo "⏳ Waiting for PostgREST to start..."
sleep 5

echo "🧪 Testing REST API..."
curl -s -k https://healthscribe.pro/rest/
echo ""

echo "✅ PostgREST database fix complete!"


