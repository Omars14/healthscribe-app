# HealthScribe Login Fix - Deployment Instructions

## Problem Summary

Your website login is failing with:
```
Mixed Content: The page at 'https://www.healthscribe.pro/login' was loaded over HTTPS, 
but requested an insecure resource 'http://supabase-rest-e088wwks88k8k48sccg8gk0o:3000/auth/v1/token'.
```

**Root Cause**: 
- Frontend was configured to reach Supabase via HTTP (`http://supabase-auth:9999`)
- Browser blocks HTTP requests from HTTPS pages (Mixed Content Policy)
- Traefik wasn't issuing SSL certificates for `supabase.healthscribe.pro`

---

## Solution Overview

### 3 Files Modified:

1. **`.env.production`** - Changed HTTP to HTTPS URL
2. **`docker-compose.yml`** - Enabled Traefik file provider
3. **`healthscribe-traefik.yaml`** - Added Supabase routing & SSL

### Expected Result:
✅ Traefik issues SSL certificate for `supabase.healthscribe.pro`  
✅ Frontend uses HTTPS URLs  
✅ No more Mixed Content errors  
✅ Login works correctly  

---

## Pre-Deployment

### 1. Verify DNS (Local)
```bash
nslookup supabase.healthscribe.pro
# Should return your VPS IP (same as healthscribe.pro)
```

If DNS doesn't point to your VPS, update it now before proceeding.

### 2. Validate Config (Local)
```bash
bash VALIDATE_CONFIG.sh
# Should show: ✅ All checks passed!
```

---

## Deployment (Step by Step)

### Step 1: Backup on VPS
```bash
ssh YOUR_USER@YOUR_VPS_IP
cd /path/to/healthscribe

# Backup all current configs
mkdir -p ~/backups/$(date +%F-%H%M%S)
cp docker-compose.yml healthscribe-traefik.yaml .env* \
   ~/backups/$(date +%F-%H%M%S)/ 2>/dev/null || true

exit
```

### Step 2: Push Files (Local)
```bash
# From your local repo directory
scp .env.production YOUR_USER@YOUR_VPS_IP:/path/to/healthscribe/
scp docker-compose.yml YOUR_USER@YOUR_VPS_IP:/path/to/healthscribe/
scp healthscribe-traefik.yaml YOUR_USER@YOUR_VPS_IP:/path/to/healthscribe/
```

### Step 3: Restart Traefik (VPS)
```bash
ssh YOUR_USER@YOUR_VPS_IP
cd /path/to/healthscribe

# Stop Traefik to clear old config
docker compose down traefik

# Clear old certificate cache
rm -f traefik-acme/acme.json 2>/dev/null || true

# Start Traefik (new config auto-loaded)
docker compose up -d traefik

# Watch for certificate issuance (should take 1-2 minutes)
docker logs -f traefik 2>&1 | grep -E "supabase|letsencrypt|Issuing"

# You should see:
# - "Obtaining certificate"
# - "Issuing a certificate for supabase.healthscribe.pro"
# Press Ctrl+C when done
```

### Step 4: Rebuild Frontend (VPS)
```bash
# Still SSH'd in

# Rebuild Next.js app with new env
docker compose up -d --build app

# Wait for it to start (watch logs)
docker logs -f app | head -20
# Look for: "Ready - started server on"
```

### Step 5: Verify Certificate (VPS)
```bash
# Test if HTTPS works
curl -I https://supabase.healthscribe.pro
# Should return 200 or 302, NOT certificate error

# Check certificate details
curl -vI https://supabase.healthscribe.pro 2>&1 | grep -E "CN=|issuer"

# Verify app config
docker exec app curl -I https://supabase.healthscribe.pro/auth/v1/health

exit
```

---

## Testing

### Browser Test (Your Computer)
1. Open **Incognito window** (disables extensions)
2. Visit `https://www.healthscribe.pro/login`
3. Open DevTools (F12) → **Console** tab
4. **Check for NO red errors**
5. Try logging in
6. Should work! ✅

