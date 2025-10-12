# 🚨 QUICK COOLIFY DEPLOYMENT FIX

Your dashboard is showing **503 Service Unavailable** because the application service is down, but n8n and Supabase are running fine.

## ✅ Working Services:
- n8n: https://n8n.healthscribe.pro (✅ Running)
- Supabase: https://supabase.healthscribe.pro (✅ Running)

## ❌ Broken Service:
- Dashboard: https://www.healthscribe.pro (❌ 503 Service Unavailable)

## 🔧 IMMEDIATE FIX STEPS:

### 1. Access Coolify Dashboard
- Go to your VPS IP:8080 (e.g., http://your-vps-ip:8080)
- Log in to Coolify

### 2. Find Your Dashboard Service
- Look for "dashboard-next" or "healthscribe-dashboard" service
- Check the status (likely shows as "stopped" or "failed")

### 3. Check Environment Variables
Ensure these are set in Coolify:

```bash
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NDI4NDkyLCJleHAiOjIwNzM3ODg0OTJ9.IDxL4FLgzFebICRHTCsJ7wl6ngxdko0sjX740U5_wFY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTg0Mjg0OTIsImV4cCI6MjA3Mzc4ODQ5Mn0.vpHnNpMLXwzkDxbX9xVuAARoxa6HVPCJJISSL2H9RZU
N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2
NEXT_PUBLIC_N8N_URL=https://n8n.healthscribe.pro
NEXT_PUBLIC_URL=https://www.healthscribe.pro
NEXT_PUBLIC_API_URL=https://www.healthscribe.pro
GOOGLE_API_KEY=AIzaSyBPmQfnqNhGi9rYbVgTi6UbGOiLZTr1k8Y
```

### 4. Force Redeploy
- Click "Deploy" or "Redeploy" button
- Watch the build logs for errors
- Common errors to look for:
  - Build failures
  - Missing environment variables
  - Port conflicts
  - Docker issues

### 5. Check Service Configuration
Ensure these settings:
- **Port**: 3000
- **Build Command**: `npm run build`
- **Start Command**: `npm start` or `node .next/standalone/server.js`
- **Health Check**: `/api/health`

## 🐛 Common Issues & Solutions:

### Issue 1: Build Failure
**Solution**: Check if all dependencies are installed
```bash
# In Coolify build logs, you should see:
npm ci --production
npm run build
```

### Issue 2: Environment Variables Missing
**Solution**: Re-add all environment variables in Coolify dashboard

### Issue 3: Port Conflict
**Solution**: Ensure port 3000 is available and correctly configured

### Issue 4: Docker Issues
**Solution**: Try restarting the Docker container

## 🚀 Alternative: Emergency Local Deploy

If Coolify continues to fail, you can temporarily run locally and test:

```bash
# In your project directory
npm install
npm run build
npm start
```

Then access via http://localhost:3000

## ✅ Success Check

After redeployment, verify:
1. Visit https://www.healthscribe.pro
2. Should show login page (not 503 error)
3. Check browser console for any JavaScript errors
4. Test authentication flow

## 📞 Next Steps After Fix

1. **Test the complete flow**:
   - Sign up/login
   - Upload audio file
   - Verify transcription works

2. **Monitor logs** in Coolify for any runtime errors

3. **Set up monitoring** to catch future issues

---

**Status**: Your infrastructure (n8n, Supabase) is healthy. Only the dashboard app needs redeployment.