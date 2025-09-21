#!/bin/bash
echo "🔧 FINAL POSTGREST DATABASE FIX"
echo "==============================="

cd /var/www/healthscribe

echo "1. Updating PostgREST configuration..."
cat > docker-compose.postgrest.yml << 'EOF'
version: '3.8'

services:
  postgrest:
    image: postgrest/postgrest:latest
    container_name: healthscribe-postgrest-1
    ports:
      - "3001:3000"
    environment:
      PGRST_DB_URI: postgres://postgres:secure_password_2024@host.docker.internal:5432/postgres
      PGRST_DB_SCHEMA: public
      PGRST_DB_ANON_ROLE: postgres
      PGRST_JWT_SECRET: your-super-secret-jwt-token-with-at-least-32-characters-long
      PGRST_OPENAPI_SERVER_PROXY_URI: https://healthscribe.pro
    restart: unless-stopped
    extra_hosts:
      - "host.docker.internal:host-gateway"
EOF

echo "✅ Configuration updated with host.docker.internal"

echo ""
echo "2. Restarting PostgREST..."
docker rm -f healthscribe-postgrest-1
docker-compose -f docker-compose.postgrest.yml up -d

echo "⏳ Waiting for startup..."
sleep 5

echo ""
echo "3. Testing REST API..."
curl -s -k https://healthscribe.pro/rest/

echo ""
echo "✅ PostgREST fix complete!"


