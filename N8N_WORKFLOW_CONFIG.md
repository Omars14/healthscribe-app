# n8n Workflow Configuration Instructions

## 🎯 Current Status

✅ **What's Working:**
- n8n is running at: http://localhost:5678
- ngrok tunnel is active: https://ccc7729d82f2.ngrok-free.app
- Your Next.js app is running at: http://localhost:3000
- Webhook URL: https://ccc7729d82f2.ngrok-free.app/webhook/upload

## 🔧 Configure Your n8n Workflow

### Step 1: Open n8n Dashboard
Go to: http://localhost:5678

### Step 2: Import or Update Your Workflow

If you need to update your "Medical Audio Transcription - Dual Path" workflow:

1. **Update the Webhook Node:**
   - Click on "Webhook - Receive Medical Audio"
   - Make sure the path is: `/webhook/upload`
   - Set HTTP Method: `POST`
   - Response Mode: "When Last Node Finishes"
   - Click "Save"

2. **Update the Send Result Node:**
   - Click on "Send Transcription Result"
   - Update the URL to: `http://localhost:3000/api/transcription-result-v2`
   - Method: `POST`
   - Body Content Type: `JSON`
   - Click "Save"

3. **Activate the Workflow:**
   - Toggle the "Active" switch at the top right to ON
   - You should see "Active" status

### Step 3: Test the Webhook

The webhook is now receiving data but needs proper configuration. The error shows it's expecting an upload file format.

## 📝 Required Workflow Adjustments

Your workflow needs to handle two scenarios:

### For Small Files (< 2MB):
The app sends:
```json
{
  "body": {
    "uploadId": "xxx",
    "fileName": "audio.mp3",
    "fileContent": "base64_string",
    "doctorName": "Dr. Name",
    "patientName": "Patient Name",
    "documentType": "consultation"
  }
}
```

### For Large Files (> 2MB):
The app sends:
```json
{
  "body": {
    "uploadId": "xxx",
    "fileName": "audio.mp3",
    "instructions": {
      "directUrl": "https://storage_url",
      "primaryUrl": "https://storage_url"
    },
    "doctorName": "Dr. Name",
    "patientName": "Patient Name",
    "documentType": "consultation"
  }
}
```

## 🛠️ Fix the Current Error

The error "Expected UploadFile, received: <class 'str'>" means the webhook is receiving form data but the workflow expects it differently.

### Quick Fix in n8n:

1. **In the Webhook node:**
   - Options → Binary Data: Toggle OFF
   - This will receive JSON instead of form data

2. **Or modify the Extract URL node:**
   - Update to handle the incoming format properly

## 📊 Test URLs

Once configured, test with:

1. **Test Webhook Directly:**
```bash
curl -X POST https://ccc7729d82f2.ngrok-free.app/webhook/upload \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "uploadId": "test-123",
      "fileName": "test.mp3",
      "fileContent": "SGVsbG8gV29ybGQ=",
      "doctorName": "Dr. Test",
      "patientName": "Test Patient",
      "documentType": "consultation"
    }
  }'
```

2. **Test via App:**
   - Go to http://localhost:3000
   - Login and upload a file
   - Check n8n Executions tab

## 🔍 Debugging Tips

1. **Check n8n Executions:**
   - Go to http://localhost:5678
   - Click "Executions" in left sidebar
   - Look for red nodes (errors)
   - Click to see error details

2. **Monitor Logs:**
   - Your app console shows upload attempts
   - n8n shows webhook receipts
   - ngrok admin (http://localhost:4040) shows all requests

## ✅ Success Indicators

When everything is working:
1. File upload succeeds in your app
2. n8n Execution shows green (success)
3. Transcription appears in your app
4. Status updates from "pending" → "processing" → "completed"

## 🚨 Current Issue to Fix

The webhook is receiving data but in the wrong format. You need to:

1. Open n8n: http://localhost:5678
2. Edit your workflow
3. In the Webhook node, disable "Binary Data" option
4. Save and activate the workflow
5. Test again

---

**Services Running:**
- n8n: http://localhost:5678
- ngrok: http://localhost:4040
- Your App: http://localhost:3000
- Webhook: https://ccc7729d82f2.ngrok-free.app/webhook/upload
