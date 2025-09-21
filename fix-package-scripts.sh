#!/bin/bash

echo "🔧 Fixing Package.json Scripts"
echo "=============================="

# Make the script executable
chmod +x fix-package-scripts.js

# Run the fix script
node fix-package-scripts.js

echo ""
echo "🚀 Now restarting the application with correct scripts..."

# Stop PM2
pm2 stop all

# Wait
sleep 3

# Start with the correct script
pm2 start npm --name "healthscribe" -- start

# Wait for startup
sleep 10

# Check status
echo "📊 Application status:"
pm2 status

# Test
echo "🧪 Testing application..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000

echo "🎉 Package scripts fix completed!"




