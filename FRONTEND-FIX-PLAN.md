# 🎯 Frontend Fix Plan - Transcription History Not Showing

## Problem Identified

**Root Cause**: The `/api/transcriptions/route.ts` API endpoint uses a **hardcoded user ID** instead of getting the authenticated user from the session.

```typescript
// WRONG - Line 14
const userId = '625d7540-ab35-4fee-8817-6d0b32644869'  // ❌ Hardcoded wrong user

// CORRECT - Should be
const userId = session.user.id  // ✅ From authenticated session
```

## Your Actual User ID
- **Email**: omars14@gmail.com
- **Correct User ID**: `4a99755c-53ba-486c-8393-1460561b2259`
- **Hardcoded (Wrong) ID**: `625d7540-ab35-4fee-8817-6d0b32644869`

## Files to Fix

### 1. `/src/app/api/transcriptions/route.ts` ⚠️ CRITICAL
**Issue**: Hardcoded user ID (line 14)
**Impact**: Main transcriptions page shows no data
**Fix**: Get user ID from authenticated session

### 2. Other API Routes (Already Correct ✅)
- `/api/dashboard/stats/route.ts` - ✅ Uses auth token correctly
- `/api/workspace-transcriptions/route.ts` - ✅ Takes userId as parameter
- `/api/admin/transcriptions/route.ts` - ✅ Uses auth token correctly

## Fix Implementation

### Step 1: Fix `/api/transcriptions/route.ts`
Replace hardcoded user ID with proper authentication:

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🚀 API Route: Fetching user transcriptions...')
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ API Route: Missing environment variables')
      return NextResponse.json({ 
        success: false, 
        error: 'Server configuration error'
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Get auth token from request header or cookie
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      // Try to get from cookies
      const cookieStore = request.cookies
      const sessionCookie = cookieStore.get('supabase-auth-token')
      
      if (!sessionCookie) {
        console.error('❌ No auth token found')
        return NextResponse.json({ 
          success: false, 
          error: 'Authentication required'
        }, { status: 401 })
      }
    }
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid authentication'
      }, { status: 401 })
    }
    
    const userId = user.id
    console.log('🚀 API Route: Querying for authenticated user:', user.email, 'ID:', userId)
    
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    console.log('🚀 API Route: Query result:', { 
      dataLength: data?.length, 
      error: error?.message
    })
    
    if (error) {
      console.error('❌ API Route: Supabase error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message
      }, { status: 500 })
    }
    
    console.log('✅ API Route: Successfully fetched', data?.length || 0, 'transcriptions')
    
    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      transcriptions: data || []
    })
    
  } catch (err: any) {
    console.error('❌ API Route: Unexpected error:', err.message)
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Internal server error'
    }, { status: 500 })
  }
}
```

### Step 2: Update Frontend to Send Auth Token
The dashboard pages need to send the auth token. Check if they're already doing it:

**Current Code** (src/app/dashboard/transcriptions/page.tsx line 85-90):
```typescript
const response = await fetch('/api/transcriptions', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
```

**Should Include** (if not already):
```typescript
const { session } = useAuth()  // Get session from AuthContext

const response = await fetch('/api/transcriptions', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`  // Add auth token
  },
})
```

### Step 3: Restart Application
After code changes, restart the Next.js application on VPS.

## Testing Checklist

### Before Fix
- [ ] Login to https://healthscribe.pro/dashboard
- [ ] Check browser console for errors
- [ ] Verify API call to `/api/transcriptions`
- [ ] Confirm it returns 0 transcriptions (wrong user ID)

### After Fix
- [ ] Code updated and deployed
- [ ] Application restarted
- [ ] Clear browser cache
- [ ] Login again
- [ ] Dashboard should show 29 transcriptions
- [ ] Navigate to `/dashboard/transcriptions` - should see list
- [ ] Admin panel should work
- [ ] Check browser console - no errors

## Expected Results

After fix:
- ✅ Dashboard shows transcription count: **29**
- ✅ Recent transcriptions visible
- ✅ `/dashboard/transcriptions` shows full list
- ✅ Admin panel accessible
- ✅ Stats and analytics working

## Rollback Plan

If something breaks:
1. Revert `/src/app/api/transcriptions/route.ts` to previous version
2. Temporarily use the hardcoded correct user ID:
   ```typescript
   const userId = '4a99755c-53ba-486c-8393-1460561b2259'
   ```
3. This will work for you but not for other users

## Additional Notes

- The `/api/dashboard/stats/route.ts` already implements authentication correctly (lines 21-29)
- Use that as a reference for proper auth implementation
- The `/api/workspace-transcriptions/route.ts` takes userId as a URL parameter, which also works

## Timeline

1. **Fix Code**: 5 minutes
2. **Deploy to VPS**: Via git push + Coolify rebuild
3. **Restart App**: 2 minutes (automated)
4. **Test**: 5 minutes
5. **Total**: ~15-20 minutes

---

**Priority**: 🔴 CRITICAL  
**Impact**: High - Main feature not working  
**Difficulty**: Low - Simple code change  
**Risk**: Low - Well-tested pattern

