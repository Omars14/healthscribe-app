#!/bin/bash
# Rebuild the app image with the security-fixed Dockerfile
# This script sources env vars from .env and rebuilds the image

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Source .env (but don't export to environment due to ? in defaults)
set -a
source .env
set +a

echo "🔨 Building healthscribe/app:secure with fixed Dockerfile..."
docker build \
  --no-cache \
  -t healthscribe/app:secure \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  --build-arg NEXT_PUBLIC_N8N_URL="${NEXT_PUBLIC_N8N_URL}" \
  --build-arg NEXT_PUBLIC_N8N_WEBHOOK_URL="${NEXT_PUBLIC_N8N_WEBHOOK_URL}" \
  --build-arg NEXT_PUBLIC_URL="${NEXT_PUBLIC_URL}" \
  --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
  --build-arg NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL}" \
  .

if [ $? -eq 0 ]; then
  echo "✅ Build successful! Image: healthscribe/app:secure"
  echo ""
  echo "To use this image, restart the container:"
  echo "  docker stop medical-transcription-app"
  echo "  docker rm medical-transcription-app"
  echo "  docker run -d --name medical-transcription-app ..."
  echo ""
  echo "Or use docker-compose:"
  echo "  APP_IMAGE_TAG=secure docker-compose up -d"
else
  echo "❌ Build failed!"
  exit 1
fi
