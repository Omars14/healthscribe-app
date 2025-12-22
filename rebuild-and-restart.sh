#!/bin/bash
set -e

cd /root/healthscribe

echo "📦 Building Docker image..."
docker build -t healthscribe-app:latest /opt/app

if [ $? -eq 0 ]; then
  echo "✅ Build successful"
  echo ""
  echo "🔄 Stopping old container..."
  docker stop medical-transcription-app || true
  echo ""
  echo "🗑️ Removing old container..."
  docker rm medical-transcription-app || true
  echo ""
  echo "🚀 Starting new container..."
  docker-compose up -d
  echo ""
  echo "⏳ Waiting for container to be ready..."
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
