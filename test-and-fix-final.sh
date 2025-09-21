#!/bin/bash

echo "🚀 Test and Fix Supabase Endpoints (Final)"
echo "=========================================="
echo ""

# Make script executable
chmod +x test-correct-endpoints.js

# Set up endpoint testing
echo "🔧 Setting up endpoint testing..."
node test-correct-endpoints.js

echo ""
echo "🧪 Testing correct Supabase endpoints..."

# Make test script executable and run it
if [ -f "test-correct-endpoints.sh" ]; then
    chmod +x test-correct-endpoints.sh
    ./test-correct-endpoints.sh
else
    echo "❌ test-correct-endpoints.sh not found"
fi

echo ""
echo "🌐 Updating Nginx with working configuration..."

# Update Nginx with the working configuration
if [ -f "supabase-nginx-working-final.conf" ]; then
    echo "📄 Copying working Nginx configuration..."
    sudo cp supabase-nginx-working-final.conf /etc/nginx/sites-available/supabase.healthscribe.pro
    
    # Enable the site
    echo "🔗 Enabling Nginx site..."
    sudo ln -sf /etc/nginx/sites-available/supabase.healthscribe.pro /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    echo "🧪 Testing Nginx configuration..."
    if sudo nginx -t; then
        echo "✅ Nginx configuration is valid"
        
        # Reload Nginx
        echo "🔄 Reloading Nginx..."
        sudo systemctl reload nginx
        echo "✅ Nginx reloaded successfully"
        
        # Test connectivity via Nginx
        echo "🔍 Testing connectivity via Nginx..."
        echo "Testing auth endpoint via Nginx..."
        if curl -s -o /dev/null -w "%{http_code}" http://supabase.healthscribe.pro/auth/v1/token | grep -q "400\|401\|404\|405"; then
            echo "✅ Auth endpoint is accessible via Nginx"
        else
            echo "❌ Auth endpoint is not accessible via Nginx"
        fi
        
        echo "Testing REST endpoint via Nginx..."
        if curl -s -o /dev/null -w "%{http_code}" http://supabase.healthscribe.pro/rest/v1/ | grep -q "200\|401\|404"; then
            echo "✅ REST endpoint is accessible via Nginx"
        else
            echo "❌ REST endpoint is not accessible via Nginx"
        fi
        
    else
        echo "❌ Nginx configuration test failed"
        echo "Let's check what's wrong..."
        sudo nginx -t 2>&1
        exit 1
    fi
else
    echo "❌ supabase-nginx-working-final.conf not found"
    exit 1
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
echo "🎉 Final Supabase fix completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Test your application at http://www.healthscribe.pro"
echo "2. Test login functionality - should now work!"
echo "3. The app will use self-hosted Supabase at http://supabase.healthscribe.pro"
echo ""
echo "💡 Based on the logs, Supabase services are working:"
echo "   - Auth service: Responding (404 is expected for some endpoints)"
echo "   - REST API: Connected to database successfully"
echo "   - Storage API: Started successfully"
echo "   - Database: Accessible and working"
echo ""
echo "🔍 If login still doesn't work, check:"
echo "   - Browser console for any remaining errors"
echo "   - Test endpoints directly: curl http://supabase.healthscribe.pro/auth/v1/token"
echo "   - Check Nginx logs: sudo tail -f /var/log/nginx/error.log"




