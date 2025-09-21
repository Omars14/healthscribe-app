#!/bin/bash

echo "🚀 Fix Nginx Configuration and Test"
echo "==================================="
echo ""

# Make script executable
chmod +x fix-nginx-ssl.js

# Fix the Nginx configuration
echo "🔧 Fixing Nginx configuration..."
node fix-nginx-ssl.js

echo ""
echo "🌐 Setting up HTTP-only Nginx configuration..."

# Remove the broken SSL configuration
echo "🗑️  Removing broken SSL configuration..."
sudo rm -f /etc/nginx/sites-enabled/supabase.healthscribe.pro

# Copy the HTTP-only configuration
if [ -f "supabase-nginx-http.conf" ]; then
    echo "📄 Copying HTTP-only Nginx configuration..."
    sudo cp supabase-nginx-http.conf /etc/nginx/sites-available/supabase.healthscribe.pro
    
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
    else
        echo "❌ Nginx configuration test failed"
        echo "Please check the configuration manually"
        exit 1
    fi
else
    echo "❌ supabase-nginx-http.conf not found"
    exit 1
fi

echo ""
echo "🔍 Testing Supabase connectivity..."

# Test if Supabase is accessible via HTTP
echo "Testing HTTP access to supabase.healthscribe.pro..."
if curl -s -o /dev/null -w "%{http_code}" http://supabase.healthscribe.pro/health | grep -q "200"; then
    echo "✅ Supabase is accessible via HTTP"
else
    echo "⚠️  Supabase might not be accessible via HTTP yet"
    echo "Testing localhost:8000..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health | grep -q "200"; then
        echo "✅ Supabase is running on localhost:8000"
    else
        echo "❌ Supabase is not accessible on localhost:8000"
        echo "Checking Docker containers..."
        docker ps | grep supabase
    fi
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
echo "🎉 Nginx and SSL fix completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Test your application at http://www.healthscribe.pro"
echo "2. Test login functionality - should now work with HTTP (no SSL errors)"
echo "3. The app will use self-hosted Supabase at http://supabase.healthscribe.pro"
echo ""
echo "💡 If login still doesn't work, check:"
echo "   - Is Supabase running? (docker ps | grep supabase)"
echo "   - Is Nginx configured? (sudo nginx -t)"
echo "   - Can you access http://supabase.healthscribe.pro directly?"
echo ""
echo "🔍 To debug further:"
echo "   - Check Supabase logs: docker-compose logs"
echo "   - Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   - Test Supabase directly: curl http://localhost:8000/health"
echo "   - Test via Nginx: curl http://supabase.healthscribe.pro/health"




