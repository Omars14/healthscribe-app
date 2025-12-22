# Run this script when SSH is accessible
# This will fix everything on the server in one command

Write-Host "🔧 Supabase JWT Server Fix - One-Command Solution" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Test SSH connectivity first
Write-Host "📡 Testing SSH connection..." -ForegroundColor Yellow
try {
    $testResult = ssh -o ConnectTimeout=5 healthscribe "echo OK" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ SSH connection failed!" -ForegroundColor Red
        Write-Host "   Error: $testResult" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
        Write-Host "  1. Try from a different network (mobile hotspot)" -ForegroundColor White
        Write-Host "  2. Check: Test-NetConnection -ComputerName healthscribe.pro -Port 22" -ForegroundColor White
        Write-Host "  3. Use your hosting provider's web console" -ForegroundColor White
        exit 1
    }
    Write-Host "✅ SSH connection successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect via SSH: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Updating Supabase JWT secret on server..." -ForegroundColor Yellow
Write-Host ""

# Run the fix on the server
$serverScript = @'
#!/bin/bash
echo "🔍 Finding Supabase installation..."

# Find Supabase directory
SUPABASE_DIR=$(find /opt /root /home -name "docker-compose.yml" 2>/dev/null | xargs grep -l "supabase" 2>/dev/null | head -1 | xargs dirname 2>/dev/null)

if [ -z "$SUPABASE_DIR" ]; then
    echo "❌ Supabase installation not found!"
    echo "Searched in /opt, /root, /home for docker-compose.yml"
    exit 1
fi

echo "✅ Found Supabase at: $SUPABASE_DIR"
cd "$SUPABASE_DIR"

# Backup current configuration
echo "💾 Creating backup..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"

# Update JWT_SECRET
echo "📝 Updating JWT_SECRET..."
JWT_SECRET="df180f53d2ac65309d8c40e190b112d75046d53dafd87b930fed843d11ddc44f75621fbdbfaad9aaa2c48e0dda66e48aaae065865de9c3cf305882de044232ed"

if grep -q "^JWT_SECRET=" .env; then
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    echo "✅ JWT_SECRET updated"
else
    echo "JWT_SECRET=$JWT_SECRET" >> .env
    echo "✅ JWT_SECRET added"
fi

# Show the update
echo ""
echo "Current JWT_SECRET in .env:"
grep "JWT_SECRET" .env | head -1
echo ""

# Restart Supabase services
echo "🔄 Restarting Supabase services..."
docker-compose down
sleep 3
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 20

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Supabase JWT secret updated and services restarted!"
echo ""
echo "You can now test authentication from your local machine."
'@

try {
    # Execute the script on the server
    $result = $serverScript | ssh healthscribe "bash -s" 2>&1
    
    Write-Host $result
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=" * 60 -ForegroundColor Green
        Write-Host "🎉 Server update completed successfully!" -ForegroundColor Green
        Write-Host "=" * 60 -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Test authentication:" -ForegroundColor White
        Write-Host "     npm run dev" -ForegroundColor Gray
        Write-Host "     # Then navigate to http://localhost:3000/login" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  2. Test Supabase directly:" -ForegroundColor White
        Write-Host '     $anonKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY1Njc2NTcwLCJleHAiOjQ5MTkyNzY1NzAuMH0.NB-bymuWPMfYPTAn3ZfWcMSeYP9kew4i02W29Cf1kb4"' -ForegroundColor Gray
        Write-Host '     $headers = @{ "apikey" = $anonKey; "Authorization" = "Bearer $anonKey" }' -ForegroundColor Gray
        Write-Host '     Invoke-RestMethod -Uri "https://supabase.healthscribe.pro/auth/v1/health" -Headers $headers' -ForegroundColor Gray
        Write-Host ""
        Write-Host "  3. Deploy to production:" -ForegroundColor White
        Write-Host "     git add .env.production" -ForegroundColor Gray
        Write-Host '     git commit -m "fix: Update Supabase JWT tokens"' -ForegroundColor Gray
        Write-Host "     git push origin master" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "⚠️  Script completed with warnings. Check the output above." -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "❌ Failed to execute on server: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
