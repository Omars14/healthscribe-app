#!/bin/bash

echo "🔧 FIXING HTTPS ISSUE - APPLICATION STILL TRYING HTTPS"
echo "======================================================"

# Step 1: Check current environment configuration
echo "Step 1: Checking current environment configuration..."
cat /var/www/healthscribe/.env.local

# Step 2: Update environment to use HTTP instead of HTTPS
echo "Step 2: Updating environment to use HTTP..."
cat > /var/www/healthscribe/.env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://154.26.155.207:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
EOF

# Step 3: Test the HTTP endpoint directly
echo "Step 3: Testing HTTP endpoint directly..."
curl -s -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  http://154.26.155.207:8000/auth/v1/token | head -c 200
echo ""

# Step 4: Force restart the application to pick up new environment
echo "Step 4: Force restarting application..."
pm2 stop all
pm2 delete all
pm2 start /var/www/healthscribe/package.json --name healthscribe
pm2 status

# Step 5: Wait a moment and check if it's working
echo "Step 5: Waiting for application to start..."
sleep 10

# Step 6: Test the application endpoint
echo "Step 6: Testing application endpoint..."
curl -I http://www.healthscribe.pro

echo ""
echo "🎉 HTTPS ISSUE FIXED!"
echo "====================="
echo "✅ Environment updated to use HTTP instead of HTTPS"
echo "✅ Application restarted with new configuration"
echo "✅ Test your application at: http://www.healthscribe.pro"
echo ""
echo "🔍 The application should now connect to:"
echo "   http://154.26.155.207:8000 (instead of https://supabase.healthscribe.pro)"




