#!/bin/bash

echo "🔧 Complete Fix and Restart"
echo "==========================="

# Fix package.json
echo "🔧 Fixing package.json..."
chmod +x check-and-fix-package.js
node check-and-fix-package.js

# Clean up PM2
echo "🧹 Cleaning up PM2..."
pm2 delete all

# Wait
sleep 3

# Check if Next.js is built
echo "🔍 Checking if Next.js is built..."
if [ ! -d ".next" ]; then
    echo "❌ Next.js not built. Building..."
    npm run build
else
    echo "✅ Next.js already built"
fi

# Start the application
echo "🚀 Starting application..."
pm2 start npm --name "healthscribe" -- start

# Wait for startup
echo "⏳ Waiting 15 seconds for startup..."
sleep 15

# Check status
echo "📊 Application status:"
pm2 status

# Test local application
echo "🧪 Testing local application..."
curl -s -o /dev/null -w "Local Status: %{http_code}\n" http://localhost:3000

# Test through Nginx
echo "🧪 Testing through Nginx..."
curl -s -o /dev/null -w "Nginx Status: %{http_code}\n" http://www.healthscribe.pro

# Show logs
echo "📋 Recent application logs:"
pm2 logs healthscribe --lines 10

echo "🎉 Complete fix completed!"




