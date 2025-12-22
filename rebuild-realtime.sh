#!/bin/bash
set -e

cd /root/healthscribe-build

# Load environment variables
set -a
source .env.local
set +a

echo "=== Building Docker image with real-time update fix ==="
echo "NEXT_PUBLIC_URL: $NEXT_PUBLIC_URL"

docker build --no-cache -t healthscribe/app:realtime-fix \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_N8N_URL="$NEXT_PUBLIC_N8N_URL" \
  --build-arg NEXT_PUBLIC_N8N_WEBHOOK_URL="$NEXT_PUBLIC_N8N_WEBHOOK_URL" \
  --build-arg NEXT_PUBLIC_URL="$NEXT_PUBLIC_URL" \
  --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
  --build-arg NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \
  .

echo "=== Build complete! ==="
echo ""
echo "Now run these commands to deploy:"
echo "  docker stop medical-transcription-app"
echo "  docker rm medical-transcription-app"
echo "  docker run -d --name medical-transcription-app --env-file .env.local --network app_medical-transcription -p 3000:3000 healthscribe/app:realtime-fix"
echo "  docker network connect healthscribe_web medical-transcription-app"
echo "  docker restart medical-transcription-app"
