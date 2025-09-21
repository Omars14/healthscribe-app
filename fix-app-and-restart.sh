#!/bin/bash

echo "🚀 Fix Application Configuration and Restart"
echo "============================================"
echo ""

# Make script executable
chmod +x fix-app-config.js

# Fix the application configuration
echo "🔧 Fixing application configuration..."
node fix-app-config.js

echo ""
echo "🔄 Restarting application services..."

# Try to restart the application using different methods
if command -v pm2 &> /dev/null; then
    echo "📱 Restarting with PM2..."
    pm2 restart all
    pm2 status
elif systemctl is-active --quiet healthscribe-app; then
    echo "🔧 Restarting with systemctl..."
    sudo systemctl restart healthscribe-app
    sudo systemctl status healthscribe-app
elif systemctl is-active --quiet nginx; then
    echo "🌐 Restarting Nginx..."
    sudo systemctl restart nginx
    sudo systemctl status nginx
else
    echo "⚠️  No known service manager found. Please restart your application manually."
fi

echo ""
echo "🎉 Application configuration fix completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Test your application at http://www.healthscribe.pro"
echo "2. Test login functionality - this should now work!"
echo "3. The app should now use local PostgreSQL instead of self-hosted Supabase"
echo ""
echo "💡 If you still have issues, check the browser console for any remaining errors"




