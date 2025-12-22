# Supabase Authentication Fix Guide

## Problem Identified

✅ **JWT Secret Mismatch Detected**

Your Supabase instance is running with a DIFFERENT `JWT_SECRET` than the one used to generate the tokens in your `.env.production` and `.env.local` files. This is why you're getting 401 errors.

## Solution

Follow these steps to fix the authentication:

---

## Step 1: Get the Correct JWT Secret from Your Server

Log into your server at **healthscribe.pro** and run ONE of these commands:

### Option A: Check Supabase Auth Container
```bash
docker exec supabase-auth env | grep JWT_SECRET
```

### Option B: Check Supabase Kong Container
```bash
docker exec supabase-kong env | grep JWT_SECRET
```

### Option C: Find and Check Supabase Configuration Files
```bash
# Find Supabase installation directory
find /root /opt /home -name "docker-compose.yml" 2>/dev/null | xargs grep -l "supabase"

# Once found, check the .env file in that directory
cat /path/to/supabase/.env | grep JWT_SECRET
```

### Option D: Check All Supabase Containers
```bash
# List all Supabase containers
docker ps --filter "name=supabase"

# Check each container for JWT_SECRET
docker exec <container-name> env | grep JWT_SECRET
```

---

## Step 2: Generate New JWT Tokens

Once you have the JWT_SECRET, run this PowerShell script on your local machine:

```powershell
.\fix-supabase-jwt.ps1 -JwtSecret 'YOUR_JWT_SECRET_HERE'
```

The script will:
1. Generate new valid ANON and SERVICE_ROLE keys
2. Automatically update your `.env.production` and `.env.local` files
3. Uncomment the `NEXT_PUBLIC_SUPABASE_URL` line

---

## Step 3: Verify the Fix

After updating the tokens:

1. **Rebuild your application:**
   ```powershell
   npm run build
   ```

2. **Test locally:**
   ```powershell
   npm run dev
   ```

3. **Try logging in at:** http://localhost:3000/login

4. **Deploy to production:**
   ```powershell
   git add .env.production
   git commit -m "fix: Update Supabase JWT tokens"
   git push
   ```

---

## Alternative: Manual JWT Generation

If you can't run the PowerShell script, use https://jwt.io/ to generate tokens manually:

### For ANON Key:
```json
{
  "iss": "supabase",
  "iat": 1734141600,
  "exp": 4914003000,
  "role": "anon"
}
```

### For SERVICE_ROLE Key:
```json
{
  "iss": "supabase",
  "iat": 1734141600,
  "exp": 4914003000,
  "role": "service_role"
}
```

**Settings:**
- Algorithm: HS256
- Secret: Your JWT_SECRET from Step 1

---

## What Changed

The issue occurred because:
1. Your Supabase server is using one JWT_SECRET
2. Your `.env` files had tokens generated with a different JWT_SECRET
3. When the app tries to authenticate, the server rejects the tokens (401 Unauthorized)

This fix ensures both use the same secret, allowing proper authentication.

---

## Files That Need Updating

1. `.env.production` - Update both keys
2. `.env.local` - Update both keys + uncomment `NEXT_PUBLIC_SUPABASE_URL`

---

## Need Help?

If you get stuck:
1. Make sure you can access your server via SSH
2. Make sure Docker is running on the server
3. Make sure Supabase containers are running: `docker ps | grep supabase`
4. Check server logs: `docker logs supabase-auth`

---

## Quick Reference Commands

### On Server (healthscribe.pro):
```bash
# Get JWT secret
docker exec supabase-auth env | grep JWT_SECRET

# Check Supabase status
docker ps --filter "name=supabase"

# View auth logs
docker logs supabase-auth --tail 100
```

### On Local Machine:
```powershell
# Generate new tokens
.\fix-supabase-jwt.ps1 -JwtSecret 'your-secret-here'

# Test the fix
npm run dev

# Deploy
git push
```
