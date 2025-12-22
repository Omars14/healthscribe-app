# Supabase Authentication Fix Script

Write-Host "🔍 Diagnosing Supabase Authentication Issues..." -ForegroundColor Cyan
Write-Host ""

# Read environment variables
$envProduction = Get-Content .env.production -Raw
$supabaseUrl = if ($envProduction -match 'NEXT_PUBLIC_SUPABASE_URL=(.+)') { $matches[1].Trim() } else { "" }
$anonKey = if ($envProduction -match 'NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)') { $matches[1].Trim() } else { "" }
$serviceKey = if ($envProduction -match 'SUPABASE_SERVICE_ROLE_KEY=(.+)') { $matches[1].Trim() } else { "" }

Write-Host "Environment Configuration:" -ForegroundColor Yellow
Write-Host "  Supabase URL: $supabaseUrl"
Write-Host "  Anon Key: $($anonKey.Substring(0, 20))..."
Write-Host ""

# Test 1: Check if Supabase is accessible
Write-Host "Test 1: Checking Supabase accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$supabaseUrl/auth/v1/health" -Method Get -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✅ Supabase is accessible (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "  ⚠️  Supabase returns 401 - This is the problem!" -ForegroundColor Red
        Write-Host "     The JWT secret on the server doesn't match the keys in .env.production" -ForegroundColor Red
    } else {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 2: Try with authentication headers
Write-Host "Test 2: Testing with authentication headers..." -ForegroundColor Yellow
try {
    $headers = @{
        "apikey" = $anonKey
        "Authorization" = "Bearer $anonKey"
    }
    $response = Invoke-WebRequest -Uri "$supabaseUrl/auth/v1/health" -Headers $headers -Method Get -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✅ Authentication works! (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -like "*401*" -or $errorMessage -like "*Invalid authentication*") {
        Write-Host "  ❌ Authentication FAILED - JWT secret mismatch detected" -ForegroundColor Red
    } else {
        Write-Host "  ❌ Error: $errorMessage" -ForegroundColor Red
    }
}
Write-Host ""

# Decode JWT to show what's inside
Write-Host "Test 3: Decoding JWT token..." -ForegroundColor Yellow
$jwtParts = $anonKey -split '\.'
if ($jwtParts.Length -eq 3) {
    $payload = $jwtParts[1]
    # Add padding if needed
    while ($payload.Length % 4 -ne 0) {
        $payload += "="
    }
    try {
        $decodedBytes = [System.Convert]::FromBase64String($payload)
        $decodedJson = [System.Text.Encoding]::UTF8.GetString($decodedBytes)
        $payloadObj = $decodedJson | ConvertFrom-Json
        Write-Host "  JWT Payload:" -ForegroundColor Cyan
        Write-Host "    Issuer: $($payloadObj.iss)"
        Write-Host "    Role: $($payloadObj.role)"
        Write-Host "    Issued At: $($payloadObj.iat)"
        Write-Host "    Expires: $($payloadObj.exp)"
    } catch {
        Write-Host "  ⚠️  Could not decode JWT: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "🔧 DIAGNOSIS COMPLETE" -ForegroundColor Cyan
Write-Host ""
Write-Host "The problem is: Your Supabase instance has a DIFFERENT JWT_SECRET than the one" -ForegroundColor Red
Write-Host "used to generate the tokens in .env.production." -ForegroundColor Red
Write-Host ""
Write-Host "SOLUTIONS:" -ForegroundColor Yellow
Write-Host "1. Find the correct JWT_SECRET from your Supabase server configuration" -ForegroundColor White
Write-Host "2. Generate new JWT tokens using that secret" -ForegroundColor White
Write-Host "3. Update .env.production and .env.local with the new tokens" -ForegroundColor White
Write-Host ""
Write-Host "To find JWT_SECRET on server:" -ForegroundColor Yellow
Write-Host "  ssh omar@healthscribe.pro" -ForegroundColor White
Write-Host "  docker exec supabase-auth env | grep JWT_SECRET" -ForegroundColor White
Write-Host ""
Write-Host "Or check docker-compose.yml or .env file in Supabase directory" -ForegroundColor White
