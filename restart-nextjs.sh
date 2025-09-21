#!/bin/bash

echo "✅ Next.js config uploaded successfully!"
echo "Restarting Next.js application..."
pm2 restart healthscribe
sleep 3
echo "Testing routing after restart..."
echo "Auth endpoint test:"
curl -s -k https://healthscribe.pro/auth/v1/health
echo ""
echo "REST API test:"
curl -s -k https://healthscribe.pro/rest/
echo ""
echo "Main site test:"
curl -s -k https://healthscribe.pro | head -5