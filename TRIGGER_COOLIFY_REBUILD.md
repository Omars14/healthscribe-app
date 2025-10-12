# 🔄 Coolify Rebuild Required

## ⚠️ **SITUATION**

Your code changes are committed to GitHub, but the running app is still using the **old JavaScript bundle**.

**Evidence from console:**
```
Uploading file via API route (bypasses RLS)...  ❌ OLD CODE
✅ Transcription submitted: ...                  ❌ OLD CODE
```

**Should see (with new code):**
```
📤 Starting upload: filename.mp3                 ✅ NEW CODE
✅ Upload successful, ID: ...                    ✅ NEW CODE
🔄 Fetching transcriptions to show new upload... ✅ NEW CODE
```

---

## 🚀 **SOLUTION: Trigger Coolify Rebuild**

### **Option 1: Via Coolify UI (Recommended)**

1. Go to: **Coolify Dashboard**
2. Find your **healthscribe** application
3. Click "**Force Rebuild Deploy**" or "**Redeploy**"
4. Wait 2-3 minutes for build to complete
5. Hard refresh browser: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

### **Option 2: Via Command Line**

Run this command on your VPS:

```bash
# Find the application container
docker ps | grep tkwoos4

# Restart Coolify to trigger auto-redeploy
systemctl restart coolify

# OR manually rebuild (if you know the build directory)
cd /data/coolify/sources/<your-app-id>
git pull origin master
docker build -t healthscribe-new:latest .
docker restart tkwoos4soccckws84088wc04-184252873467
```

### **Option 3: Wait for Auto-Deploy**

If you have auto-deploy enabled:
- Coolify should automatically detect the new commits
- It may take 5-15 minutes to trigger
- Check Coolify logs for deployment status

---

## ✅ **HOW TO VERIFY IT WORKED**

1. **Hard refresh** your browser (Ctrl+Shift+R)
2. **Open console** (F12)
3. **Upload a file**
4. **Check console logs** for:
   ```
   📤 Starting upload: filename.mp3        ← NEW CODE
   ✅ Upload successful, ID: abc-123       ← NEW CODE
   🔄 Fetching transcriptions...           ← NEW CODE
   ✅ Found new upload in list            ← NEW CODE
   ```

5. **Verify behavior:**
   - File appears IMMEDIATELY in list (no refresh needed)
   - Blue highlight ring appears
   - Auto-selects the new upload

---

## 🛠️ **WHAT THE NEW CODE DOES**

### **Before (Old Code):**
```javascript
// Created temporary "optimistic" transcription
const optimisticTranscription = {
  id: `temp-${Date.now()}`,  // ← Fake ID causes sync issues
  ...
}
setTranscriptions(prev => [optimisticTranscription, ...prev])
// Never properly replaced with real data
```

### **After (New Code):**
```javascript
// NO optimistic UI - wait for real response
const response = await submitTranscription(...)

if (response.success && response.transcriptionId) {
  // IMMEDIATELY fetch from database with REAL data
  await fetchTranscriptions(false, true) // Force refresh
  
  // Find and select the new upload
  const newItem = prev.find(t => t.id === response.transcriptionId)
  setSelectedTranscription(newItem)
}
```

---

## 🐛 **TROUBLESHOOTING**

### **Still seeing old code after rebuild:**
1. **Clear browser cache completely**
   - Chrome: Ctrl+Shift+Delete → Clear cached images and files
   - Or use Incognito/Private mode

2. **Check if build actually ran:**
   ```bash
   docker logs tkwoos4soccckws84088wc04-184252873467 --tail 50
   ```
   Look for recent timestamps

3. **Verify Git commits reached the server:**
   ```bash
   cd /data/coolify/sources/<app-id>
   git log --oneline -5
   ```
   Should show commits: `623a42e` and `de468e8`

### **Container won't restart:**
- Check Coolify logs: `/var/log/coolify/`
- Check Docker logs: `docker ps -a` (look for exited containers)
- Verify disk space: `df -h`

---

## 📊 **SUMMARY**

| Status | Item |
|--------|------|
| ✅ | Code written and tested |
| ✅ | Committed to GitHub (`623a42e`, `de468e8`) |
| ✅ | Pushed to `master` branch |
| ⏳ | **Coolify rebuild needed** |
| ⏳ | Browser hard refresh needed |

---

## 💡 **QUICK COMMAND TO FORCE REBUILD**

If you have SSH access:

```bash
ssh root@154.26.155.207 "docker restart tkwoos4soccckws84088wc04-184252873467"
```

Then wait 30 seconds and hard refresh your browser.

---

**The fix is ready, it just needs to be deployed!** 🚀

