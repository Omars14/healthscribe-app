#!/bin/bash

# Deploy audio playback fixes to healthscribe.pro
# Usage: bash deploy-to-server.sh

REMOTE_HOST="healthscribe.pro"
REMOTE_USER="root"
LOCAL_FILE="src/app/dashboard/transcriptionist-workspace.tsx"

echo "🚀 Deploying audio playback fixes to $REMOTE_HOST..."
echo ""

# Upload the file
echo "📤 Uploading transcriptionist-workspace.tsx..."
scp "$LOCAL_FILE" "$REMOTE_USER@$REMOTE_HOST:/root/dashboard-next/$LOCAL_FILE"

if [ $? -ne 0 ]; then
    echo "❌ Upload failed"
    exit 1
fi

echo "✅ File uploaded"
echo ""

# Rebuild on server
echo "🔨 Building on server..."
ssh "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
cd /root/dashboard-next
npm run build && pm2 restart dashboard-next
echo "✅ Deployment complete"
EOF

if [ $? -eq 0 ]; then
    echo "✅ All done! Changes deployed."
else
    echo "❌ Build or restart failed"
    exit 1
fi
