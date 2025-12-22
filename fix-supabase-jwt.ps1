# Comprehensive Supabase JWT Fix Script
# This script will help you get the correct JWT secret and generate valid tokens

param(
    [Parameter(Mandatory=$false)]
    [string]$Server = "healthscribe.pro",
    
    [Parameter(Mandatory=$false)]
    [string]$User = "omar",
    
    [Parameter(Mandatory=$false)]
    [string]$JwtSecret = ""
)

Write-Host "🔧 Supabase JWT Authentication Fix Tool" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

if ($JwtSecret -eq "") {
    Write-Host "📋 STEP 1: Get JWT Secret from Server" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "I'll help you retrieve the JWT_SECRET from your server." -ForegroundColor White
    Write-Host "Please run ONE of these commands on your server (healthscribe.pro):" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 1 - Check Auth container:" -ForegroundColor Cyan
    Write-Host "  docker exec supabase-auth env | grep JWT_SECRET" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2 - Check Kong container:" -ForegroundColor Cyan
    Write-Host "  docker exec supabase-kong env | grep JWT_SECRET" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 3 - Check all Supabase containers:" -ForegroundColor Cyan
    Write-Host "  docker ps | grep supabase" -ForegroundColor Gray
    Write-Host "  docker exec <container-name> env | grep JWT_SECRET" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 4 - Check Supabase .env file:" -ForegroundColor Cyan
    Write-Host "  find /root /opt /home -name 'docker-compose.yml' 2>/dev/null | xargs grep -l supabase" -ForegroundColor Gray
    Write-Host "  cat <path-to-supabase>/.env | grep JWT_SECRET" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Once you have the JWT_SECRET, run this script again:" -ForegroundColor Yellow
    Write-Host "  .\fix-supabase-jwt.ps1 -JwtSecret 'your-secret-here'" -ForegroundColor Green
    Write-Host ""
    exit 0
}

Write-Host "✅ JWT Secret provided!" -ForegroundColor Green
Write-Host "   Secret (first 20 chars): $($JwtSecret.Substring(0, [Math]::Min(20, $JwtSecret.Length)))..." -ForegroundColor Gray
Write-Host ""

Write-Host "📋 STEP 2: Generate Valid JWT Tokens" -ForegroundColor Yellow
Write-Host ""

