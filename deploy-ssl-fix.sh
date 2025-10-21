#!/bin/bash
# SSL Certificate Fix Deployment Script
# Usage: bash deploy-ssl-fix.sh

set -e

VPS_HOST="154.26.155.207"
VPS_USER="root"
VPS_PASSWORD="Nomar123"
REMOTE_DIR="/opt/healthscribe/dashboard-next"
LOCAL_DIR="$(pwd)"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     HEALTHSCRIBE SSL/LOGIN FIX DEPLOYMENT                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# STEP 1: Verify files exist locally
# ============================================================================
echo "🔍 STEP 1: Verifying local files"

for file in .env.production docker-compose.yml healthscribe-traefik.yaml; do
  if [ ! -f "$file" ]; then
    echo "  ✗ File not found: $file"
    exit 1
  fi
  echo "  ✓ $file found"
done

# ============================================================================
# STEP 2: Upload files via SCP
# ============================================================================
echo ""
echo "📤 STEP 2: Uploading files to VPS"

for file in .env.production docker-compose.yml healthscribe-traefik.yaml; do
  echo "  Uploading $file..."
  scp -o StrictHostKeyChecking=no "$file" "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/"
  echo "  ✓ $file uploaded"
done

# ============================================================================
# STEP 3: Execute deployment on VPS
# ============================================================================
echo ""
echo "🚀 STEP 3: Running deployment on VPS"

ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" << 'REMOTE_SCRIPT'
set -e

REMOTE_DIR="/opt/healthscribe/dashboard-next"
cd $REMOTE_DIR

echo "💾 Backing up configuration..."
BACKUP_DIR=~/backups/healthscribe-$(date +%F-%H%M%S)
mkdir -p $BACKUP_DIR
cp docker-compose.yml healthscribe-traefik.yaml .env* $BACKUP_DIR/ 2>/dev/null || true
echo "  ✓ Backed up to: $BACKUP_DIR"

echo ""
echo "🔄 STEP 4: Clearing certificate cache"
rm -f traefik-acme/acme.json
echo "  ✓ Certificate cache cleared"

echo ""
echo "🔀 STEP 5: Restarting Traefik"
docker compose down traefik 2>/dev/null || true
docker compose up -d traefik
echo "  ✓ Traefik started"

echo ""
echo "⏳ STEP 6: Waiting for SSL certificate (up to 2 minutes)..."
timeout=0
while [ $timeout -lt 120 ]; do
  if docker logs traefik 2>/dev/null | grep -q "Issuing a certificate for supabase.healthscribe.pro"; then
    echo "  ✓ SSL Certificate issued!"
    break
  fi
  echo "  Waiting... ($timeout/120 seconds)"
  sleep 5
  timeout=$((timeout + 5))
done

echo ""
echo "🏗️  STEP 7: Rebuilding frontend"
docker compose up -d --build app
sleep 5
echo "  ✓ Frontend rebuilt"

echo ""
echo "✅ STEP 8: Verifying deployment"
echo "  Checking containers..."
docker compose ps --format='{{.Service}}: {{.Status}}' | head -5
echo "  ✓ Verification complete"

REMOTE_SCRIPT

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✨ DEPLOYMENT COMPLETE ✨"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🧪 NEXT: Test in your browser"
echo "   1. Go to: https://www.healthscribe.pro/login"
echo "   2. Open DevTools (F12) → Console"
echo "   3. Look for NO 'Mixed Content' errors"
echo "   4. Try logging in"
echo ""
echo "Should work now! 🎉"
echo ""
