#!/bin/bash

echo "🚀 Fix HTTPS to HTTP and Restart"
echo "================================"
echo ""

# Make script executable
chmod +x fix-https-to-http.js

# Fix the HTTPS to HTTP configuration
echo "🔧 Fixing HTTPS to HTTP configuration..."
node fix-https-to-http.js

echo ""
echo "🧪 Testing HTTP endpoints..."

# Make test script executable and run it
if [ -f "test-http-endpoints.sh" ]; then
    chmod +x test-http-endpoints.sh
    ./test-http-endpoints.sh
else
    echo "❌ test-http-endpoints.sh not found"
fi

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
echo "🎉 HTTPS to HTTP fix completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Test your application at http://www.healthscribe.pro"
echo "2. Test login functionality - should now work without SSL errors!"
echo "3. The app will use self-hosted Supabase at http://supabase.healthscribe.pro (HTTP)"
echo ""
echo "💡 The SSL certificate error should now be resolved:"
echo "   - Changed from https://supabase.healthscribe.pro to http://supabase.healthscribe.pro"
echo "   - No more SSL certificate validation issues"
echo "   - Login should work properly now"
echo ""
echo "🔍 If login still doesn't work, check:"
echo "   - Browser console for any remaining errors"
echo "   - Test HTTP endpoints: curl http://supabase.healthscribe.pro/auth/v1/token"
echo "   - Check Nginx logs: sudo tail -f /var/log/nginx/error.log"




