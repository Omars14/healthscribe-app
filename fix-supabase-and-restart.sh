#!/bin/bash

echo "🚀 Fix Supabase Configuration and Restart"
echo "=========================================="
echo ""

# Make script executable
chmod +x fix-supabase-config.js

# Fix the Supabase configuration
echo "🔧 Fixing Supabase configuration..."
node fix-supabase-config.js

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
echo "🎉 Supabase configuration fix completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Test your application at http://www.healthscribe.pro"
echo "2. Test login functionality - should now work with cloud Supabase"
echo "3. The app will use cloud Supabase for auth and local PostgreSQL for data"
echo ""
echo "💡 If login still doesn't work, check the browser console for any remaining errors"
echo "💡 The application should now connect to the working cloud Supabase instead of the broken self-hosted one"




