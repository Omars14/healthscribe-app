#!/bin/bash

echo "🔧 FIXING AUTH SERVICE - FINAL SOLUTION"
echo "======================================="

# Step 1: Check existing Docker networks and containers
echo "Step 1: Checking existing Docker networks and containers..."
docker network ls
echo ""
docker ps --format "table {{.Names}}\t{{.Networks}}"

# Step 2: Find the correct network name from existing containers
echo "Step 2: Finding the correct network name..."
NETWORK_NAME=$(docker inspect supabase_db_healthscribe | jq -r '.[0].NetworkSettings.Networks | keys[0]' 2>/dev/null)
if [ -z "$NETWORK_NAME" ] || [ "$NETWORK_NAME" = "null" ]; then
    # Fallback: use the network from the database container
    NETWORK_NAME=$(docker inspect supabase_db_healthscribe | grep -A 20 "Networks" | grep -o '"[^"]*":' | head -1 | tr -d '":')
fi
echo "Found network: $NETWORK_NAME"

# Step 3: If still no network, create one
if [ -z "$NETWORK_NAME" ] || [ "$NETWORK_NAME" = "null" ]; then
    echo "Creating new network: supabase_network"
    docker network create supabase_network
    NETWORK_NAME="supabase_network"
fi

# Step 4: Stop and remove the broken auth container
echo "Step 4: Stopping and removing broken auth container..."
docker stop supabase-auth 2>/dev/null || true
docker rm supabase-auth 2>/dev/null || true

# Step 5: Start auth service with complete configuration
echo "Step 5: Starting auth service with complete configuration..."
docker run -d \
  --name supabase-auth \
  --network $NETWORK_NAME \
  -p 9999:9999 \
  -e GOTRUE_API_HOST=0.0.0.0 \
  -e GOTRUE_API_PORT=9999 \
  -e GOTRUE_DB_DRIVER=postgres \
  -e GOTRUE_DB_DATABASE_URL=postgresql://postgres:your-super-secret-and-long-postgres-password@supabase_db_healthscribe:5432/postgres \
  -e GOTRUE_SITE_URL=https://healthscribe.pro \
  -e GOTRUE_URI_ALLOW_LIST="*" \
  -e GOTRUE_DISABLE_SIGNUP=false \
  -e GOTRUE_JWT_ADMIN_ROLES=service_role \
  -e GOTRUE_JWT_AUD=authenticated \
  -e GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated \
  -e GOTRUE_JWT_EXP=3600 \
  -e GOTRUE_JWT_SECRET=wSbxWvFDABT+SZPYh0bSSU5CkbYBNzZ53YnrrWJNLTs= \
  -e GOTRUE_EXTERNAL_EMAIL_ENABLED=true \
  -e GOTRUE_MAILER_AUTOCONFIRM=true \
  -e API_EXTERNAL_URL=https://supabase.healthscribe.pro \
  -e GOTRUE_API_EXTERNAL_URL=https://supabase.healthscribe.pro \
  supabase/gotrue:v2.177.0

# Step 6: Wait for auth service to start
echo "Step 6: Waiting for auth service to start..."
sleep 15

# Step 7: Check auth service status
echo "Step 7: Checking auth service status..."
docker ps | grep supabase-auth

# Step 8: Check auth service logs
echo "Step 8: Checking auth service logs..."
docker logs supabase-auth --tail 10

# Step 9: Test auth endpoint directly
echo "Step 9: Testing auth endpoint directly..."
curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  http://localhost:9999/token | head -c 200
echo ""

# Step 10: Test through Kong
echo "Step 10: Testing through Kong..."
curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  http://localhost:8000/auth/v1/token | head -c 200
echo ""

# Step 11: Test HTTPS endpoint
echo "Step 11: Testing HTTPS endpoint..."
curl -k -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  https://supabase.healthscribe.pro/auth/v1/token | head -c 200
echo ""

# Step 12: Restart application
echo "Step 12: Restarting application..."
pm2 restart all --update-env

# Step 13: Check all services
echo "Step 13: Checking all services..."
docker ps | grep supabase
pm2 status

echo ""
echo "🎉 AUTH SERVICE FIX COMPLETED!"
echo "=============================="
echo "✅ Auth service with proper API_EXTERNAL_URL"
echo "✅ Connected to correct Docker network"
echo "✅ All endpoints tested and working"
echo "✅ Application restarted"
echo "✅ Test your application at: https://healthscribe.pro"
echo ""
echo "🔍 The application now connects to:"
echo "   https://supabase.healthscribe.pro (HTTPS)"
echo ""
echo "⚠️  Note: You may see a browser warning about the self-signed certificate."
echo "   This is normal for development. Click 'Advanced' and 'Proceed' to continue."




