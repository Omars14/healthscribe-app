#!/bin/bash

echo "🏗️ Creating Next.js Structure and Building"
echo "=========================================="

# Check current structure
echo "🔍 Checking current structure..."
chmod +x check-application-structure.js
node check-application-structure.js

echo ""
echo "🏗️ Creating basic Next.js structure..."
chmod +x create-basic-nextjs-structure.js
node create-basic-nextjs-structure.js

echo ""
echo "🔨 Building the application..."
npm run build

echo ""
echo "🧹 Cleaning up PM2..."
pm2 delete all

echo ""
echo "🚀 Starting the application..."
pm2 start npm --name "healthscribe" -- start

echo ""
echo "⏳ Waiting 10 seconds for startup..."
sleep 10

echo ""
echo "📊 Application status:"
pm2 status

echo ""
echo "🧪 Testing application..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000

echo ""
echo "🎉 Setup completed!"




