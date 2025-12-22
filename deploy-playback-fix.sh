#!/bin/bash

# Deployment script for audio playback fixes
# This uploads the modified workspace component and rebuilds the application

set -e  # Exit on error

echo "🚀 Starting deployment of audio playback fixes..."
echo ""

# Configuration
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_HOST="${REMOTE_HOST:-healthscribe.pro}"
REMOTE_PATH="/root/dashboard-next"
LOCAL_FILE="src/app/dashboard/transcriptionist-workspace.tsx"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Step 1: Validating local changes...${NC}"
if [ ! -f "$LOCAL_FILE" ]; then
    echo -e "${RED}❌ Error: $LOCAL_FILE not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Local file found${NC}"

# Check if the changes are present
if grep -q "Audio element state:" "$LOCAL_FILE"; then
    echo -e "${GREEN}✓ Audio logging changes detected${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Audio logging may not be applied${NC}"
fi

echo ""
echo -e "${YELLOW}📤 Step 2: Uploading modified file to remote server...${NC}"

# Upload the modified file
scp "$LOCAL_FILE" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/${LOCAL_FILE}" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ File uploaded successfully${NC}"
else
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🏗️  Step 3: Rebuilding application on remote server...${NC}"

# Connect to remote and rebuild
ssh "${REMOTE_USER}@${REMOTE_HOST}" << 'REMOTE_COMMANDS'
    set -e
    
    cd /root/dashboard-next
    
    echo "📄 Current branch: $(git branch --show-current)"
    
    # Install dependencies if needed
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps 2>/dev/null || true
    
    # Build the application
    echo "🔨 Building application..."
    npm run build
    
    # Restart the service
    echo "🔄 Restarting application service..."
    pm2 restart "dashboard-next" --silent || pm2 start npm --name "dashboard-next" -- run start
    
    echo "✅ Deployment complete!"
    
REMOTE_COMMANDS

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Remote deployment successful${NC}"
else
    echo -e "${RED}❌ Remote deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All steps completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Open browser and go to https://healthscribe.pro/dashboard/transcriptionist-workspace"
echo "2. Open DevTools (F12) and go to Console tab"
echo "3. Select a transcription with audio"
echo "4. Look for console logs starting with 🎵, ✅, and ❌"
echo "5. Click the play button and check for errors"
echo ""
echo "📊 Debugging checklist:"
echo "  ☐ Audio element state log shows src and duration"
echo "  ☐ Transcription selected log shows hasAudioUrl: true"
echo "  ☐ Audio loaded log appears"
echo "  ☐ Play button works without errors"
echo ""
