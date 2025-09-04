# Medical Transcription Webhook Configuration Fix Summary

## ✅ Changes Made

### 1. Environment Variables Updated (.env.local)
- **N8N_WEBHOOK_URL**: Changed to `http://localhost:5678/webhook-test/medical-transcribe-v2`
- **NEXT_PUBLIC_WEBHOOK_URL**: Changed to `http://localhost:5678/webhook-test/medical-transcribe-v2`
- **NEXT_PUBLIC_N8N_WEBHOOK_URL**: Changed to `http://localhost:5678/webhook-test/medical-transcribe-v2`
- **NEXT_PUBLIC_URL**: Changed to `http://localhost:3001` (matching your dev server port)
- **NEXT_PUBLIC_API_URL**: Changed to `http://localhost:3001`

### 2. API Route Updated (src/app/api/transcribe-medical/route.ts)
- Updated fallback webhook URL to: `http://localhost:5678/webhook-test/medical-transcribe-v2`
- Updated callback URL to use port 3001: `http://localhost:3001/api/transcription-result-v2`

## 🔍 Issues Found

### 1. ✅ FIXED: Webhook URL Mismatch
- **Previous**: Using production ngrok URL that wasn't accessible locally
- **Fixed**: Now using local n8n webhook URL

### 2. ✅ FIXED: Port Configuration
- **Previous**: Using port 3000 which was occupied
- **Fixed**: Now using port 3001 consistently

### 3. ⚠️ NEEDS ACTION: n8n Webhook Not Registered
- **Issue**: The webhook path `medical-transcribe-v2` is not registered in n8n
- **Fix Required**: See instructions below

## 📝 Action Required: Register n8n Webhook

### Step 1: Open n8n
Navigate to http://localhost:5678

### Step 2: Create or Open Your Medical Transcription Workflow
1. If you don't have a workflow yet, create a new one
2. If you have an existing workflow, open it for editing

### Step 3: Configure the Webhook Node
1. Add or edit a **Webhook** node (should be the first node)
2. Configure it with:
   - **HTTP Method**: POST
   - **Path**: `medical-transcribe-v2` (without leading slash)
   - **Response Mode**: "When Last Node Finishes"
   - **Response Data**: "All Entries"

### Step 4: Add Processing Nodes
Your workflow should include:
1. **Webhook** node (trigger)
2. **Gemini** node for transcription (use Gemini 2.5 mini)
3. **Code/Function** node for formatting based on document type
4. **HTTP Request** node to callback to your app
5. **Supabase** node to update the database

### Step 5: Activate the Workflow
- For testing: Click "Execute Workflow" button (works for one request)
- For production: Toggle the workflow to "Active" status

## 🧪 Testing the System

### 1. Quick Test
```bash
# Run the test script
node test-upload-flow.js
```

### 2. Full Test
1. Log in at http://localhost:3001/login
   - Use the admin account you created
2. Navigate to http://localhost:3001/medical-transcription
3. Fill in the form:
   - Doctor Name: Dr. Test Smith
   - Patient Name: Test Patient
   - Document Type: Consultation Note
   - Upload a test audio file
4. Submit and monitor:
   - Check browser console for errors
   - Check n8n execution at http://localhost:5678
   - Check Supabase dashboard for new records

## 🎯 Verification Checklist

- [x] Environment variables updated
- [x] API routes updated with correct URLs
- [x] Supabase storage bucket exists (`audio-files`)
- [x] Database tables exist (`transcriptions`, `document_templates`)
- [x] Document templates loaded (8 types available)
- [ ] n8n webhook registered and active
- [ ] Test upload successful
- [ ] Transcription processed and stored

## 🚀 Quick Links

- **Your App**: http://localhost:3001
- **Login Page**: http://localhost:3001/login
- **Admin Setup**: http://localhost:3001/admin-setup
- **Medical Transcription**: http://localhost:3001/medical-transcription
- **n8n Editor**: http://localhost:5678
- **Supabase Dashboard**: https://supabase.com/dashboard/project/yaznemrwbingjwqutbvb

## 📊 System Status

| Component | Status | Notes |
|-----------|--------|-------|
| Next.js App | ✅ Running | Port 3001 |
| Supabase | ✅ Connected | Tables and storage ready |
| n8n | ⚠️ Needs Config | Webhook registration required |
| Authentication | ✅ Ready | Login required for uploads |

## 🔧 Troubleshooting

### If upload fails with "webhook not registered":
1. Open n8n at http://localhost:5678
2. Click "Execute Workflow" to enable test mode
3. Try the upload again

### If upload succeeds but no transcription:
1. Check n8n execution history
2. Verify Gemini API credentials in n8n
3. Check callback URL is accessible

### If transcription completes but not saved:
1. Check Supabase RLS policies
2. Verify service role key in environment
3. Check transcription-result-v2 API endpoint logs

## 📝 Notes

- The webhook URL uses `/webhook-test/` for development mode
- In production, use `/webhook/` without the `-test` part
- The callback URL must be accessible from n8n (use ngrok if n8n is remote)
- Document templates determine the formatting style applied to transcriptions
