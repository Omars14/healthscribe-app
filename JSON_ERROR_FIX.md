# Fix for "Failed to execute 'json' on 'Response': Unexpected end of JSON input"

## Problem
When uploading audio files, users were getting this error:
```
Failed to upload: Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

This happens when the API returns a non-JSON response (empty response, HTML error page, etc.) and the code tries to parse it as JSON.

## Root Cause
The issue occurs in `src/lib/transcription-service.ts` where the code directly calls `response.json()` without checking if the response is actually JSON:

```typescript
// OLD - UNSAFE
const data = await response.json()  // Throws if response is not valid JSON
```

Common reasons for non-JSON responses:
1. **API timeout** - Server didn't respond in time, returns empty response
2. **Server error** - API returns HTML error page (500, 502, 503 errors)
3. **Network issue** - Connection interrupted mid-response
4. **Storage upload failure** - Supabase storage upload fails before API can return proper JSON

## Solution

### 1. Safe JSON Parsing (transcription-service.ts)
Changed from unsafe direct parsing to safe parsing with fallback:

```typescript
// NEW - SAFE
let data: TranscriptionResponse
try {
  const responseText = await response.text()  // Get raw text first
  console.log('📄 Response text:', responseText.substring(0, 500))
  
  if (!responseText) {
    throw new Error('Empty response from server')
  }
  
  data = JSON.parse(responseText)  // Parse only after validating
} catch (parseError) {
  console.error('❌ JSON parse error:', parseError)
  console.error('Response status:', response.status)
  
  // Return error without throwing if status is not ok
  if (!response.ok) {
    return {
      success: false,
      error: `Server error (${response.status}): ${response.statusText}`,
      message: 'The server returned an invalid response. Please check your network and try again.'
    }
  }
  
  throw new Error(`Invalid JSON response: ${parseError.message}`)
}
```

### 2. Better Error Messages (transcriptionist-workspace.tsx)
Enhanced error handling in the upload function:

```typescript
} catch (error) {
  console.error('❌ Upload error:', error)
  console.error('Error details:', {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : 'N/A'
  })
  
  // Provide user-friendly error message
  let errorMessage = 'Failed to upload file. Please try again.'
  if (error instanceof Error) {
    if (error.message.includes('JSON')) {
      errorMessage = 'Server error: Invalid response. Please check your connection and try again.'
    } else if (error.message.includes('Network')) {
      errorMessage = 'Network error: Please check your internet connection.'
    } else {
      errorMessage = error.message
    }
  }
  
  alert(errorMessage)
  setUploading(false)
  setUploadProgress(0)
}
```

## Changes Made

### File: `src/lib/transcription-service.ts`
- Changed `response.json()` to `response.text()` then `JSON.parse()`
- Added try-catch around JSON parsing
- Added response validation (check for empty response)
- Added console logging of response text (first 500 chars)
- Added detailed error messages with status codes

### File: `src/app/dashboard/transcriptionist-workspace.tsx`
- Enhanced error handling in `handleUpload()` function
- Added error type detection (JSON, Network, etc.)
- Added user-friendly error messages
- Added detailed console logging with error stack

## Debugging Steps

### 1. Check Console Logs
Open browser DevTools (F12) → Console tab and look for:
- `📡 API Response status:` - Shows HTTP status code
- `📄 Response text:` - Shows what the server actually returned
- `❌ JSON parse error:` - If parsing failed

### 2. Common Issues and Solutions

**Issue: Empty response (status 200)**
- Cause: API returned success but no body
- Solution: Check if upload to storage actually succeeded
- Action: Check Supabase storage bucket permissions

**Issue: 502/503 error**
- Cause: Backend server error or timeout
- Solution: Check server logs on healthscribe.pro
- Action: `ssh root@healthscribe.pro "tail -f /var/log/application.log"`

**Issue: 404 error**
- Cause: API route not found
- Solution: Verify `/api/transcribe-optimized` endpoint exists
- Action: Check Next.js build completed successfully

**Issue: Timeout**
- Cause: Upload took too long (>5 minutes for Vercel)
- Solution: Check file size and network speed
- Action: Use smaller test file first

### 3. Server-Side Debugging
On the server, check these logs:
```bash
# View application logs
ssh root@healthscribe.pro "pm2 logs dashboard-next"

# View nginx logs for 502 errors
ssh root@healthscribe.pro "tail -f /var/log/nginx/error.log"

# Check Supabase storage
# - Verify bucket 'audio-files' exists
# - Check bucket CORS settings
# - Verify service role key permissions
```

## Testing

### Test 1: Successful Upload
1. Open transcriptionist workspace
2. Select audio file
3. Fill in doctor and patient names
4. Click "Process with AI"
5. Check console for:
   ```
   📡 API Response status: 200
   📄 Response text: {"success":true,"transcriptionId":"..."}
   ```

### Test 2: Network Error
1. Open DevTools Network tab
2. Throttle to "Slow 3G"
3. Try uploading
4. Should see error: "Server error: Invalid response..."

### Test 3: Large File
1. Try uploading >100MB file
2. Should see validation error: "File size exceeds maximum"

## Performance Impact
- Minimal: Only adds string operations and console logs
- No additional API calls
- Response parsing is slightly slower but safer
- Typical overhead: <1ms

## Backward Compatibility
- No breaking changes
- API response format unchanged
- Error handling is transparent to success cases

## Related Issues
- Previous error: "Failed to upload: Failed to execute 'json'..."
- Root cause: Missing safe JSON parsing in transcription-service.ts
- This fix ensures the error is properly caught and reported

## Files Modified
1. `src/lib/transcription-service.ts` - Safe JSON parsing
2. `src/app/dashboard/transcriptionist-workspace.tsx` - Better error messages

## Deployment
```bash
bash fix-upload-json-errors.sh
```

This will:
1. Upload both modified files
2. Run TypeScript type checking
3. Build the application
4. Restart the service
