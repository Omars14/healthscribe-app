#!/bin/bash
# Fix next.config.ts and rebuild

echo "Fixing next.config.ts..."
cat > /root/healthscribe-build/next.config.ts << 'CONFIGEOF'
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  staticPageGenerationTimeout: 0,
  experimental: {
    prerenderDebug: false,
  },
};
export default nextConfig;
CONFIGEOF

echo "Config fixed. Rebuilding..."
cd /root/healthscribe-build
npm run build 2>&1 | tail -20

echo ""
echo "Checking for server.js..."
ls -la /root/healthscribe-build/.next/standalone/server.js 2>/dev/null && echo "server.js exists!" || echo "server.js not found"

if [ -f /root/healthscribe-build/.next/standalone/server.js ]; then
    echo ""
    echo "Copying static files..."
    cp -r /root/healthscribe-build/.next/static /root/healthscribe-build/.next/standalone/.next/
    cp -r /root/healthscribe-build/public /root/healthscribe-build/.next/standalone/
    
    echo "Restarting container..."
    docker stop medical-transcription-app 2>/dev/null || true
    docker rm medical-transcription-app 2>/dev/null || true
    
    docker run -d \
      --name medical-transcription-app \
      --restart unless-stopped \
      -p 3000:3000 \
      -v /root/healthscribe-build/.next/standalone:/app \
      --env-file /root/healthscribe-build/.env.local \
      node:20-alpine \
      sh -c "cd /app && node server.js"
    
    echo ""
    sleep 5
    docker logs medical-transcription-app 2>&1 | tail -5
    echo ""
    docker ps | grep medical-transcription-app
    echo ""
    echo "Done!"
else
    echo "Build did not produce standalone output!"
fi
