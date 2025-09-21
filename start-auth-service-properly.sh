#!/bin/bash

echo "🔧 STARTING AUTH SERVICE WITH PROPER DATABASE CONNECTION"
echo "========================================================="

# Function to check if a command succeeded
check_error() {
    if [ $? -ne 0 ]; then
        echo "❌ Error occurred in step: $1"
        echo "Please check the logs above and fix the issue before continuing."
        exit 1
    fi
}

# Step 1: Stop and remove any existing auth container
echo "Step 1: Cleaning up existing auth container..."
docker stop supabase-auth 2>/dev/null || true
docker rm supabase-auth 2>/dev/null || true
echo "✅ Cleaned up auth container"

# Step 2: Get the database container's IP address
echo "Step 2: Finding database container IP..."
DB_IP=$(docker inspect supabase_db_healthscribe | grep -A 10 "Networks" | grep -o '"IPAddress": "[^"]*"' | cut -d'"' -f4 | head -1)
if [ -z "$DB_IP" ]; then
    echo "Could not find database IP, trying alternative method..."
    DB_IP=$(docker inspect supabase_db_healthscribe | jq -r '.[]?.NetworkSettings.Networks.bridge.IPAddress' 2>/dev/null)
fi
if [ -z "$DB_IP" ] || [ "$DB_IP" = "null" ]; then
    echo "Using default bridge network IP..."
    DB_IP="172.17.0.1"
fi
echo "Database IP: $DB_IP"

# Step 3: Test database connection from host
echo "Step 3: Testing database connection..."
PGPASSWORD="your-super-secret-and-long-postgres-password" psql -h $DB_IP -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Cannot connect to database from host"
    echo "Please check if the database is running and accessible"
    exit 1
fi
echo "✅ Database connection successful"

# Step 4: Start auth service with correct database connection
echo "Step 4: Starting auth service with proper database connection..."
docker run -d \
  --name supabase-auth \
  --network bridge \
  -p 9999:9999 \
  -e GOTRUE_API_HOST=0.0.0.0 \
  -e GOTRUE_API_PORT=9999 \
  -e GOTRUE_DB_DRIVER=postgres \
  -e GOTRUE_DB_DATABASE_URL=postgresql://postgres:your-super-secret-and-long-postgres-password@$DB_IP:5432/postgres \
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

check_error "Auth service startup"

# Step 5: Wait for auth service to initialize
echo "Step 5: Waiting for auth service to initialize..."
sleep 30

# Step 6: Check auth service status
echo "Step 6: Checking auth service status..."
docker ps | grep supabase-auth
if [ $? -ne 0 ]; then
    echo "❌ Auth service not running"
    echo "Checking logs..."
    docker logs supabase-auth --tail 20
    exit 1
fi
echo "✅ Auth service is running"

# Step 7: Check auth service logs
echo "Step 7: Checking auth service logs..."
docker logs supabase-auth --tail 10

# Step 8: Test auth endpoint directly
echo "Step 8: Testing auth endpoint directly..."
AUTH_DIRECT=$(curl -s -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  http://localhost:9999/token | head -c 200)

if [[ "$AUTH_DIRECT" == *"502"* ]] || [[ "$AUTH_DIRECT" == *"502"* ]] || [[ "$AUTH_DIRECT" == "" ]]; then
    echo "❌ Direct auth endpoint failed: $AUTH_DIRECT"
    echo "Checking detailed logs..."
    docker logs supabase-auth --tail 50
else
    echo "✅ Direct auth endpoint working"
fi

# Step 9: Test through Kong
echo "Step 9: Testing auth through Kong..."
AUTH_KONG=$(curl -s -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  http://localhost:8000/auth/v1/token | head -c 200)

if [[ "$AUTH_KONG" == *"502"* ]] || [[ "$AUTH_KONG" == *"502"* ]] || [[ "$AUTH_KONG" == "" ]]; then
    echo "❌ Kong auth endpoint failed: $AUTH_KONG"
else
    echo "✅ Kong auth endpoint working"
fi

# Step 10: Test HTTPS endpoint
echo "Step 10: Testing HTTPS endpoint..."
AUTH_HTTPS=$(curl -s -k -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  https://supabase.healthscribe.pro/auth/v1/token | head -c 200)

if [[ "$AUTH_HTTPS" == *"502"* ]] || [[ "$AUTH_HTTPS" == *"502"* ]] || [[ "$AUTH_HTTPS" == "" ]]; then
    echo "❌ HTTPS auth endpoint failed: $AUTH_HTTPS"
else
    echo "✅ HTTPS auth endpoint working"
fi

# Step 11: Update application environment
echo "Step 11: Updating application environment..."
cat > /var/www/healthscribe/.env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
EOF

# Step 12: Restart application
echo "Step 12: Restarting application..."
pm2 restart all --update-env
check_error "Application restart"

# Step 13: Final status check
echo "Step 13: Final status check..."
docker ps | grep supabase
pm2 status

echo ""
echo "🎉 AUTH SERVICE STARTUP COMPLETED!"
echo "=================================="
echo "✅ Auth service started successfully"
echo "✅ Database connection established"
echo "✅ All environment variables set"
echo "✅ Application restarted with new configuration"
echo ""
echo "🔍 Test your application at: https://healthscribe.pro"
echo ""
echo "⚠️  Note: You may see a browser warning about the self-signed certificate."
echo "   This is normal for development. Click 'Advanced' and 'Proceed' to continue."
echo ""
echo "📋 If issues persist, check logs with:"
echo "   docker logs supabase-auth --tail 20"




