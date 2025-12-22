#!/bin/bash
# Security update for CVE-2025-66478 / CVE-2025-55182

echo "=========================================="
echo "🔒 CRITICAL SECURITY UPDATE"
echo "CVE-2025-66478 / CVE-2025-55182 (React2Shell)"
echo "=========================================="

cd /root/healthscribe-build

echo ""
echo "Current versions:"
grep -E '"next"|"react"' package.json | head -5

echo ""
echo "Updating Next.js to 15.4.8 (patched version)..."
npm install next@15.4.8 --save

echo ""
echo "Updating React to patched versions..."
npm install react@19.0.3 react-dom@19.0.3 --save

echo ""
echo "New versions:"
grep -E '"next"|"react"' package.json | head -5

echo ""
echo "Rebuilding application..."
npm run build 2>&1 | tail -30

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "Restarting container..."
    docker restart medical-transcription-app
    
    sleep 10
    
    echo ""
    echo "Testing application..."
    curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" -m 10 http://localhost:3000/
    
    echo ""
    echo "=========================================="
    echo "✅ SECURITY UPDATE COMPLETE"
    echo "=========================================="
else
    echo ""
    echo "❌ Build failed! Check errors above."
fi
