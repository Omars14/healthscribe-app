# Quick VPS Fix for Login SSL/Mixed Content Error

## Problem
Your website cannot login because:
- `supabase.healthscribe.pro` doesn't have a valid SSL certificate
- Browser blocks mixed content (HTTPS page → HTTP request)
- Traefik isn't routing or issuing certificates for the Supabase subdomain

## Solution in 3 Steps

### Step 1: Verify DNS (Local Machine)
```bash
# Run on your local computer:
nslookup supabase.healthscribe.pro
dig +short A supabase.healthscribe.pro
```

**Expected:** Should return the same IP as your VPS (same as healthscribe.pro)

If it doesn't match, update your DNS records to point `supabase.healthscribe.pro` → your VPS IP.

---

### Step 2: Deploy Updated Config (Via SSH)
Replace `YOUR_VPS_USER` and `YOUR_VPS_IP` with your actual values.

```bash
# 1. SSH into your VPS
ssh YOUR_VPS_USER@YOUR_VPS_IP

# 2. Navigate to your app directory
cd /path/to/healthscribe  # (typically /opt/healthscribe or similar)

# 3. Backup current configs
mkdir -p ~/backups/healthscribe-$(date +%F)
cp docker-compose.yml healthscribe-traefik.yaml .env* ~/backups/healthscribe-$(date +%F)/ 2>/dev/null || true

# 4. Exit SSH (we'll push the files)
exit
```

---

### Step 3: Push Updated Files via SCP/Git

**Option A: Using SCP (Simple Copy)**

From your LOCAL machine:
```bash
# Copy the fixed files to the VPS
scp .env.production YOUR_VPS_USER@YOUR_VPS_IP:/path/to/healthscribe/
scp docker-compose.yml YOUR_VPS_USER@YOUR_VPS_IP:/path/to/healthscribe/
scp healthscribe-traefik.yaml YOUR_VPS_USER@YOUR_VPS_IP:/path/to/healthscribe/
```

**Option B: Using Git (Recommended per your preferences)**

Skip this for now; we'll set up the automated Git deployment after the login is fixed.

---

### Step 4: Restart Services on VPS

SSH back in and run:

```bash
ssh YOUR_VPS_USER@YOUR_VPS_IP

# Navigate to app
cd /path/to/healthscribe

# Stop old Traefik
docker compose down traefik

# Clear ACME cache to force certificate re-issue
rm -f traefik-acme/acme.json 2>/dev/null || true

# Start Traefik (it will read the new dynamic config)
docker compose up -d traefik

# Wait for ACME to issue the certificate (watch logs)
docker logs -f traefik
# Watch for: "letsencrypt: Obtaining certificate"
# Stop when you see: "Issuing a certificate for supabase.healthscribe.pro"
# Press Ctrl+C to exit logs
```

**Certificate issuance should complete in 1-2 minutes.**

---

### Step 5: Rebuild the Website Container

```bash
# While still SSH'd into the VPS:

# Rebuild and restart the app (with new .env.production)
docker compose up -d --build app

# Check logs for any errors
docker logs -f app
# Look for: "NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro"
# If you see any HTTP URLs, something went wrong
```

---

### Step 6: Verify It Works

**On your local browser:**

```
https://www.healthscribe.pro/login
```

1. Open DevTools (F12) → Console tab
2. Confirm **no Mixed Content errors** (the red errors you were seeing)
3. Try logging in with a valid user
4. Should work now!

---

### If Something Goes Wrong

```bash
# SSH back into VPS and run:

# Restore backup
cd ~/backups/healthscribe-$(date +%F)
cp .env.production docker-compose.yml healthscribe-traefik.yaml /path/to/healthscribe/

# Restart
docker compose down
docker compose up -d
```

---

## Next Steps (After Login Works)

1. **Set up Git push-and-rebuild** (automated deployment)
2. **Ensure n8n can access Supabase Storage** via HTTPS
3. **Test full transcription workflow**

---

## Troubleshooting Commands

```bash
# Check if Traefik is routing correctly
docker logs traefik | grep -i "supabase\|letsencrypt"

# Verify HTTPS works locally
curl -I https://supabase.healthscribe.pro

# Check if app can reach Supabase
docker exec app curl -I https://supabase.healthscribe.pro/auth/v1/health

# Inspect the final built env (should have HTTPS URL)
docker exec app grep -i "NEXT_PUBLIC_SUPABASE" /app/.next/server/app.js 2>/dev/null | head -1
```

---

## VPS Directory Paths (Adjust as needed)

- **App root**: `/opt/healthscribe` or `/home/USER/healthscribe`
- **Supabase (if separate)**: `/opt/supabase` or embedded in main compose
- **Check**: `pwd` once you SSH in, or `docker ps --format "table {{.Names}}\t{{.Mounts}}"` to see mounted volumes
