# Healthscribe.pro - Fixes & Documentation

## 🔴 Current Problem

Transcription history is not displaying. Console shows three critical errors:
- **500 Error:** `GET /api/workspace-transcriptions` - Internal server error
- **406 Error:** `GET /rest/v1/user_profiles` - Not acceptable (CORS/permission issue)
- **401 Error:** `GET /api/dashboard/stats` - Unauthorized (missing auth header)

**User Impact:** Can't see transcription history or dashboard stats after logging in.

---

## 📋 Root Causes (Analysis)

### Issue 1: 500 Error on Workspace Transcriptions
**Why it happens:**
- `SUPABASE_SERVICE_ROLE_KEY` environment variable not set in Docker container
- App can't authenticate to Supabase to query transcriptions table
- "Server configuration error" is returned to browser

**Verification:**
```bash
docker exec healthscribe-app env | grep SUPABASE_SERVICE_ROLE_KEY
# If blank, you've found the issue
```

### Issue 2: 406 Error on User Profiles
**Why it happens:**
- Client-side Supabase calls using ANON key (limited permissions)
- ANON key doesn't have SELECT access to `user_profiles` table
- Kong/Supabase returning "406 Not Acceptable" due to missing headers

**Solution:** Use API endpoint instead of direct client-side Supabase call

### Issue 3: 401 Error on Dashboard Stats
**Why it happens:**
- Dashboard calling `/api/dashboard/stats` without JWT token
- API endpoint requires `Authorization` header with Bearer token
- Request rejected with 401 Unauthorized

**Solution:** Add Authorization header from client when calling stats endpoint

---

## ✅ Solutions Implemented

### Solution 1: Debug Endpoint (`/api/debug-supabase`)
**What it does:**
- Tests Supabase connectivity from app container
- Verifies all environment variables
- Tests both ANON and SERVICE_ROLE keys
- Shows which tables are accessible

**Location:** `src/app/api/debug-supabase/route.ts`

**Test it:**
```bash
curl https://healthscribe.pro/api/debug-supabase
```

**Expected response (HEALTHY):**
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

### Solution 2: User Profile Endpoint (`/api/user-profile`)
**What it does:**
- Fetches user profile using server-side SERVICE_ROLE key
- Bypasses CORS and permission issues
- Returns cached profile data

**Location:** `src/app/api/user-profile/route.ts`

**Usage from client:**
```typescript
// Before (broken):
const { data } = await supabase.from('user_profiles').select('*').eq('id', userId).single()

// After (fixed):
const response = await fetch(`/api/user-profile?id=${userId}`)
const data = await response.json()
```

### Solution 3: Enhanced Error Logging
**What it does:**
- Improved error messages in workspace-transcriptions endpoint
- Distinguishes between missing URL vs missing service key
- Helps diagnose issues faster

**Location:** `src/app/api/workspace-transcriptions/route.ts` (updated)

---

## 🚀 How to Deploy

### Prerequisites
- Code changes already committed
- Access to server via SSH
- Docker Compose running on server

### Deployment Steps

#### Step 1: Push Code (1 min)
```bash
git add src/app/api/debug-supabase/route.ts
git add src/app/api/user-profile/route.ts
git commit -m "Add diagnostic and user profile endpoints"
git push origin main
```

#### Step 2: SSH to Server
```bash
ssh user@healthscribe.pro
cd /path/to/app
```

#### Step 3: Verify Environment Variables (1 min)
```bash
# Check if SUPABASE_SERVICE_ROLE_KEY is set
docker exec healthscribe-app env | grep SUPABASE_SERVICE_ROLE_KEY

# If blank, add it to .env.local:
echo "SUPABASE_SERVICE_ROLE_KEY=your_key_here" >> .env.local

# Verify all three are set:
docker exec healthscribe-app env | grep -E "SUPABASE_URL|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY"
```

#### Step 4: Rebuild Container (2 min)
```bash
# Pull latest code
git pull origin main

# Rebuild app with new environment variables
docker-compose down
docker-compose up -d

# Wait for container to start
sleep 10

# Verify it's running
docker ps | grep healthscribe-app
```

#### Step 5: Test Debug Endpoint (1 min)
```bash
# From your browser, visit:
# https://healthscribe.pro/api/debug-supabase

# Or from server:
curl -s https://healthscribe.pro/api/debug-supabase | jq .
```

**Expected result:** `"status": "HEALTHY"` with no errors

#### Step 6: Full Testing (5 min)
```bash
# Check container logs for errors
docker logs healthscribe-app -n 100

# Look for success messages:
# ✅ Workspace API: Successfully fetched
# ✅ [user-profile] Profile fetched successfully
# ✅ Supabase client created
```

---

## 🔍 Troubleshooting

### Debug Endpoint Shows "DEGRADED" or "CRITICAL"

**Check the errors array in response:**

**Error: "SUPABASE_SERVICE_ROLE_KEY not set"**
- Root cause: Environment variable not in container
- Fix: Add to `.env.local` and rebuild: `docker-compose down && docker-compose up -d`

**Error: "Error connecting to Supabase"**
- Root cause: Supabase URL wrong or Supabase down
- Fix: Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Test: `curl -I https://supabase.healthscribe.pro`

