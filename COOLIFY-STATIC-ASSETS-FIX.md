# Fix Static Assets Not Loading in Coolify

The issue you're experiencing (JavaScript/CSS files being served as HTML) is a common problem when migrating from Vercel to Coolify. Here's how to fix it:

## 🔍 **Root Cause**
Traefik (Coolify's reverse proxy) is routing ALL requests to your Next.js app, but the app may not be running correctly or may not be serving static assets properly.

## 🚀 **Immediate Fix Steps**

### 1. **Check Coolify Application Settings**

In your Coolify dashboard:

1. **Go to your application settings**
2. **Check "Port"** - Should be set to `3000`
3. **Check "Health Check Path"** - Set to `/api/health`
4. **Check "Build Pack"** - Should be "Docker"

### 2. **Verify Environment Variables**

Make sure these are set in Coolify environment variables:

```bash
PORT=3000
HOSTNAME=0.0.0.0
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Your app-specific variables
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
# ... other variables
```

### 3. **Check Docker Container Logs**

1. Go to Coolify Dashboard
2. Open your application
3. Check the **"Logs"** tab
4. Look for errors like:
   - `EADDRINUSE` (port already in use)
   - `Cannot find module` (missing dependencies)
   - Any crash logs

### 4. **Force Container Restart**

1. In Coolify, go to your application
2. Click **"Stop"**
3. Wait 30 seconds
4. Click **"Start"**

### 5. **Test Diagnostic Endpoints**

After restarting, test these URLs:

```
https://healthscribe.pro/api/health
https://healthscribe.pro/api/debug
```

The `/api/debug` endpoint will show you if:
- Static files exist in the container
- Next.js server is running
- Build completed properly

## 🔧 **Advanced Troubleshooting**

### If Static Assets Still Don't Load:

1. **Check Traefik Configuration**
   - In Coolify, ensure no custom Traefik rules are interfering
   - Make sure the domain is configured correctly

2. **Verify DNS**
   - Ensure `healthscribe.pro` points to your VPS IP
   - Check if there are any CDN/proxy services interfering

3. **Container Health**
   ```bash
   # SSH into your VPS and check:
   docker ps | grep healthscribe
   docker logs <container-name>
   ```

### If App Won't Start:

1. **Check Dockerfile Issues**
   - Build may have succeeded but runtime is failing
   - Check for missing dependencies

2. **Memory Issues**
   - Next.js apps need adequate RAM
   - Check VPS resources in Coolify

3. **Port Conflicts**
   - Ensure no other services are using port 3000
   - Check Coolify internal networking

## 🎯 **Quick Test**

Run this command in your browser's console on the broken page:

```javascript
fetch('/api/health')
  .then(r => r.json())
  .then(d => console.log('Health check:', d))
  .catch(e => console.error('Health check failed:', e))
```

- **If this works**: App is running, static asset serving is the issue
- **If this fails**: App is not running at all

## 📋 **Most Common Solutions**

1. **Restart the application** (fixes 80% of cases)
2. **Check port configuration** (3000)
3. **Verify environment variables** are set correctly
4. **Rebuild and redeploy** if container is corrupted

## 🚨 **Emergency Fix**

If nothing else works:

1. **Delete the application** in Coolify
2. **Recreate it** with the same Git repository
3. **Set all environment variables** again
4. **Deploy**

This forces Coolify to recreate everything from scratch.

---

## 📞 **Next Steps**

1. Try the immediate fixes above
2. Check `/api/debug` endpoint results
3. Share the debug output if issues persist

The build succeeded (we saw this in logs), so this is likely a **runtime configuration issue** in Coolify, not a code problem.