#!/bin/bash
set -e

echo "================================================"
echo "Healthscribe.pro - Transcription Fixes Deployment"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check if running on server
echo -e "${BLUE}[STEP 1]${NC} Verifying environment..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Are you on the server?${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker found${NC}"

# Step 2: Check git status
echo -e "${BLUE}[STEP 2]${NC} Checking git status..."
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Not in a git repository${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git repository found${NC}"

# Step 3: Pull latest code
echo -e "${BLUE}[STEP 3]${NC} Pulling latest code from main branch..."
git pull origin main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code pulled successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Pull had issues, but continuing...${NC}"
fi

# Step 4: Check environment variables
echo -e "${BLUE}[STEP 4]${NC} Checking Supabase environment variables..."
echo ""
echo "Current environment variables:"
docker exec healthscribe-app env | grep -i supabase || echo "No Supabase vars found"
echo ""

# Step 5: Verify all three critical vars
echo -e "${BLUE}[STEP 5]${NC} Verifying critical environment variables..."
SUPABASE_URL=$(docker exec healthscribe-app env | grep "NEXT_PUBLIC_SUPABASE_URL=" | cut -d'=' -f2)
SUPABASE_ANON=$(docker exec healthscribe-app env | grep "NEXT_PUBLIC_SUPABASE_ANON_KEY=" | cut -d'=' -f2)
SUPABASE_SERVICE=$(docker exec healthscribe-app env | grep "SUPABASE_SERVICE_ROLE_KEY=" | cut -d'=' -f2)

if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_URL not set${NC}"
    exit 1
fi
echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_URL is set${NC}"

if [ -z "$SUPABASE_ANON" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not set${NC}"
    exit 1
fi
echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set${NC}"

if [ -z "$SUPABASE_SERVICE" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_SERVICE_ROLE_KEY not set in container${NC}"
    echo ""
    echo "This is likely the main issue. You need to:"
    echo "1. Add SUPABASE_SERVICE_ROLE_KEY to .env.local"
    echo "2. Rebuild the container"
    echo ""
    echo "Current .env.local content (Supabase vars only):"
    grep -i supabase .env.local || echo "No Supabase vars found in .env.local"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ SUPABASE_SERVICE_ROLE_KEY is set${NC}"
fi

# Step 6: Verify new endpoints exist
echo -e "${BLUE}[STEP 6]${NC} Verifying new endpoint files..."
if [ -f "src/app/api/debug-supabase/route.ts" ]; then
    echo -e "${GREEN}✅ Debug endpoint exists${NC}"
else
    echo -e "${RED}❌ Debug endpoint missing${NC}"
    exit 1
fi

if [ -f "src/app/api/user-profile/route.ts" ]; then
    echo -e "${GREEN}✅ User profile endpoint exists${NC}"
else
    echo -e "${RED}❌ User profile endpoint missing${NC}"
    exit 1
fi

# Step 7: Rebuild container
echo -e "${BLUE}[STEP 7]${NC} Rebuilding Docker container with new code..."
echo "This may take 2-5 minutes..."
docker-compose down
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  docker-compose down had issues${NC}"
fi

docker-compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ docker-compose up failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Container rebuilt${NC}"

# Step 8: Wait for container to start
echo -e "${BLUE}[STEP 8]${NC} Waiting for container to start (30 seconds)..."
sleep 30

# Step 9: Verify container is running
echo -e "${BLUE}[STEP 9]${NC} Verifying container is running..."
if docker ps | grep -q healthscribe-app; then
    echo -e "${GREEN}✅ Container is running${NC}"
else
    echo -e "${RED}❌ Container is not running${NC}"
    echo "Docker status:"
    docker ps -a | grep healthscribe-app
    echo ""
    echo "Container logs:"
    docker logs healthscribe-app -n 50
    exit 1
fi

# Step 10: Test debug endpoint
echo -e "${BLUE}[STEP 10]${NC} Testing debug endpoint..."
echo "Waiting 10 seconds for app to fully initialize..."
sleep 10

DEBUG_RESPONSE=$(curl -s -w "\n%{http_code}" https://healthscribe.pro/api/debug-supabase 2>/dev/null || echo "error\n000")
HTTP_CODE=$(echo "$DEBUG_RESPONSE" | tail -n1)
BODY=$(echo "$DEBUG_RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | head -c 500
echo ""
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Debug endpoint responding${NC}"
    
    # Check for HEALTHY status
    if echo "$BODY" | grep -q '"status":"HEALTHY"'; then
        echo -e "${GREEN}✅ System status: HEALTHY${NC}"
    elif echo "$BODY" | grep -q '"status":"DEGRADED"'; then
        echo -e "${YELLOW}⚠️  System status: DEGRADED${NC}"
        echo "Check errors in response above"
    else
        echo -e "${YELLOW}⚠️  Could not determine system status${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Debug endpoint returned HTTP $HTTP_CODE${NC}"
    echo "This is normal if app is still starting. Check again in 1 minute."
fi

# Step 11: Check logs for errors
echo -e "${BLUE}[STEP 11]${NC} Checking application logs for errors..."
echo ""
ERRORS=$(docker logs healthscribe-app -n 50 | grep -i "error" | head -5)
if [ -z "$ERRORS" ]; then
    echo -e "${GREEN}✅ No errors found in recent logs${NC}"
else
    echo -e "${YELLOW}⚠️  Found potential errors:${NC}"
    echo "$ERRORS"
fi

# Step 12: Test SSL/Login
echo -e "${BLUE}[STEP 12]${NC} Testing SSL and main endpoints..."
echo ""

HTTPS_TEST=$(curl -s -w "%{http_code}" -o /dev/null https://healthscribe.pro/login 2>/dev/null)
if [ "$HTTPS_TEST" = "200" ] || [ "$HTTPS_TEST" = "302" ]; then
    echo -e "${GREEN}✅ HTTPS/SSL working - Login page status: $HTTPS_TEST${NC}"
else
    echo -e "${YELLOW}⚠️  Login page status: $HTTPS_TEST (expected 200/302)${NC}"
fi

N8N_TEST=$(curl -s -w "%{http_code}" -o /dev/null https://n8n.healthscribe.pro 2>/dev/null)
if [ "$N8N_TEST" = "200" ] || [ "$N8N_TEST" = "302" ]; then
    echo -e "${GREEN}✅ n8n accessible - Status: $N8N_TEST${NC}"
else
    echo -e "${RED}❌ n8n not responding - Status: $N8N_TEST${NC}"
fi

# Step 13: Final status
echo ""
echo "================================================"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Visit https://healthscribe.pro in your browser"
echo "2. Login with your account"
echo "3. Check if transcription history now shows"
echo "4. Check dashboard stats are visible"
echo "5. Verify no errors in browser console (F12)"
echo ""
echo "Diagnostic:"
echo "- Debug endpoint: https://healthscribe.pro/api/debug-supabase"
echo "- Check logs: docker logs healthscribe-app -f"
echo ""
