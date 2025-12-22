#!/bin/bash
set -e

cd /root/healthscribe

echo "Loading environment variables..."
# Load all non-comment lines from .env.vps as environment variables
while IFS='=' read -r key value; do
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  export "$key=$value"
done < .env.vps

echo "Building Docker image..."
docker build \
  --build-arg "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY" \
  -t healthscribe-app:latest /opt/app

if [ $? -eq 0 ]; then
  echo "✅ Build successful"
  echo ""
  echo "Restarting container..."
  docker-compose restart medical-transcription-app
  sleep 10
  echo ""
  docker ps | grep medical-transcription-app
  echo ""
  echo "✅ Done!"
else
  echo "❌ Build failed"
  exit 1
fi
