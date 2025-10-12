#!/bin/bash

cd /root/healthscribe-build

echo "Pulling latest code..."
git pull origin master

echo "Loading environment variables..."
export $(cat /data/coolify/applications/tkwoos4soccckws84088wc04/.env | grep -v '^#' | grep -v '^$' | xargs)

echo "Building Docker image..."
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --build-arg N8N_WEBHOOK_URL="$N8N_WEBHOOK_URL" \
  --build-arg NEXT_PUBLIC_N8N_WEBHOOK_URL="$NEXT_PUBLIC_N8N_WEBHOOK_URL" \
  --build-arg NEXT_PUBLIC_URL="$NEXT_PUBLIC_URL" \
  --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
  --no-cache \
  -t healthscribe-new:latest \
  .

echo "Restarting application..."
cd /data/coolify/applications/tkwoos4soccckws84088wc04
docker compose down
sleep 3
docker compose up -d

echo "Waiting for application to be ready..."
sleep 15

echo "Recent logs:"
docker logs tkwoos4soccckws84088wc04-184252873467 --tail 10

echo "✅ Rebuild complete!"

