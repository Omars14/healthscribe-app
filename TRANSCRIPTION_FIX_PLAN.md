# Transcription History & API Fixes - Implementation Plan

## Current Issues Analysis

### Issue 1: 500 Error on `/api/workspace-transcriptions`
**Error:** `GET /api/workspace-transcriptions?userId=... 500 (Internal Server Error)`

**Root Causes (in order of likelihood):**
1. `SUPABASE_SERVICE_ROLE_KEY` not set in app container environment
2. Supabase URL misconfigured or unreachable
3. `transcriptions` table doesn't exist or has different schema
4. User ID format mismatch

**Console Evidence:**
```
5073.57549177a517305e.js:1 🚀 WORKSPACE: Using API route for transcriptions...
5073.57549177a517305e.js:1  GET https://healthscribe.pro/api/workspace-transcriptions?userId=... 500 (Internal Server Error)
Error fetching transcriptions: Error: Workspace API request failed: 500
```

---

### Issue 2: 406 Not Acceptable on Supabase REST API
**Error:** `GET https://supabase.healthscribe.pro/rest/v1/user_profiles 406 (Not Acceptable)`

**Root Causes:**
1. Missing required `Accept` or `Content-Type` headers from client-side Supabase calls
2. CORS policy not allowing the request (Kong/Supabase misconfigured)
3. POST/PATCH requests using wrong content type
4. ANON key doesn't have permission to access user_profiles table

**Console Evidence:**
```
2354-2d4cd1b1d499aeca.js:21  GET https://supabase.healthscribe.pro/rest/v1/user_profiles?select=*&id=eq.4e298b89-8579-46fc-8c3c-69bb024a5ac3 406
```

---

### Issue 3: 401 Unauthorized on `/api/dashboard/stats`
**Error:** `GET https://healthscribe.pro/api/dashboard/stats 401 (Unauthorized)`

**Root Cause:**
- Authorization header not being passed from frontend to API
- Client not including JWT token in fetch request

**Console Evidence:**
```
page-df120a66601467e3.js:1  GET https://healthscribe.pro/api/dashboard/stats 401 (Unauthorized)
Failed to fetch dashboard stats:
```

---

## Fix Implementation Steps

### STEP 1: Verify Environment Variables in Container
**Location:** Server/Docker environment check

**What to verify:**
```bash
# SSH to server and check container env
docker exec healthscribe-app env | grep -i supabase
```

**Expected output:**
```
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**If missing, add to docker-compose.yml or .env.local**

---

### STEP 2: Add Debug Endpoint to Verify Supabase Connectivity
**File:** `src/app/api/debug-supabase/route.ts`

Create new endpoint that tests Supabase connection without breaking existing code:

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const checks = {
    env: {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    connections: {} as any,
    tables: {} as any
  }

  try {
    // Test with ANON key (client-side)
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )
    
    const { error: anonError } = await anonClient.from('transcriptions').select('count', { count: 'exact' }).limit(1)
    checks.connections.anonKey = anonError ? `Error: ${anonError.message}` : 'OK'

    // Test with SERVICE key (server-side)
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )
    
    const { error: serviceError } = await serviceClient.from('transcriptions').select('count', { count: 'exact' }).limit(1)
    checks.connections.serviceKey = serviceError ? `Error: ${serviceError.message}` : 'OK'

    // Test user_profiles table
    const { data, error: profileError } = await serviceClient
      .from('user_profiles')
      .select('count', { count: 'exact' })
      .limit(1)
    
    checks.tables.user_profiles = profileError ? `Error: ${profileError.message}` : 'OK'

    // Test transcriptions table
    const { data: transData, error: transError } = await serviceClient
      .from('transcriptions')
      .select('count', { count: 'exact' })
      .limit(1)
    
    checks.tables.transcriptions = transError ? `Error: ${transError.message}` : 'OK'

  } catch (err: any) {
    return NextResponse.json({ checks, error: err.message }, { status: 500 })
  }

  return NextResponse.json(checks)
}
```

