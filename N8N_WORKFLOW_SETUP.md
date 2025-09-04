# n8n Workflow Setup - Medical Audio Transcription

## ✅ Your Workflow Configuration

Based on your "Medical Audio Transcription - Dual Path" workflow, here's what needs to be configured:

## 1. 🔧 Update n8n Webhook URL

Your n8n webhook needs to be accessible. The current URL appears to be down:
- Current: `https://76e74b5ff10b.ngrok-free.app/webhook/upload`

### To get your correct webhook URL:

1. Open n8n
2. Open your "Medical Audio Transcription - Dual Path" workflow
3. Click on the **"Webhook - Receive Medical Audio"** node
4. Look for the **Production URL** or **Test URL**
5. Copy that URL

### Update your .env.local:
```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=<your-actual-webhook-url>
```

## 2. 📝 Update Callback URL in n8n

Your n8n workflow needs to know where to send results back.

1. In n8n, open your workflow
2. Find the **"Send Transcription Result"** node (last node in the workflow)
3. Update the URL field to one of these:

### For Local Development:
```
http://localhost:3000/api/transcription-result-v2
```

### For Production:
```
https://healthscribeai.vercel.app/api/transcription-result-v2
```
(or your actual production domain)

### If using ngrok for local testing:
```
https://your-ngrok-url.ngrok-app/api/transcription-result-v2
```

## 3. 🔑 Verify OpenAI Credentials

Your workflow uses OpenAI Whisper for transcription:

1. In n8n, go to **Credentials** (left sidebar)
2. Find **"OpenAi account"** credential
3. Make sure your OpenAI API key is set and valid
4. Test the connection

## 4. 🚀 Activate the Workflow

**IMPORTANT**: The workflow must be active to receive webhooks!

1. Open your workflow in n8n
2. Toggle the **Active** switch (top right) to ON
3. You should see a green "Active" badge

## 5. 🧪 Test the Integration

Run our test script to verify everything works:

```bash
node test-n8n-integration.js
```

You should see:
- ✅ n8n webhook is accessible
- ✅ Callback endpoint is accessible

## 6. 📊 Data Flow

Here's how your data flows through the system:

```
Your App → n8n Webhook → Extract URL → Whisper → Process Result → Send Back to App
```

### Small Files (<2MB):
1. App sends base64 encoded audio in `body.fileContent`
2. n8n converts to binary
3. Sends to OpenAI Whisper
4. Returns transcription to your app

### Large Files (>2MB):
1. App uploads to Supabase Storage
2. Sends URL in `body.instructions.directUrl`
3. n8n fetches from URL
4. Sends to OpenAI Whisper
5. Returns transcription to your app

## 7. 🔍 Debugging

### Check n8n Executions:
1. In n8n, click **Executions** (left sidebar)
2. Look for recent runs of your workflow
3. Click on any execution to see details
4. Red nodes indicate errors

### Common Issues:

| Issue | Solution |
|-------|----------|
| Webhook returns 404 | Workflow not active or URL incorrect |
| No executions appear | Check webhook URL in .env.local |
| Transcription fails | Check OpenAI API key and quota |
| Callback fails | Update Send Result node URL |
| Large files fail | Check Supabase storage configuration |

## 8. 📋 Environment Variables Summary

Make sure these are set in your `.env.local`:

```env
# n8n Webhook (get from n8n webhook node)
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-url/webhook/upload

# Your app URL (for callbacks)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://yaznemrwbingjwqutbvb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 9. 🎯 Quick Checklist

- [ ] n8n is running
- [ ] Workflow is **Active** (not just saved)
- [ ] Webhook URL in .env.local matches n8n
- [ ] Callback URL in n8n points to your app
- [ ] OpenAI credentials are configured
- [ ] Supabase storage bucket exists
- [ ] App is running (`npm run dev`)

## 10. 🚦 Ready to Test!

1. Start your app:
   ```bash
   npm run dev
   ```

2. Go to http://localhost:3000

3. Sign up/login

4. Upload a test audio file

5. Watch the magic happen:
   - File uploads
   - Status changes to "processing"
   - n8n processes the audio
   - Transcription appears

## Need Help?

- Check n8n Executions for errors
- Run `node test-n8n-integration.js` to test connections
- Check browser console for JavaScript errors
- Check terminal for API errors

---

**Last Updated**: January 18, 2025
**Workflow**: Medical Audio Transcription - Dual Path
**Status**: Ready for configuration
