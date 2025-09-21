#!/bin/bash

echo "🔧 Fixing 502 Bad Gateway Error"
echo "==============================="

# Stop PM2
echo "🛑 Stopping PM2..."
pm2 stop all

# Kill any remaining processes
echo "🔪 Killing any remaining Node processes..."
pkill -f node

# Wait
echo "⏳ Waiting 3 seconds..."
sleep 3

# Check if port 3000 is free
echo "🔍 Checking port 3000..."
if lsof -i :3000; then
    echo "❌ Port 3000 is still in use"
    echo "🔪 Killing processes on port 3000..."
    fuser -k 3000/tcp
    sleep 2
fi

# Start the application
echo "🚀 Starting application..."
pm2 start npm --name "healthscribe" -- start

# Wait for startup
echo "⏳ Waiting 10 seconds for startup..."
sleep 10

# Check status
echo "📊 Application status:"
pm2 status

# Test local application
echo "🧪 Testing local application..."
curl -s -o /dev/null -w "Local Status: %{http_code}\n" http://localhost:3000

# Test through Nginx
echo "🧪 Testing through Nginx..."
curl -s -o /dev/null -w "Nginx Status: %{http_code}\n" http://www.healthscribe.pro

# Check logs
echo "📋 Recent application logs:"
pm2 logs healthscribe --lines 5

echo "🎉 502 fix completed!"




