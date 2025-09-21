#!/bin/bash

echo "🚀 Quick Fix for Missing Start Script"
echo "====================================="

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

# Check current scripts
echo "📄 Current scripts in package.json:"
grep -A 10 '"scripts"' package.json || echo "No scripts section found"

# Add start script if missing
echo "🔧 Adding start script to package.json..."

# Create a backup
cp package.json package.json.backup

# Add the start script using sed
sed -i '/"scripts": {/a\    "start": "next start",' package.json

# Also add dev and build scripts if they don't exist
if ! grep -q '"dev"' package.json; then
    sed -i '/"start": "next start",/a\    "dev": "next dev",' package.json
fi

if ! grep -q '"build"' package.json; then
    sed -i '/"dev": "next dev",/a\    "build": "next build"' package.json
fi

echo "✅ Added start script to package.json"

# Show the updated scripts
echo "📄 Updated scripts:"
grep -A 10 '"scripts"' package.json

# Stop PM2
echo "🛑 Stopping PM2..."
pm2 stop all

# Wait
sleep 3

# Start the application
echo "🚀 Starting application..."
pm2 start npm --name "healthscribe" -- start

# Wait for startup
echo "⏳ Waiting 10 seconds for startup..."
sleep 10

# Check status
echo "📊 Application status:"
pm2 status

# Test
echo "🧪 Testing application..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000

echo "🎉 Quick fix completed!"




