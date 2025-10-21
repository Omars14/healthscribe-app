#!/bin/bash

# Configuration Validation Script
# Run this locally before pushing to VPS to ensure all files are correct

set -e

echo "🔍 Validating HealthScribe Configuration..."
echo ""

ERRORS=0

# Check 1: .env.production has HTTPS URL
echo "✓ Checking .env.production..."
if grep -q "NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro" .env.production; then
    echo "  ✅ HTTPS Supabase URL configured"
else
    echo "  ❌ ERROR: .env.production doesn't have https://supabase.healthscribe.pro"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "http://supabase-auth:9999\|http://supabase-rest\|http://localhost" .env.production; then
    echo "  ❌ ERROR: .env.production still contains HTTP URLs"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: docker-compose.yml has file provider enabled
echo ""
echo "✓ Checking docker-compose.yml..."
if grep -q -- "--providers.file.directory=/etc/traefik/dynamic" docker-compose.yml; then
    echo "  ✅ Traefik file provider enabled"
else
    echo "  ❌ ERROR: File provider not configured in docker-compose.yml"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "healthscribe-traefik.yaml:/etc/traefik/dynamic" docker-compose.yml; then
    echo "  ✅ Dynamic config volume mounted"
else
    echo "  ❌ ERROR: Traefik dynamic config volume not mounted"
    ERRORS=$((ERRORS + 1))
fi

# Check 3: healthscribe-traefik.yaml has correct config
echo ""
echo "✓ Checking healthscribe-traefik.yaml..."
if grep -q "Host(\`supabase.healthscribe.pro\`)" healthscribe-traefik.yaml; then
    echo "  ✅ Supabase route configured"
else
    echo "  ❌ ERROR: Supabase route not in traefik config"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "certResolver: le" healthscribe-traefik.yaml; then
    echo "  ✅ Let's Encrypt resolver configured"
else
    echo "  ❌ ERROR: Let's Encrypt not configured"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "url: \"http://supabase-kong:8000\"" healthscribe-traefik.yaml; then
    echo "  ✅ Supabase Kong backend configured"
else
    echo "  ❌ WARNING: Check if Kong service name is 'supabase-kong'"
fi

if grep -q "https://supabase.healthscribe.pro" healthscribe-traefik.yaml; then
    echo "  ✅ Supabase CORS origin configured"
else
    echo "  ⚠️  WARNING: Supabase domain not in CORS list"
fi

# Check 4: No dangerous patterns
echo ""
echo "✓ Checking for dangerous patterns..."
if grep -q "NEXT_PUBLIC.*http://10\." .env.production 2>/dev/null; then
    echo "  ❌ ERROR: Hard-coded internal IPs in .env.production"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "supabase-auth:9999\|supabase-rest:3000" docker-compose.yml healthscribe-traefik.yaml 2>/dev/null; then
    echo "  ❌ ERROR: Old internal service names still present"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "────────────────────────────────────────"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed! Ready to deploy."
    echo ""
    echo "Next steps:"
    echo "1. Run: scp .env.production YOUR_USER@YOUR_IP:/path/to/healthscribe/"
    echo "2. Run: scp docker-compose.yml YOUR_USER@YOUR_IP:/path/to/healthscribe/"
    echo "3. Run: scp healthscribe-traefik.yaml YOUR_USER@YOUR_IP:/path/to/healthscribe/"
    echo "4. SSH into VPS and run: cd /path/to/healthscribe && docker compose up -d --build"
    exit 0
else
    echo "❌ Found $ERRORS error(s). Fix them before deploying."
    exit 1
fi
