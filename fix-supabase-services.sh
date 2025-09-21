#!/bin/bash

echo "🚀 Fix Supabase Services"
echo "========================"
echo ""

# Make script executable
chmod +x diagnose-supabase.js

# Diagnose Supabase services
echo "🔍 Diagnosing Supabase services..."
node diagnose-supabase.js

echo ""
echo "🧪 Testing current Supabase services..."

# Make test script executable and run it
if [ -f "test-supabase.sh" ]; then
    chmod +x test-supabase.sh
    ./test-supabase.sh
else
    echo "❌ test-supabase.sh not found"
fi

echo ""
echo "🔄 Restarting Supabase services..."

# Make restart script executable and run it
if [ -f "restart-supabase.sh" ]; then
    chmod +x restart-supabase.sh
    ./restart-supabase.sh
else
    echo "❌ restart-supabase.sh not found"
    echo "Trying to restart manually..."
    
    # Stop Supabase
    echo "🛑 Stopping Supabase containers..."
    docker-compose down
    
    # Wait a moment
    sleep 5
    
    # Start Supabase
    echo "🚀 Starting Supabase services..."
    docker-compose up -d
    
    # Wait for services to start
    echo "⏳ Waiting for services to start..."
    sleep 15
    
    # Check status
    echo "🔍 Checking service status..."
    docker ps | grep supabase
fi

echo ""
echo "🧪 Testing Supabase services after restart..."

# Test each service
echo "Testing auth service (port 9999)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:9999/auth/v1/token | grep -q "400\|401\|405"; then
    echo "✅ Auth service is accessible"
else
    echo "❌ Auth service is not accessible"
    echo "Trying to check if it's running..."
    docker logs supabase_auth_healthscribe --tail 10
fi

echo "Testing REST API (port 3000)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/rest/v1/ | grep -q "200\|401"; then
    echo "✅ REST API is accessible"
else
    echo "❌ REST API is not accessible"
    echo "Trying to check if it's running..."
    docker logs supabase_rest_healthscribe --tail 10
fi

echo "Testing storage API (port 5000)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/storage/v1/ | grep -q "200\|401"; then
    echo "✅ Storage API is accessible"
else
    echo "❌ Storage API is not accessible"
    echo "Trying to check if it's running..."
    docker logs supabase_storage_healthscribe --tail 10
fi

echo ""
echo "🔍 Checking Docker container logs for errors..."

# Check logs for any errors
echo "Auth service logs:"
docker logs supabase_auth_healthscribe --tail 5

echo -e "\nREST API logs:"
docker logs supabase_rest_healthscribe --tail 5

echo -e "\nStorage API logs:"
docker logs supabase_storage_healthscribe --tail 5

echo ""
echo "🔄 Restarting application services..."

# Restart the application using PM2
if command -v pm2 &> /dev/null; then
    echo "📱 Restarting with PM2..."
    pm2 restart all
    pm2 status
    
    # Wait a moment for the application to start
    echo "⏳ Waiting for application to start..."
    sleep 5
    
    # Check if the application is running
    if pm2 list | grep -q "online"; then
        echo "✅ Application is running successfully!"
    else
        echo "⚠️  Application might not be running properly. Check PM2 status."
    fi
else
    echo "⚠️  PM2 not found. Please restart your application manually."
fi

echo ""
echo "🎉 Supabase services fix completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Test your application at http://www.healthscribe.pro"
echo "2. Test login functionality"
echo "3. If login still doesn't work, check the browser console for errors"
echo ""
echo "💡 If services are still not accessible, we may need to:"
echo "   - Use the fixed Docker Compose configuration"
echo "   - Check if there are port conflicts"
echo "   - Verify Supabase configuration files"
echo ""
echo "🔍 To debug further:"
echo "   - Check Supabase logs: docker-compose logs"
echo "   - Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   - Test services directly: curl http://localhost:9999/auth/v1/token"




