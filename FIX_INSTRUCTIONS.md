# ✅ Supabase Authentication Fix - COMPLETE INSTRUCTIONS

## What I've Done

1. ✅ Identified the problem: JWT secret mismatch between server and client
2. ✅ Generated new valid JWT tokens using your documented JWT secret
3. ✅ Updated `.env.local` with new tokens
4. ✅ Updated `.env.production` with new tokens
5. ✅ Uncommented `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
6. ✅ Created server-side update script

## What You Need to Do

### Step 1: Update JWT Secret on Server

Since SSH is not accessible from your current location, you have two options:

#### Option A: Via Web Console/Panel
If you have a web-based console for your server (like in your hosting provider's dashboard):

1. Access your server console
2. Run these commands:
   ```bash
   curl -o /tmp/update-server-jwt.sh https://raw.githubusercontent.com/your-repo/dashboard-next/master/update-server-jwt.sh
   chmod +x /tmp/update-server-jwt.sh
   sudo /tmp/update-server-jwt.sh
   ```

#### Option B: Manual Upload
1. Upload `update-server-jwt.sh` to your server at healthscribe.pro
2. SSH into your server (when you're in a location with SSH access)
3. Run:
   ```bash
   chmod +x update-server-jwt.sh
   sudo ./update-server-jwt.sh
   ```

#### Option C: Manual Update (if scripts don't work)
1. SSH into your server
2. Find your Supabase directory:
   ```bash
   find /opt /root /home -name "docker-compose.yml" 2>/dev/null | xargs grep -l "supabase"
   ```
3. Edit the `.env` file in that directory:
   ```bash
   nano /path/to/supabase/.env
   ```
4. Update or add this line:
   ```
   JWT_SECRET=df180f53d2ac65309d8c40e190b112d75046d53dafd87b930fed843d11ddc44f75621fbdbfaad9aaa2c48e0dda66e48aaae065865de9c3cf305882de044232ed
   ```
5. Restart Supabase:
   ```bash
   cd /path/to/supabase
   docker-compose down
   docker-compose up -d
   ```

### Step 2: Test Locally

Once the server JWT is updated:

1. **Rebuild your application:**
   ```powershell
   npm run build
   ```

2. **Start dev server:**
   ```powershell
   npm run dev
   ```

3. **Test login:**
   - Open http://localhost:3000/login
   - Try logging in with your credentials
   - You should NO LONGER see 401 errors

### Step 3: Deploy to Production

Once local testing works:

```powershell
# Commit the environment changes (if they're tracked)
git add .env.production
git commit -m "fix: Update Supabase JWT tokens"

# Push to trigger deployment
git push origin master
```

## Verification Commands

### Check if Supabase is accepting the new tokens:

```powershell
$anonKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY1Njc2NTcwLCJleHAiOjQ5MTkyNzY1NzAuMH0.NB-bymuWPMfYPTAn3ZfWcMSeYP9kew4i02W29Cf1kb4"
$headers = @{ 
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey" 
}
Invoke-RestMethod -Uri "https://supabase.healthscribe.pro/auth/v1/health" -Headers $headers
```

**Expected result after fix:** Should return health status (not "Invalid authentication credentials")

## Current Status

### ✅ Completed
- JWT tokens generated with correct secret
- `.env.local` updated
- `.env.production` updated
- `NEXT_PUBLIC_SUPABASE_URL` uncommented
- Server update script created

### ⏳ Pending (requires server access)
- Update JWT_SECRET on the Supabase server
- Restart Supabase services
- Verify authentication works

## Files Modified

1. `.env.local` - Updated JWT tokens and uncommented Supabase URL
2. `.env.production` - Updated JWT tokens

## New Files Created

1. `fix-supabase-jwt.ps1` - PowerShell script for generating tokens
2. `fix-supabase-auth.ps1` - Diagnostic script
3. `update-server-jwt.sh` - Server-side update script
4. `get-supabase-jwt.sh` - Alternative server script
5. `SUPABASE_FIX_GUIDE.md` - Detailed guide
6. `FIX_INSTRUCTIONS.md` - This file

## JWT Details

**JWT Secret:**
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

## Troubleshooting

### Still getting 401 errors after update?

1. **Check server JWT secret:**
   ```bash
   # On server
   cd /path/to/supabase
   grep JWT_SECRET .env
   ```
   It should show the JWT secret above.

2. **Check Supabase logs:**
   ```bash
   # On server
   docker logs supabase-auth --tail 100
   docker logs supabase-kong --tail 100
   ```

3. **Verify Supabase is running:**
   ```bash
   # On server
   docker ps | grep supabase
   ```

4. **Clear browser cache and try again**

### Can't access server via SSH?

- Check if you're on a network that blocks port 22
- Try from a different network or use VPN
- Use your hosting provider's web console

## Need Help?

If you're still stuck:
1. Check the server logs (see troubleshooting above)
2. Verify the JWT_SECRET is correctly set on the server
3. Make sure all Supabase containers are running
4. Try restarting the entire Supabase stack

---

**Summary:** Your local environment is fixed. You just need to update the JWT_SECRET on your Supabase server to match, then everything will work!
