#!/bin/bash

echo "🚀 Complete Self-Hosted Supabase Fix"
echo "===================================="
echo ""

# Make script executable
chmod +x fix-self-hosted-supabase.js

# Fix the self-hosted Supabase configuration
echo "🔧 Fixing self-hosted Supabase configuration..."
node fix-self-hosted-supabase.js

echo ""
echo "🌐 Setting up Nginx configuration for self-hosted Supabase..."

# Copy Nginx configuration
if [ -f "supabase-nginx.conf" ]; then
    echo "📄 Copying Nginx configuration..."
    sudo cp supabase-nginx.conf /etc/nginx/sites-available/supabase.healthscribe.pro
    
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
    fi
else
    echo "❌ supabase-nginx.conf not found"
fi

echo ""
echo "🚀 Starting self-hosted Supabase..."

# Make startup script executable and run it
if [ -f "start-supabase.sh" ]; then
    chmod +x start-supabase.sh
    ./start-supabase.sh
else
    echo "❌ start-supabase.sh not found"
    echo "Trying to start Supabase manually..."
    
    # Check if Supabase is running
    if docker ps | grep -q "supabase"; then
        echo "✅ Supabase is already running"
    else
        echo "🔧 Starting Supabase services..."
        if [ -f "docker-compose.yml" ]; then
            docker-compose up -d
        else
            echo "❌ docker-compose.yml not found"
            echo "Please ensure Supabase is properly configured"
        fi
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
echo "🎉 Self-hosted Supabase fix completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Test your application at http://www.healthscribe.pro"
echo "2. Test login functionality - should now work with self-hosted Supabase"
echo "3. The app will use self-hosted Supabase at supabase.healthscribe.pro"
echo ""
echo "💡 If login still doesn't work, check:"
echo "   - Is Supabase running? (docker ps | grep supabase)"
echo "   - Is Nginx configured? (sudo nginx -t)"
echo "   - Can you access supabase.healthscribe.pro directly?"
echo ""
echo "🔍 To debug further:"
echo "   - Check Supabase logs: docker-compose logs"
echo "   - Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   - Test Supabase directly: curl http://localhost:8000/health"




