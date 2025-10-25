# 🚀 Deploy Transcription Fixes NOW

## Quick Start (Run These Commands)

```bash
# Step 1: Install SSH dependency (one time only)
npm install ssh2

# Step 2: Run the deployment script
node deploy-transcription-fixes.js
```

That's it! The script will:

1. ✅ Connect to your server via SSH
2. ✅ Pull latest code (with new endpoints)
3. ✅ Check environment variables
4. ✅ Rebuild Docker container
5. ✅ Test all endpoints
6. ✅ Verify SSL/n8n/app are working
7. ✅ Show you the diagnostic results

---

## What the Script Does (Step by Step)

| Step | Action | Time |
|------|--------|------|
| 1 | Test SSH connection | <1 min |
| 2 | Verify Docker & App | <1 min |
| 3 | Pull latest code from git | 1-2 min |
| 4 | Check Supabase env vars | <1 min |
| 5 | Verify new endpoint files exist | <1 min |
| 6 | Rebuild Docker container | 3-5 min |
| 7 | Wait for app to start | 30 sec |
| 8 | Verify container running | <1 min |
| 9 | Test debug endpoint | <1 min |
| 10 | Check application logs | <1 min |
| 11 | Test SSL/HTTPS and endpoints | <1 min |
| 12 | Show summary | <1 min |

**Total Time: ~10-15 minutes**

---

## What to Expect

### If Everything Works (✅ HEALTHY)

```
✅ SSH connection established!
✅ Docker and healthscribe-app container found
✅ Code pulled successfully
✅ Found 3 Supabase environment variables
✅ SUPABASE_SERVICE_ROLE_KEY is set ✓
✅ Debug endpoint file exists
✅ User profile endpoint file exists
✅ Docker containers rebuilt and started
✅ Container is running ✓
✅ Debug endpoint responded with HTTP 200 ✓
✅ System status: HEALTHY ✓✓✓
✅ HTTPS/SSL working - Login page HTTP 200 ✓
✅ n8n accessible - HTTP 200 ✓
```

### If There's an Issue (⚠️ DEGRADED)

The script will show exactly what's wrong:

```
❌ SUPABASE_SERVICE_ROLE_KEY is NOT set - this is the main issue!
   Add this to .env.local: SUPABASE_SERVICE_ROLE_KEY=<your_key>
```

---

## After Deployment - Test in Browser

1. **Visit:** https://healthscribe.pro
2. **Clear cache:** Ctrl+Shift+Del
3. **Login** with your credentials
4. **Check:**
   - Transcription history should populate
   - Dashboard stats should be visible
   - No errors in browser console (F12)

---

## If It Doesn't Work Immediately

The application might still be initializing. Wait a few minutes and then:

1. **Hard refresh browser:** Ctrl+Shift+R
2. **Check debug endpoint:** https://healthscribe.pro/api/debug-supabase
3. **Check app logs:** `docker logs healthscribe-app -f`

---

## Environment Variable Check

The script checks for these three critical variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro ✓
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... ✓
SUPABASE_SERVICE_ROLE_KEY=eyJ... ✓ ← MOST IMPORTANT
```

If `SUPABASE_SERVICE_ROLE_KEY` is missing:
1. You'll need to add it to `.env.local` on your server
2. Rebuild the container
3. Re-run this script

---

## Troubleshooting

### "SSH connection failed"
- Check server IP: `154.26.155.207`
- Check SSH password: `Nomar123`
- Verify SSH is enabled on server

### "Docker not found"
- Confirm you're on the server
- Check Docker is running: `docker ps`

### "SUPABASE_SERVICE_ROLE_KEY is NOT set"
- This is the main issue causing 500 errors
- Add to `.env.local` and rebuild container
- Script will guide you through it

### "Debug endpoint returns DEGRADED"
- Check the errors array in the response
- Read the specific error message
- See TRANSCRIPTION_FIX_PLAN.md for solutions

---

## Files Deployed

✅ `src/app/api/debug-supabase/route.ts` - Diagnostic endpoint
✅ `src/app/api/user-profile/route.ts` - User profile endpoint
✅ Enhanced error logging in workspace-transcriptions endpoint

---

## Rollback (If Needed)

If something goes wrong, rollback is safe and simple:

```bash
# On server:
git revert HEAD
docker-compose restart healthscribe-app

# Services return to previous state
# SSL/Traefik/n8n unaffected
```

---

## Support

📖 **Detailed documentation:**
- `INFRASTRUCTURE_FIXES.md` - Complete infrastructure overview
- `TRANSCRIPTION_FIX_PLAN.md` - Detailed root cause analysis
- `README_FIXES.md` - Comprehensive troubleshooting guide

🔍 **Diagnostics:**
- Debug endpoint: https://healthscribe.pro/api/debug-supabase
- App logs: `docker logs healthscribe-app -f`
- SSH script: `node deploy-transcription-fixes.js`

---

## Ready? Run This Command Now:

```bash
npm install ssh2 && node deploy-transcription-fixes.js
```

The script will handle everything automatically! ✨
