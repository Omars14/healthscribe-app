#!/bin/bash

# Quick Supabase Fix Deployment Script
# This script commits all changes and prepares for deployment

set -e

echo "========================================="
echo "  Supabase Internal URL Fix Deployment"
echo "========================================="
echo ""

# Check if git is clean
if ! git diff --quiet; then
  echo "⚠️  Warning: You have unstaged changes"
  echo "Git status:"
  git status
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "📝 Staging files..."
git add \
  src/lib/env.ts \
  src/lib/supabase-server.ts \
  src/lib/supabase-client.ts \
  src/app/api/upload/route.ts \
  .env.local \
  SUPABASE_FIX_SUMMARY.md

echo "✅ Staged:"
git diff --staged --name-only

echo ""
echo "📋 Commit message:"
echo "   Fix Supabase: use internal Docker URL, remove hardcoded fallbacks"
echo ""

read -p "Commit these changes? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

git commit -m "Fix Supabase: use internal Docker URL, remove hardcoded fallbacks

Changes:
- src/lib/env.ts: NEW - Centralized env validation, no hardcoded fallbacks
- src/lib/supabase-server.ts: Use strict env validation, add supabaseAdmin
- src/lib/supabase-client.ts: Disable browser access to internal URL
- src/app/api/upload/route.ts: NEW - File upload + n8n integration
- .env.local: Add SUPABASE_INTERNAL_URL=http://supabase-auth:9999

This fix:
✅ Bypasses broken Traefik endpoint
✅ Uses internal Docker network URL
✅ Respects RLS for logins and transcription histories
✅ Supports all uploads, storage, and n8n integration
✅ Fails fast on missing env vars
✅ Future-compatible: can switch to public URL when Traefik is fixed

For details, see SUPABASE_FIX_SUMMARY.md"

echo ""
echo "✅ Committed!"
echo ""
echo "Next steps:"
echo ""
echo "1️⃣  Push to your repository:"
echo "   git push origin main"
echo ""
echo "2️⃣  Deploy via Coolify:"
echo "   - Open Coolify dashboard"
echo "   - Go to your application"
echo "   - Click 'Rebuild/Deploy'"
echo "   - Wait for build to complete"
echo "   - Check logs for: '[Supabase] Server using internal URL: http://supabase-auth:9999'"
echo ""
echo "3️⃣  Verify health:"
echo "   curl http://localhost:3000/api/health"
echo ""
echo "4️⃣  Test all flows (see SUPABASE_FIX_SUMMARY.md for details)"
echo ""
echo "========================================="
