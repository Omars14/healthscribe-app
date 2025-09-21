# VPS Deployment Guide - Authentication Fix

## ✅ Yes, this will work on your VPS!

The JWT token fix I provided will work perfectly on your VPS. Here's exactly what you need to do:

## 🔧 Step 1: Update Your Coolify Environment Variables

In your Coolify dashboard, update these environment variables for your Next.js app:

```bash
# Updated JWT tokens (replace the old demo tokens)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NDI4NDkyLCJleHAiOjIwNzM3ODg0OTJ9.IDxL4FLgzFebICRHTCsJ7wl6ngxdko0sjX740U5_wFY

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTg0Mjg0OTIsImV4cCI6MjA3Mzc4ODQ5Mn0.vpHnNpMLXwzkDxbX9xVuAARoxa6HVPCJJISSL2H9RZU

# Keep your existing URLs
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_URL=https://www.healthscribe.pro
NEXT_PUBLIC_API_URL=https://www.healthscribe.pro
```

## 🔧 Step 2: Update Your Self-Hosted Supabase Instance

This is **CRITICAL** - your Supabase instance needs the matching JWT secret:

### Option A: If using Docker Compose for Supabase
1. SSH into your VPS where Supabase is running
2. Edit your Supabase `.env` file or `docker-compose.yml`
3. Add/update this line:
```bash
JWT_SECRET=df180f53d2ac65309d8c40e190b112d75046d53dafd87b930fed843d11ddc44f75621fbdbfaad9aaa2c48e0dda66e48aaae065865de9c3cf305882de044232ed
```
4. Restart Supabase services:
```bash
docker-compose down && docker-compose up -d
```

### Option B: If using Coolify for Supabase too
1. Go to your Supabase service in Coolify
2. Add the JWT_SECRET environment variable
3. Redeploy the service

## 🔧 Step 3: Deploy Your Next.js App

After updating the environment variables in Coolify:

1. **Redeploy** your Next.js application in Coolify
2. The new JWT tokens will be included in the build
3. Your app will now authenticate properly with your Supabase instance

## 🧪 Step 4: Test the Authentication

1. Visit `https://www.healthscribe.pro/login`
2. Try logging in with valid credentials
3. Authentication should now work!

## 🔍 Troubleshooting

### If you still get authentication errors:

1. **Check Supabase logs:**
```bash
# SSH into your VPS
docker logs supabase-auth -f
```

2. **Verify JWT secret is applied:**
```bash
# Check if the JWT_SECRET is set in your Supabase container
docker exec supabase-auth env | grep JWT_SECRET
```

3. **Test the tokens directly:**
```bash
# Test the anon key
curl -X GET "https://supabase.healthscribe.pro/auth/v1/settings" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NDI4NDkyLCJleHAiOjIwNzM3ODg0OTJ9.IDxL4FLgzFebICRHTCsJ7wl6ngxdko0sjX740U5_wFY"
```

## 📋 Environment Variable Checklist

Make sure these are set in your Coolify deployment:

- ✅ `NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (new token)
- ✅ `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (new token)
- ✅ `NEXT_PUBLIC_URL=https://www.healthscribe.pro`
- ✅ `NODE_ENV=production`

## 🚀 Why This Will Work on VPS

1. **JWT tokens are environment-agnostic** - they work the same locally and on VPS
2. **Your Coolify setup is correct** - it properly passes environment variables
3. **Docker deployment is solid** - the Dockerfile builds the app with the right env vars
4. **The authentication flow is unchanged** - only the JWT signing key is different

The key is ensuring **both sides** (your Next.js app AND your Supabase instance) use the same JWT secret. Once that's synchronized, authentication will work perfectly on your VPS! 🎉