**Usage:** Visit `https://healthscribe.pro/api/debug-supabase` to see what's working/broken

---

### STEP 3: Fix Dashboard Stats - Add Auth Header
**File:** `src/app/dashboard/workspace.tsx` or client component calling stats

**Change from:**
```typescript
const response = await fetch(`/api/dashboard/stats`)
```

**Change to:**
```typescript
const token = await supabase.auth.getSession()
const response = await fetch(`/api/dashboard/stats`, {
  headers: {
    'Authorization': `Bearer ${token?.data?.session?.access_token}`
  }
})
```

---

### STEP 4: Fix User Profiles 406 Error
**Location:** Client-side Supabase auth profile fetch

**Root cause:** ANON key doesn't have SELECT access to `public.user_profiles` table

**Solution Options:**

**Option A (Recommended): Use API endpoint for profile fetch**
```typescript
// Instead of:
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId)
  .single()

// Use:
const response = await fetch(`/api/user-profile?id=${userId}`)
const profile = await response.json()
```

**Option B: Fix Supabase RLS Policies**
- Login to Supabase dashboard
- Go to `Authentication` → `Policies` 
- For `user_profiles` table, add SELECT policy:
  ```sql
  CREATE POLICY "Users can read their own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);
  ```

---

### STEP 5: Create API Endpoint for User Profiles
**File:** `src/app/api/user-profile/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

---

## Implementation Checklist

- [ ] **Step 1:** Check environment variables in running container
  ```bash
  docker exec healthscribe-app env | grep SUPABASE
  ```

- [ ] **Step 2:** Create debug endpoint (`/api/debug-supabase`) and test connectivity

- [ ] **Step 3:** Fix dashboard stats endpoint - add Authorization header in client calls

- [ ] **Step 4:** Create user-profile API endpoint

- [ ] **Step 5:** Update client to use new endpoints instead of direct Supabase calls

- [ ] **Step 6:** Verify transcription history loads
  - Login to app
  - Navigate to workspace/transcriptions page
  - Confirm list appears without errors

- [ ] **Step 7:** Verify dashboard stats load
  - Check dashboard page
  - Confirm stats, charts, and recent activity visible

- [ ] **Step 8:** Regression testing (ensure no breakage)
  - SSL/HTTPS working ✓
  - Login page loads ✓
  - n8n accessible ✓
  - All API endpoints responding ✓

---

## Expected Outcomes After Fix

### Before (Current State)
```
Console Errors:
✗ GET /api/workspace-transcriptions 500
✗ GET /rest/v1/user_profiles 406
✗ GET /api/dashboard/stats 401
✗ Transcription history blank
✗ Dashboard stats empty
```

### After (Fixed State)
```
Console Output:
✓ GET /api/workspace-transcriptions 200 (returns transcriptions array)
✓ GET /api/user-profile 200 (returns profile object)
✓ GET /api/dashboard/stats 200 (returns stats JSON)
✓ Transcription history populated
✓ Dashboard stats displayed
✓ SSL/Login/n8n still working
```

---

## Rollback Plan

If fixes cause issues, rollback is simple:
```bash
# Revert code changes
git checkout src/app/dashboard/
git checkout src/app/api/

# Restart container
docker-compose restart healthscribe-app

# Services return to previous state
```

Since all fixes are API-level (no infrastructure changes), rollback has zero risk to SSL, Traefik, or container networking.

---

## Root Cause Analysis

### Why This Broke After Traefik Fix

1. **Traefik addition didn't break APIs** - but it exposed an existing issue
2. **Environment variables weren't propagated properly** to new container
3. **Supabase wasn't accessible** from app container during initial Traefik setup
4. **Client-side auth logic changed** - now relies on API endpoints

### Prevention Strategy Going Forward

1. Always verify environment variables after infrastructure changes
2. Test API endpoints after any networking changes
3. Use debug endpoints to diagnose connectivity issues
4. Document all environment dependencies
5. Add startup checks in application

