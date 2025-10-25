# 🚨 EMERGENCY FIX - RUN NOW

## What Happened

The deployment script couldn't find:
1. Supabase environment variables (empty .env.local)
2. Git repository (website broken - HTTP 000)
3. New code files (not deployed)

## Fix It Now

### Step 1: Get Your Supabase Credentials

Before running the fix script, you need 3 credentials from Supabase:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Go to: https://app.supabase.com
   - Look for "Project URL" - looks like: `https://xxx.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - In Supabase dashboard → Settings → API
   - Copy "anon public" key - starts with `eyJ...`

3. **SUPABASE_SERVICE_ROLE_KEY** ⭐ MOST IMPORTANT
   - In Supabase dashboard → Settings → API
   - Copy "service_role secret" key - starts with `eyJ...`

**Have these 3 values ready before proceeding!**

---

### Step 2: Run Emergency Fix

```bash
node emergency-fix.js
```

The script will:
1. Stop the broken container
2. Ask you for the 3 Supabase credentials
3. Add them to `.env.local`
4. Rebuild the container with proper credentials
5. Test everything
6. Show you the results

---

## When Script Asks for Input

```
Enter NEXT_PUBLIC_SUPABASE_URL (e.g., https://xxx.supabase.co): 
```

**Paste your URL**, press Enter

```
Enter NEXT_PUBLIC_SUPABASE_ANON_KEY (starts with eyJ...): 
```

**Paste your ANON key**, press Enter

```
Enter SUPABASE_SERVICE_ROLE_KEY (starts with eyJ...): 
```

**Paste your SERVICE ROLE key**, press Enter

**That's it!** Script continues automatically.

---

## Expected Output

✅ Containers stopped
✅ Credentials added to .env.local
✅ Container rebuilt
✅ Application restarted
✅ Endpoints tested
✅ All working!

---

## After Fix Completes

1. Wait 2 minutes for app to fully start
2. Visit: https://healthscribe.pro
3. Clear cache: Ctrl+Shift+Del
4. Login
5. Check transcription history ✓

---

## If You're Still Stuck

1. Check debug endpoint: https://healthscribe.pro/api/debug-supabase
2. Should show: `"status": "HEALTHY"`
3. If it shows errors, read the errors array
4. Check logs: `docker logs healthscribe-app -f`

---

## Time Required

~5 minutes total

---

## Run This NOW:

```bash
node emergency-fix.js
```