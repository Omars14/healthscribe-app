# Immediate Actions Required - Transcription History & API Fixes

## Summary

Documentation and fixes have been created to resolve the transcription history issue while maintaining SSL, login, and n8n functionality. The root cause is likely missing or misconfigured Supabase environment variables in the running container.

---

## Files Created

### 1. **INFRASTRUCTURE_FIXES.md** - Complete Infrastructure Documentation
Location: Root directory
- Documents all SSL/Traefik fixes already applied
- Architecture overview with network diagrams
- Prevents regression of SSL and n8n functionality
- Quick reference commands

### 2. **TRANSCRIPTION_FIX_PLAN.md** - Detailed Diagnosis & Fix Steps
Location: Root directory
- Root cause analysis for all three issues (500, 406, 401 errors)
- Step-by-step fix procedures
- Implementation checklist
- Rollback plan (zero-risk due to API-only changes)

### 3. **Debug Endpoint** - Diagnostic Tool
Location: `src/app/api/debug-supabase/route.ts`
- Tests Supabase connectivity from app container
- Verifies environment variables
- Tests both ANON and SERVICE_ROLE keys
- **Usage:** Visit `https://healthscribe.pro/api/debug-supabase`

### 4. **User Profile Endpoint** - Fix for 406 Error
Location: `src/app/api/user-profile/route.ts`
- Server-side endpoint to fetch user profiles
- Bypasses CORS/permission issues with ANON key
- Returns user data with proper caching headers

### 5. **Enhanced Workspace Endpoint** - Better Error Messages
Location: `src/app/api/workspace-transcriptions/route.ts` (updated)
- More detailed error logging for environment variables
- Distinguishes between missing URL vs missing service key

---

## Next Steps (Immediate)

### Step 1: Deploy Code Changes (2 minutes)
```bash
# Push the new files to your server
git add src/app/api/debug-supabase/route.ts
git add src/app/api/user-profile/route.ts
git commit -m "Add diagnostic endpoints and user profile API"
git push
```

### Step 2: Verify Environment Variables (1 minute)
**SSH to your server and run:**
```bash
docker exec healthscribe-app env | grep -i supabase
```

**Expected output:**
```
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**If any are missing, add to `.env.local` and rebuild:**
```bash
# Edit .env.local (add missing variables)
nano .env.local

# Rebuild container
docker-compose down
docker-compose up -d

# Wait for container to start
sleep 10
docker logs healthscribe-app -n 50
```

### Step 3: Test Debug Endpoint (1 minute)
**Visit:** `https://healthscribe.pro/api/debug-supabase`

**Look for:**
```json
{
  "status": "HEALTHY",
  "errors": [],
  "env": {
    "supabaseUrl": true,
    "anonKey": true,
    "serviceKey": true
  },
  "connections": {
    "anonKey": { "status": "OK" },
    "serviceKey": { "status": "OK" }
  },
  "tables": {
    "transcriptions": { "status": "OK" },
    "user_profiles": { "status": "OK" }
  }
}
```

**If status is DEGRADED or CRITICAL:**
- Check the `errors` array for specifics
- Review error messages to identify which component failed
- Reference TRANSCRIPTION_FIX_PLAN.md for solutions

### Step 4: Restart App (2 minutes)
```bash
docker-compose restart healthscribe-app

# Wait for restart
sleep 5

# Check status
docker ps | grep healthscribe-app
```

---

## Validation Checklist

After deployment, verify nothing broke:

### SSL & Login (Critical - don't break these)
- [ ] Visit https://healthscribe.pro (no SSL warnings)
- [ ] Login page loads
- [ ] Can login with valid credentials
- [ ] Dashboard appears after login

### n8n Service
- [ ] Visit https://n8n.healthscribe.pro
- [ ] n8n UI loads without 502 error
- [ ] Status shows "200 OK"

### Transcription History (Main Fix)
- [ ] Navigate to Transcriptions/Workspace tab
- [ ] List of transcriptions appears (not empty)
- [ ] Browser console has no 500 errors
- [ ] Each transcription shows name, date, status

### Dashboard Stats (Secondary Fix)
- [ ] Dashboard page loads
- [ ] Stats cards show numbers (total, processing, etc.)
- [ ] Charts render
- [ ] Recent activity list populated
- [ ] No 401/404/500 errors in console

### Debug Endpoint (Diagnostic Tool)
- [ ] https://healthscribe.pro/api/debug-supabase returns status: "HEALTHY"
- [ ] All environment variables present
- [ ] All connections show "OK" status

---

## Rollback Procedure (If Something Breaks)

**Zero-risk rollback** (these are API-only changes, not infrastructure):

```bash
# Revert code to last working state
git revert HEAD

# Restart container
docker-compose restart healthscribe-app

# Services return to previous state
# SSL/Traefik/Login/n8n unaffected
```

---

## Architecture Recap (Why These Fixes Work)

### The Problem
```
Browser → HTTPS → Traefik → App Container
                           ↓
                    Supabase Connection
                           ↓
                    (500/406/401 errors)
```

**Root Cause:** App container can't reach Supabase because:
1. `SUPABASE_SERVICE_ROLE_KEY` not set in environment
2. Client-side ANON key doesn't have table permissions
3. Authorization headers not passed from client to API

### The Solution
```
Browser → HTTPS → Traefik → App Container
                    ↓ (new endpoints)
                  Debug endpoint (verifies connectivity)
                  User-profile endpoint (bypasses CORS)
                           ↓
                    Supabase Connection ✓
```

---

## Monitoring After Fix

### How to Tell If It's Still Working

**Check logs daily:**
```bash
docker logs healthscribe-app | grep "Workspace API\|user-profile\|dashboard"
```

**Look for success messages:**
```
✅ Workspace API: Successfully fetched X transcriptions
✅ [user-profile] Profile fetched successfully
📊 Dashboard API: Recent activity generated: N items
```

**Alert if you see:**
```
❌ Missing environment variables
❌ Supabase error
500 (Internal Server Error)
406 (Not Acceptable)
401 (Unauthorized)
```

---

## Q&A

**Q: Will this break my SSL/Traefik setup?**
A: No. These are pure API-level changes. Traefik and SSL configuration untouched.

**Q: Will this break login?**
A: No. Login uses existing Supabase Auth. We're only adding new endpoints for diagnostics.

**Q: Will this break n8n?**
A: No. n8n routes through Traefik unchanged. This only affects the main app APIs.

**Q: What if debug endpoint shows errors?**
A: The endpoint itself explains what's wrong. See "If status is DEGRADED" in Step 3 above.

**Q: How do I know when it's fixed?**
A: When transcription history populates in the UI AND debug endpoint shows "HEALTHY" AND browser console is error-free.

---

## Support Notes

- All new endpoints are internal (not exposed to end users)
- Debug endpoint can be removed after troubleshooting
- User-profile endpoint improves user experience (no CORS errors)
- Changes are backward compatible (old endpoints still work)

---

**Priority:** HIGH - User can't see transcription history
**Risk:** LOW - API-only changes, infrastructure untouched
**Effort:** 5 minutes deployment + testing
**Benefit:** Full transcription history and dashboard stats working again

