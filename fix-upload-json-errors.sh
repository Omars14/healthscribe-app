#!/bin/bash

# Fix upload JSON parsing errors
# This script deploys the improved error handling for upload failures

set -e

REMOTE_HOST="healthscribe.pro"
REMOTE_USER="root"

echo "🔧 Deploying JSON error handling fixes..."
echo ""

# Files to upload
FILES=(
  "src/lib/transcription-service.ts"
  "src/app/dashboard/transcriptionist-workspace.tsx"
)

for FILE in "${FILES[@]}"; do
  echo "📤 Uploading $FILE..."
  scp "$FILE" "$REMOTE_USER@$REMOTE_HOST:/root/dashboard-next/$FILE"
  if [ $? -ne 0 ]; then
    echo "❌ Failed to upload $FILE"
    exit 1
  fi
done

echo "✅ All files uploaded"
echo ""

# Rebuild on server
echo "🏗️ Building application..."
ssh "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
cd /root/dashboard-next

# Check for any syntax errors
echo "🔍 Checking TypeScript..."
npm run type-check 2>&1 | head -20 || true

# Build
echo "🔨 Building..."
npm run build

# Restart
echo "🔄 Restarting service..."
pm2 restart dashboard-next

echo "✅ Deployment complete!"
EOF

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ All done!"
  echo ""
  echo "📝 Changes made:"
  echo "  1. Added safe JSON parsing with error handling"
  echo "  2. Better error messages for API failures"
  echo "  3. Server response validation"
  echo "  4. Detailed console logging for debugging"
  echo ""
  echo "🧪 Test:"
  echo "  1. Open browser console (F12)"
  echo "  2. Try uploading an audio file"
  echo "  3. Watch for console logs with 📡, 📄, ✅ emojis"
  echo "  4. If error occurs, check the response text in console"
else
  echo "❌ Build failed"
  exit 1
fi
