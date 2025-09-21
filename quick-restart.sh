#!/bin/bash

echo "🚀 Quick Application Restart"
echo "============================"

# Stop PM2
echo "🛑 Stopping PM2..."
pm2 stop all

# Wait
echo "⏳ Waiting 3 seconds..."
sleep 3

# Start the application
echo "🚀 Starting application..."
pm2 start npm --name "healthscribe" -- start

# Wait for startup
echo "⏳ Waiting 5 seconds for startup..."
sleep 5

# Check status
echo "📊 Application status:"
pm2 status

# Test
echo "🧪 Testing application..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://www.healthscribe.pro

echo "🎉 Quick restart completed!"




