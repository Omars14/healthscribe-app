# 🚀 Run This on Your Server to Fix Supabase Authentication

## Current Status

✅ **Local environment fixed:**
- New JWT tokens generated
- `.env.local` updated with correct tokens
- `.env.production` updated with correct tokens  
- Application builds successfully

⏳ **Server needs update:**
- JWT_SECRET needs to be updated on Supabase server
- Then restart Supabase services

---

## SSH Connection Issue

**Problem:** Port 22 is currently blocked/timing out from your location.

**Solutions:**
1. Try from a different network (mobile hotspot, different WiFi)
2. Check if your ISP/firewall is blocking port 22
3. Use your hosting provider's web console if available

Once you can connect via SSH, follow the steps below.

---

## Step-by-Step Fix (Run on Server)

### Method 1: Automated Script (Recommended)

Copy the `update-server-jwt.sh` file to your server and run it:

```bash
# On your local machine (when SSH works):
scp update-server-jwt.sh healthscribe:/tmp/
ssh healthscribe "chmod +x /tmp/update-server-jwt.sh && /tmp/update-server-jwt.sh"
```

### Method 2: Manual Fix (If script doesn't work)

```bash
# 1. SSH into your server
ssh healthscribe

# 2. Find Supabase directory
find /opt /root /home -name "docker-compose.yml" 2>/dev/null | xargs grep -l "supabase"
# Note the path (e.g., /opt/supabase/supabase/docker)

# 3. Navigate to that directory
cd /opt/supabase/supabase/docker  # adjust path as needed

# 4. Backup current .env
cp .env .env.backup.$(date +%Y%m%d)

# 5. Edit the .env file
nano .env

# 6. Find JWT_SECRET line and replace with:
JWT_SECRET=df180f53d2ac65309d8c40e190b112d75046d53dafd87b930fed843d11ddc44f75621fbdbfaad9aaa2c48e0dda66e48aaae065865de9c3cf305882de044232ed

# 7. Save and exit (Ctrl+X, then Y, then Enter)

# 8. Restart Supabase services
docker-compose down
docker-compose up -d

# 9. Wait for services to start
sleep 15

# 10. Verify services are running
docker-compose ps

# 11. Check logs if needed
docker-compose logs -f auth
```

---

## Verification

After updating the server, test from your local machine:

```powershell
# Test if Supabase accepts the new tokens
$anonKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY1Njc2NTcwLCJleHAiOjQ5MTkyNzY1NzAuMH0.NB-bymuWPMfYPTAn3ZfWcMSeYP9kew4i02W29Cf1kb4"
$headers = @{ 
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey" 
}
Invoke-RestMethod -Uri "https://supabase.healthscribe.pro/auth/v1/health" -Headers $headers
```

**Expected result:** Should return health status (not "Invalid authentication credentials")

Then test your app:

```powershell
npm run dev
```

Navigate to http://localhost:3000/login and try logging in.

---

## Alternative: Quick Copy-Paste Commands

If you just want to copy-paste commands when SSH works:

```bash
# All-in-one command block
ssh healthscribe << 'ENDSSH'
# Find and update Supabase
SUPABASE_DIR=$(find /opt /root -name "docker-compose.yml" 2>/dev/null | xargs grep -l "supabase" | head -1 | xargs dirname)

if [ -z "$SUPABASE_DIR" ]; then
    echo "❌ Supabase not found"
    exit 1
fi

echo "✅ Found Supabase at: $SUPABASE_DIR"
cd "$SUPABASE_DIR"

# Backup
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update JWT_SECRET
JWT_SECRET="df180f53d2ac65309d8c40e190b112d75046d53dafd87b930fed843d11ddc44f75621fbdbfaad9aaa2c48e0dda66e48aaae065865de9c3cf305882de044232ed"

if grep -q "^JWT_SECRET=" .env; then
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
else
    echo "JWT_SECRET=$JWT_SECRET" >> .env
fi

echo "✅ JWT_SECRET updated"

# Restart services
docker-compose down
sleep 2
docker-compose up -d

echo "✅ Supabase restarted with new JWT secret"
echo ""
echo "Waiting for services to start..."
sleep 15
docker-compose ps
ENDSSH
```

---

## JWT Secret Reference

```
df180f53d2ac65309d8c40e190b112d75046d53dafd87b930fed843d11ddc44f75621fbdbfaad9aaa2c48e0dda66e48aaae065865de9c3cf305882de044232ed
```

**New ANON Key:**
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY1Njc2NTcwLCJleHAiOjQ5MTkyNzY1NzAuMH0.NB-bymuWPMfYPTAn3ZfWcMSeYP9kew4i02W29Cf1kb4
```

**New SERVICE_ROLE Key:**
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NjU2NzY1NzAsImV4cCI6NDkxOTI3NjU3MC4wfQ.ExstDN6a-EylHB1TCGkQAzb_GaaHIQCblqIcQgR4vp4
```

---

## Troubleshooting SSH Connection

If SSH still doesn't work:

1. **Test from different network:**
   ```powershell
   # Try mobile hotspot
   ssh healthscribe "echo OK"
   ```

2. **Check if port 22 is blocked:**
   ```powershell
   Test-NetConnection -ComputerName healthscribe.pro -Port 22
   ```

3. **Try password authentication:**
   ```powershell
   plink -ssh -pw "Nomar123" root@healthscribe.pro "echo OK"
   ```

4. **Use hosting provider's console:**
   - Log into your VPS provider's dashboard
   - Use their web-based console/terminal
   - Run the commands directly there

---

## Summary

**What's done:**
- ✅ Diagnosed JWT mismatch issue
- ✅ Generated correct JWT tokens
- ✅ Updated local environment files
- ✅ Application builds successfully
- ✅ Created server update scripts

**What's needed:**
- ⏳ SSH connection to server (currently blocked)
- ⏳ Update JWT_SECRET on Supabase server
- ⏳ Restart Supabase services

**Once server is updated, everything will work!**
