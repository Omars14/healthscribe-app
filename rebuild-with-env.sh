#!/bin/bash
set -e

cd /root/healthscribe

echo "📋 Loading environment variables..."
export $(cat .env.vps | grep -v '^#' | xargs)

echo "📦 Building Docker image with environment variables..."
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  -t healthscribe-app:latest /opt/app

if [ $? -eq 0 ]; then
  echo "✅ Build successful"
  echo ""
  echo "🔄 Restarting containers..."
  docker-compose down || true
  sleep 3
  docker-compose up -d
  sleep 10
  
  echo ""
  echo "📊 Container status:"
  docker ps | grep medical-transcription-app
  
  echo ""
  echo "✅ Deployment complete!"
else
  echo "❌ Build failed"
  exit 1
fi
