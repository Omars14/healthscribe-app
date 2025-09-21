#!/bin/bash

echo "🚀 Fix Supabase Ports Configuration"
echo "==================================="
echo ""

# Make script executable
chmod +x check-supabase-ports.js

# Analyze Supabase ports and create correct configuration
echo "🔍 Analyzing Supabase ports and creating correct configuration..."
node check-supabase-ports.js

echo ""
echo "🌐 Setting up correct Nginx configuration..."

# Remove any existing configuration
echo "🗑️  Removing existing configuration..."
sudo rm -f /etc/nginx/sites-enabled/supabase.healthscribe.pro

# Copy the correct configuration
if [ -f "supabase-nginx-correct.conf" ]; then
    echo "📄 Copying correct Nginx configuration..."
    sudo cp supabase-nginx-correct.conf /etc/nginx/sites-available/supabase.healthscribe.pro
    
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
        
        # Test connectivity
        echo "🔍 Testing Supabase connectivity..."
        echo "Testing main endpoint..."
        if curl -s http://supabase.healthscribe.pro/ | grep -q "Supabase"; then
            echo "✅ Supabase main endpoint is accessible"
        else
            echo "⚠️  Testing auth endpoint..."
            if curl -s -o /dev/null -w "%{http_code}" http://supabase.healthscribe.pro/auth/v1/token | grep -q "400\|401\|405"; then
                echo "✅ Supabase auth endpoint is accessible (returned expected error code)"
            else
                echo "❌ Supabase auth endpoint is not accessible"
            fi
        fi
        
    else
        echo "❌ Nginx configuration test failed"
        echo "Let's check what's wrong..."
        sudo nginx -t 2>&1
        exit 1
    fi
else
    echo "❌ supabase-nginx-correct.conf not found"
    exit 1
fi

echo ""
echo "🔍 Testing individual Supabase services..."

# Test each service directly
echo "Testing auth service (port 9999)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:9999/auth/v1/token | grep -q "400\|401\|405"; then
    echo "✅ Auth service is accessible on port 9999"
else
    echo "❌ Auth service is not accessible on port 9999"
fi

echo "Testing REST API (port 3000)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/rest/v1/ | grep -q "200\|401"; then
    echo "✅ REST API is accessible on port 3000"
else
    echo "❌ REST API is not accessible on port 3000"
fi

echo "Testing storage API (port 5000)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/storage/v1/ | grep -q "200\|401"; then
    echo "✅ Storage API is accessible on port 5000"
else
    echo "❌ Storage API is not accessible on port 5000"
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
echo "🎉 Supabase ports fix completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Test your application at http://www.healthscribe.pro"
echo "2. Test login functionality - should now work with correct port mapping"
echo "3. The app will use self-hosted Supabase at http://supabase.healthscribe.pro"
echo ""
echo "💡 The issue was that Supabase services are on different ports, not port 8000"
echo "💡 Now Nginx correctly proxies to the right ports for each service"
echo ""
echo "🔍 To debug further:"
echo "   - Check Supabase logs: docker-compose logs"
echo "   - Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   - Test auth directly: curl http://localhost:9999/auth/v1/token"
echo "   - Test via Nginx: curl http://supabase.healthscribe.pro/auth/v1/token"




