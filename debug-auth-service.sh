#!/bin/bash

echo "🔧 DEBUGGING AUTH SERVICE - FINDING THE REAL ISSUE"
echo "=================================================="

# Function to check if a command succeeded
check_error() {
    if [ $? -ne 0 ]; then
        echo "❌ Error occurred in step: $1"
        echo "Please check the logs above and fix the issue before continuing."
        exit 1
    fi
}

# Step 1: Check what's actually running on port 9999
echo "Step 1: Checking what's running on port 9999..."
netstat -tlnp | grep :9999
echo ""

# Step 2: Test different auth endpoints
echo "Step 2: Testing different auth endpoints..."

echo "Testing GET /token (might fail with 405):"
curl -s -w "HTTP Status: %{http_code}\n" http://localhost:9999/token
echo ""

echo "Testing POST /token (correct method for auth):"
curl -s -w "HTTP Status: %{http_code}\n" -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  http://localhost:9999/token
echo ""

echo "Testing GET /health (if available):"
curl -s -w "HTTP Status: %{http_code}\n" http://localhost:9999/health
echo ""

echo "Testing GET / (root endpoint):"
curl -s -w "HTTP Status: %{http_code}\n" http://localhost:9999/
echo ""

# Step 3: Check auth service logs
echo "Step 3: Checking auth service logs..."
docker logs supabase-auth --tail 20
echo ""

# Step 4: Check auth service environment variables
echo "Step 4: Checking auth service environment..."
docker exec supabase-auth env | grep -E "(GOTRUE|API_EXTERNAL|JWT|DB)" | head -10
echo ""

# Step 5: Check if auth service is properly connected to database
echo "Step 5: Testing database connectivity from auth service..."
docker exec supabase-auth sh -c "
echo 'Testing database connection...'
PGPASSWORD='your-super-secret-and-long-postgres-password' psql -h 172.17.0.1 -U postgres -d postgres -c 'SELECT 1;' 2>/dev/null && echo '✅ Database connection successful' || echo '❌ Database connection failed'
"
echo ""

# Step 6: Check auth service configuration
echo "Step 6: Checking auth service configuration..."
docker inspect supabase-auth | jq -r '.[0].Config.Env[]' | grep -E "(GOTRUE|API|JWT|DB)" | head -10
echo ""

# Step 7: Test with proper Supabase auth API format
echo "Step 7: Testing with proper Supabase auth format..."
curl -s -w "HTTP Status: %{http_code}\n" -X POST \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  -d '{"email":"test@example.com","password":"test123","grant_type":"password"}' \
  http://localhost:9999/token?grant_type=password
echo ""

echo "🎯 DEBUGGING COMPLETE!"
echo "====================="
echo ""
echo "📋 Based on the results above, here's what I found:"
echo ""
echo "🔍 Most likely issues:"
echo "1. Auth service expects POST requests, not GET"
echo "2. Missing proper headers (apikey, Content-Type)"
echo "3. Database connection might be failing"
echo "4. Auth service configuration might be incomplete"
echo ""
echo "💡 Next steps:"
echo "1. If the service is responding but with 405, use POST method"
echo "2. If database connection fails, restart the auth service"
echo "3. If configuration is wrong, recreate the auth service"




