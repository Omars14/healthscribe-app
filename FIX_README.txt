================================================================================
SUPABASE AUTHENTICATION FIX - QUICK START
================================================================================

PROBLEM: 401 "Invalid authentication credentials" when trying to log in

SOLUTION: JWT secret mismatch - local environment fixed, server needs update

================================================================================
WHAT'S DONE:
================================================================================

✅ Local environment completely fixed
✅ New JWT tokens generated and applied
✅ .env.local and .env.production updated
✅ Application builds successfully
✅ All scripts ready to run

================================================================================
WHAT YOU NEED TO DO:
================================================================================

1. CONNECT TO SERVER via SSH (currently blocked - try different network)

2. RUN THIS COMMAND:
   
   .\run-when-ssh-works.ps1

   That's it! This single command will:
   - Test SSH connection
   - Find Supabase installation
   - Backup current config
   - Update JWT_SECRET
   - Restart Supabase services
   - Verify everything works

3. TEST LOCALLY:
   
   npm run dev
   
   Then go to http://localhost:3000/login

================================================================================
IF SSH DOESN'T WORK:
================================================================================

Try from different network (mobile hotspot, different WiFi, etc.)

OR use your hosting provider's web console and paste this:

SUPABASE_DIR=$(find /opt /root -name "docker-compose.yml" 2>/dev/null | xargs grep -l "supabase" | head -1 | xargs dirname)
cd "$SUPABASE_DIR"
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
JWT_SECRET="df180f53d2ac65309d8c40e190b112d75046d53dafd87b930fed843d11ddc44f75621fbdbfaad9aaa2c48e0dda66e48aaae065865de9c3cf305882de044232ed"
if grep -q "^JWT_SECRET=" .env; then sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env; else echo "JWT_SECRET=$JWT_SECRET" >> .env; fi
docker-compose down && docker-compose up -d

================================================================================
DETAILED DOCUMENTATION:
================================================================================

- AUTHENTICATION_FIX_SUMMARY.md - Complete overview
- RUN_THIS_ON_SERVER.md - Detailed server instructions
- FIX_INSTRUCTIONS.md - Step-by-step guide

================================================================================
QUICK TEST (after server update):
================================================================================

PowerShell:

$anonKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY1Njc2NTcwLCJleHAiOjQ5MTkyNzY1NzAuMH0.NB-bymuWPMfYPTAn3ZfWcMSeYP9kew4i02W29Cf1kb4"
$headers = @{ "apikey" = $anonKey; "Authorization" = "Bearer $anonKey" }
Invoke-RestMethod -Uri "https://supabase.healthscribe.pro/auth/v1/health" -Headers $headers

Expected: Should return health status (not error)

================================================================================

Everything is ready - just waiting on SSH access to complete the fix!