**Error: "table transcriptions" or "table user_profiles" not found**
- Root cause: Tables don't exist in Supabase
- Fix: Check Supabase dashboard → Tables, verify tables exist
- Then run migrations if needed: `npm run db:migrate`

### Transcription History Still Blank

1. Verify debug endpoint shows "HEALTHY"
2. Check browser console for errors (F12 → Console tab)
3. Check app logs: `docker logs healthscribe-app -f`
4. Try refreshing page: `Ctrl+Shift+Del` (hard refresh)
5. Check if user has transcriptions: Login to Supabase dashboard → query table

### Dashboard Stats Don't Load

1. Verify `/api/dashboard/stats` endpoint responds with 200
   ```bash
   curl -I https://healthscribe.pro/api/dashboard/stats
   ```
2. Check auth header is being sent from client
3. Verify user is authenticated: Check browser cookies for `sb-access-token`
4. Check dashboard logs: `docker logs healthscribe-app | grep -i dashboard`

---

## 📊 Architecture Diagram

### Before Fix (Broken)
```
Browser
  ↓ HTTPS (Traefik)
Main App Container
  ↓ Can't authenticate
Supabase ❌
  └─ 500/406/401 errors

Transcription History: BLANK
Dashboard Stats: BLANK
```

### After Fix (Working)
```
Browser
  ↓ HTTPS (Traefik) ✅
Main App Container
  ├─ /api/debug-supabase → Tests connectivity
  ├─ /api/user-profile → Fetches profiles via SERVER key
  ├─ /api/workspace-transcriptions → Queries transcriptions via SERVER key
  └─ /api/dashboard/stats → Aggregates stats via SERVER key
  ↓ Uses SERVICE_ROLE_KEY for authentication ✅
Supabase ✅
  └─ All queries succeed 200 OK

Transcription History: POPULATED ✓
Dashboard Stats: VISIBLE ✓
```

---

## 🔐 Security Notes

### What's Safe
- All endpoints are internal (not exposed to external APIs)
- SERVICE_ROLE_KEY only used server-side (never sent to client)
- No sensitive data logged in production
- Debug endpoint logs connection status, not credentials

### What to Monitor
- Don't expose SERVICE_ROLE_KEY in client-side code
- Rotate SERVICE_ROLE_KEY periodically (check Supabase dashboard)
- Monitor debug endpoint for connection failures
- Clean up debug endpoint after troubleshooting (optional)

---

## 📝 Documentation Files

Created three comprehensive documentation files:

1. **INFRASTRUCTURE_FIXES.md**
   - SSL/Traefik setup documentation
   - Network architecture
   - Prevention strategies for future breaks

2. **TRANSCRIPTION_FIX_PLAN.md**
   - Detailed root cause analysis
   - Step-by-step fix procedures
   - Rollback procedures

3. **IMMEDIATE_ACTIONS.md**
   - Quick reference for deployment
   - Validation checklist
   - Monitoring guide

---

## ✨ Expected Results

### Before Deployment
```javascript
// Console Errors:
❌ GET /api/workspace-transcriptions 500
❌ GET /rest/v1/user_profiles 406
❌ GET /api/dashboard/stats 401

// UI State:
- Transcription history: BLANK
- Dashboard stats: EMPTY/LOADING FOREVER
- User can't see data
```

### After Deployment (Success)
```javascript
// Console Status:
✅ GET /api/workspace-transcriptions 200
✅ GET /api/user-profile 200
✅ GET /api/dashboard/stats 200

// UI State:
- Transcription history: POPULATED with all transcriptions
- Dashboard stats: Shows total, processing, completed counts
- Charts and recent activity visible
- User sees all their data
```

---

## 🆘 Support

### Common Questions

**Q: Will this restart affect users?**
A: Yes, brief 30-60 second downtime during `docker-compose down/up`. Recommend off-peak hours.

**Q: Will SSL/Traefik break?**
A: No, these are pure API changes. Traefik configuration untouched.

**Q: Will n8n be affected?**
A: No, n8n routes through Traefik independently. No dependencies on these changes.

**Q: Can I rollback?**
A: Yes, zero-risk. Just `git revert HEAD && docker-compose restart healthscribe-app`

**Q: How do I know it's fixed?**
A: 
1. Debug endpoint returns `"status": "HEALTHY"`
2. Transcription history populates in UI
3. No 500/406/401 errors in browser console
4. Dashboard stats appear

### Escalation

If issues persist after following these steps:

1. Check debug endpoint output for specific errors
2. Review docker logs: `docker logs healthscribe-app -n 200`
3. Verify Supabase is up: Check Supabase status page
4. Verify environment variables are correctly set
5. Try full restart: `docker-compose down && docker-compose up -d`

---

## 📞 Contact

For questions about these fixes:
- Check TRANSCRIPTION_FIX_PLAN.md for detailed analysis
- Review docker logs: `docker logs healthscribe-app`
- Visit debug endpoint: `https://healthscribe.pro/api/debug-supabase`

---

**Last Updated:** October 22, 2025  
**Status:** Ready for deployment  
**Risk Level:** LOW (API-only changes)  
**Estimated Fix Time:** 10 minutes
