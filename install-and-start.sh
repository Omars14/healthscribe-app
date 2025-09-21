#!/bin/bash

echo "📦 Installing Dependencies and Starting Application"
echo "=================================================="

# Install dependencies
echo "📦 Installing all dependencies..."
chmod +x install-dependencies.js
node install-dependencies.js

# Clean up PM2
echo "🧹 Cleaning up PM2..."
pm2 delete all

# Wait
sleep 3

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

echo "🎉 Installation and startup completed!"




