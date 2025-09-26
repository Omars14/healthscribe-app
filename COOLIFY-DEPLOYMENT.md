# Coolify Deployment Guide for HealthScribe Pro Dashboard

This guide provides step-by-step instructions for deploying the HealthScribe Pro dashboard to Coolify on your VPS.

## 🚀 Quick Fix Summary

The dashboard was broken because it still had Vercel-specific configurations and analytics scripts. Here's what was fixed:

### Issues Fixed:
1. **Removed Vercel Analytics**: Eliminated `/_vercel/speed-insights` and `/_vercel/insights` script errors
2. **Updated Next.js Config**: Configured for standalone deployment with proper headers
3. **Fixed Build Process**: Ensured `.next/standalone` output for Docker containers
4. **Environment Variables**: Verified all URLs point to your VPS domains

## 📋 Prerequisites

- Coolify instance running on your VPS
- Git repository connected to Coolify
- Domain pointing to your VPS
- Environment variables configured

## 🔧 Deployment Steps

### 1. Environment Variables in Coolify

Set these environment variables in your Coolify dashboard:

```bash
# Application Settings
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# n8n Configuration
N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2
NEXT_PUBLIC_N8N_URL=https://n8n.healthscribe.pro
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2

# Application URLs
NEXT_PUBLIC_URL=https://www.healthscribe.pro
NEXT_PUBLIC_API_URL=https://www.healthscribe.pro

# API Keys
GOOGLE_API_KEY=your_google_api_key_here
OPENAI_API_KEY=your_openai_key_here
ENCRYPTION_KEY=your_encryption_key_here

# Build Configuration
NEXT_TELEMETRY_DISABLED=1
```

### 2. Coolify Service Configuration

In your Coolify dashboard:

1. **Source**: Connect your Git repository
2. **Build Pack**: Select "Docker" 
3. **Port**: Set to `3000`
4. **Health Check**: Enable with path `/api/health`
5. **Domain**: Configure your custom domain

### 3. Build Commands (if not using Docker)

If you're not using the Dockerfile, set these build commands:

```bash
# Install Command
npm ci --only=production

# Build Command  
npm run build

# Start Command
node .next/standalone/server.js
```

### 4. Docker Configuration

The included `Dockerfile` is optimized for Coolify. It uses:
- Multi-stage build for smaller image size
- Node 18 Alpine for security and performance
- Proper file permissions and security headers
- Health checks on `/api/health`

## 🔍 Verification Steps

After deployment, check these:

1. **Health Check**: Visit `https://your-domain.com/api/health`
2. **Dashboard**: Load `https://your-domain.com/dashboard`
3. **Browser Console**: No 404 errors for JS/CSS files
4. **Authentication**: Login/signup flows work
5. **Static Assets**: Images and fonts load properly

## 🐛 Troubleshooting

### Common Issues:

#### 1. ChunkLoadError or 404 JS files
- **Cause**: Build didn't complete or static files not served
- **Solution**: Rebuild and ensure Docker copies `.next/static` properly

#### 2. RSC Payload Errors
- **Cause**: Environment variables or routing issues
- **Solution**: Check environment variables and clear browser cache

#### 3. Supabase Connection Issues
- **Cause**: Incorrect URLs or keys
- **Solution**: Verify environment variables and test with `/api/test-env`

#### 4. Authentication Loops
- **Cause**: Domain mismatch in auth flow
- **Solution**: Ensure `NEXT_PUBLIC_URL` matches your actual domain

### Debug Endpoints:

- `/api/health` - Server health status
- `/api/test-env` - Environment variable check
- `/dashboard/debug-auth` - Authentication debug info

## 🔄 Continuous Deployment

For automatic deployments:

1. **Git Webhooks**: Configure in Coolify to trigger builds on push
2. **Branch Selection**: Use `main` or `production` branch
3. **Build Caching**: Enable Docker layer caching for faster builds

## 📊 Performance Optimization

The current configuration includes:

- **Standalone Output**: Minimal server bundle
- **Static Asset Optimization**: Proper caching headers
- **Compression**: Built-in gzip compression
- **Security Headers**: XSS protection and content security

## 🚨 Emergency Fixes

If the dashboard is completely broken:

1. **Quick Restart**: Restart the Coolify service
2. **Rollback**: Use Coolify's rollback feature to previous version
3. **Emergency Build**: Run local build and push to force redeploy
4. **Clear Cache**: Clear all browser caches and CDN caches

## 📝 Environment File Template

Create `.env.production` with:

```bash
# Copy from .env.vps and adjust as needed
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
# ... rest of variables
```

## ✅ Success Indicators

Your deployment is successful when:

- ✅ Dashboard loads without JavaScript errors
- ✅ Authentication flows work properly  
- ✅ Static assets (CSS, images) load correctly
- ✅ API calls to Supabase succeed
- ✅ Health check endpoint responds
- ✅ No Vercel-related 404 errors in console

---

**Need Help?** Check the Coolify logs and browser developer tools for specific error messages.