# Function to create JWT token
function New-JwtToken {
    param(
        [string]$Secret,
        [string]$Role,
        [int]$ExpiryYears = 100
    )
    
    # Create header
    $header = @{
        typ = "JWT"
        alg = "HS256"
    } | ConvertTo-Json -Compress
    
    # Create payload
    $now = [int][double]::Parse((Get-Date -UFormat %s))
    $expiry = $now + ($ExpiryYears * 365 * 24 * 60 * 60)
    
    $payload = @{
        iss = "supabase"
        iat = $now
        exp = $expiry
        role = $Role
    } | ConvertTo-Json -Compress
    
    # Base64 URL encode
    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
    $payloadBytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
    
    $headerBase64 = [Convert]::ToBase64String($headerBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    $payloadBase64 = [Convert]::ToBase64String($payloadBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    
    # Create signature
    $message = "$headerBase64.$payloadBase64"
    $messageBytes = [System.Text.Encoding]::UTF8.GetBytes($message)
    $secretBytes = [System.Text.Encoding]::UTF8.GetBytes($Secret)
    
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = $secretBytes
    $signatureBytes = $hmac.ComputeHash($messageBytes)
    $signatureBase64 = [Convert]::ToBase64String($signatureBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    
    return "$message.$signatureBase64"
}

try {
    Write-Host "Generating ANON key..." -ForegroundColor Cyan
    $anonKey = New-JwtToken -Secret $JwtSecret -Role "anon"
    Write-Host "  ✅ ANON key generated" -ForegroundColor Green
    
    Write-Host "Generating SERVICE_ROLE key..." -ForegroundColor Cyan
    $serviceKey = New-JwtToken -Secret $JwtSecret -Role "service_role"
    Write-Host "  ✅ SERVICE_ROLE key generated" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "=" * 80 -ForegroundColor Green
    Write-Host "✅ NEW TOKENS GENERATED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "=" * 80 -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Copy these tokens to your .env files:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey" -ForegroundColor White
    Write-Host "SUPABASE_SERVICE_ROLE_KEY=$serviceKey" -ForegroundColor White
    Write-Host ""
    
    # Update .env.production
    Write-Host "📋 STEP 3: Update Environment Files" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Do you want to automatically update .env.production and .env.local? (y/N)"
    
    if ($response -eq 'y' -or $response -eq 'Y') {
        # Update .env.production
        if (Test-Path ".env.production") {
            $content = Get-Content ".env.production" -Raw
            $content = $content -replace 'NEXT_PUBLIC_SUPABASE_ANON_KEY=.*', "NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey"
            $content = $content -replace 'SUPABASE_SERVICE_ROLE_KEY=.*', "SUPABASE_SERVICE_ROLE_KEY=$serviceKey"
            Set-Content ".env.production" -Value $content -NoNewline
            Write-Host "  ✅ Updated .env.production" -ForegroundColor Green
        }
        
        # Update .env.local
        if (Test-Path ".env.local") {
            $content = Get-Content ".env.local" -Raw
            
            # Uncomment NEXT_PUBLIC_SUPABASE_URL if commented
            $content = $content -replace '#\s*NEXT_PUBLIC_SUPABASE_URL=', 'NEXT_PUBLIC_SUPABASE_URL='
            
            # Update or add keys
            if ($content -match 'NEXT_PUBLIC_SUPABASE_ANON_KEY=') {
                $content = $content -replace 'NEXT_PUBLIC_SUPABASE_ANON_KEY=.*', "NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey"
            } else {
                $content += "`nNEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey"
            }
            
            if ($content -match 'SUPABASE_SERVICE_ROLE_KEY=') {
                $content = $content -replace 'SUPABASE_SERVICE_ROLE_KEY=.*', "SUPABASE_SERVICE_ROLE_KEY=$serviceKey"
            } else {
                $content += "`nSUPABASE_SERVICE_ROLE_KEY=$serviceKey"
            }
            
            # Ensure NEXT_PUBLIC_SUPABASE_URL is set
            if ($content -notmatch 'NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro') {
                if ($content -match 'NEXT_PUBLIC_SUPABASE_URL=') {
                    $content = $content -replace 'NEXT_PUBLIC_SUPABASE_URL=.*', 'NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro'
                } else {
                    $content += "`nNEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro"
                }
            }
            
            Set-Content ".env.local" -Value $content -NoNewline
            Write-Host "  ✅ Updated .env.local" -ForegroundColor Green
            Write-Host "  ✅ Uncommented NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "=" * 80 -ForegroundColor Green
        Write-Host "🎉 Environment files updated successfully!" -ForegroundColor Green
        Write-Host "=" * 80 -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 STEP 4: Test the Fix" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Run these commands to test:" -ForegroundColor White
        Write-Host "  1. Rebuild your app: npm run build" -ForegroundColor Gray
        Write-Host "  2. Test locally: npm run dev" -ForegroundColor Gray
        Write-Host "  3. Try logging in at http://localhost:3000/login" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "  ⚠️  Skipped automatic update" -ForegroundColor Yellow
        Write-Host "     Please manually copy the tokens above to your .env files" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error generating tokens: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Use an online JWT generator" -ForegroundColor Yellow
    Write-Host "  1. Go to https://jwt.io/" -ForegroundColor White
    Write-Host "  2. Use algorithm: HS256" -ForegroundColor White
    Write-Host "  3. Payload for ANON:" -ForegroundColor White
    Write-Host '     {"iss":"supabase","iat":' + $now + ',"exp":' + $expiry + ',"role":"anon"}' -ForegroundColor Gray
    Write-Host "  4. Payload for SERVICE_ROLE:" -ForegroundColor White
    Write-Host '     {"iss":"supabase","iat":' + $now + ',"exp":' + $expiry + ',"role":"service_role"}' -ForegroundColor Gray
    Write-Host "  5. Secret: Your JWT_SECRET" -ForegroundColor White
}