### If Still Failing

Check Docker logs:
```bash
ssh YOUR_USER@YOUR_VPS_IP
cd /path/to/healthscribe

# Check Traefik routing
docker logs traefik | tail -50 | grep -i "supabase\|error"

# Check app environment
docker exec app env | grep SUPABASE

# Verify files were copied
docker exec traefik cat /etc/traefik/dynamic/healthscribe-traefik.yaml | head -20
```

---

## Rollback (If Needed)

```bash
ssh YOUR_USER@YOUR_VPS_IP

# Find latest backup
ls -la ~/backups/ | head -1

# Restore
BACKUP=$(ls -td ~/backups/* | head -1)
cd /path/to/healthscribe
cp $BACKUP/* .

# Restart
docker compose down
docker compose up -d

exit
```

---

## What Each Change Does

### `.env.production` Change
```diff
- NEXT_PUBLIC_SUPABASE_URL=http://supabase-auth:9999
+ NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
```
**Why**: Browser requires HTTPS for API calls from HTTPS pages

### `docker-compose.yml` Changes
- Added `--providers.file.directory=/etc/traefik/dynamic`
- Added `--providers.file.watch=true`
- Mounted `healthscribe-traefik.yaml` as volume

**Why**: Tells Traefik to read routing rules from the YAML file

### `healthscribe-traefik.yaml` Changes
- Configured HTTP→HTTPS redirect for supabase domain
- Added SSL certificate resolver (Let's Encrypt)
- Routed requests to Kong backend
- Updated CORS to allow Supabase domain

**Why**: Traefik needs explicit instructions to:
- Route the subdomain
- Issue & renew SSL certificates
- Forward traffic correctly

---

## Success Checklist

After deployment, verify:

- [ ] `curl -I https://supabase.healthscribe.pro` returns 200/302
- [ ] Certificate is valid (not self-signed)
- [ ] Login page loads without Mixed Content errors
- [ ] Login attempt succeeds
- [ ] No red errors in browser console
- [ ] `docker logs traefik` shows no errors

---

## Troubleshooting

### "Connection is not private" in browser
**Cause**: Certificate still being issued  
**Fix**: Wait 2-3 minutes, refresh page
```bash
# Force refresh certificate
docker exec traefik rm -f /letsencrypt/acme.json
docker compose restart traefik
# Wait 2 minutes
```

### "Mixed Content" errors still appearing
**Cause**: Frontend still using HTTP URL  
**Fix**: Rebuild app
```bash
docker compose up -d --build app
```

### Traefik won't start
**Cause**: YAML syntax error  
**Fix**: Check config
```bash
docker logs traefik | tail -20
```

### Can't reach supabase.healthscribe.pro via DNS
**Cause**: DNS not updated  
**Fix**: Add DNS record pointing to your VPS IP
```bash
# Verify DNS from VPS
nslookup supabase.healthscribe.pro
```

---

## Support Commands

```bash
ssh YOUR_USER@YOUR_VPS_IP
cd /path/to/healthscribe

# View all running services
docker compose ps

# Check specific logs
docker logs traefik      # Reverse proxy
docker logs app          # Next.js frontend
docker logs n8n          # Workflow engine

# Test connectivity
docker exec app curl -I https://supabase.healthscribe.pro/auth/v1/health
docker exec app curl -I https://n8n.healthscribe.pro

# Inspect configuration
docker exec traefik cat /etc/traefik/dynamic/healthscribe-traefik.yaml

exit
```

---

## Next Steps (After Login Works)

1. **Set up automated Git deployment** (push-and-rebuild)
2. **Test n8n audio file access** via HTTPS
3. **Verify transcription workflow** works end-to-end

---

**Created**: 2025-10-21  
**Status**: Ready to Deploy  
**Complexity**: Low (3 file changes, standard Docker restart)
