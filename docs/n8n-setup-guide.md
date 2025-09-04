# n8n Setup Guide for Medical Transcription System

## Prerequisites

1. **n8n Instance**: You need n8n installed and running. Options:
   - Self-hosted: Docker, npm, or n8n Desktop
   - Cloud: n8n Cloud (https://n8n.io/cloud)

2. **Tunnel/Public URL**: For local development, use ngrok or similar:
   ```bash
   ngrok http 5678
   ```

## Step 1: Import the Workflow

1. Open your n8n instance
2. Click **"Import from File"** or **"Import from URL"**
3. Import the `n8n-workflow.json` file from this repository
4. You should see a workflow with 4 nodes:
   - Webhook (trigger)
   - Get Audio File (processing)
   - Transcribe Audio (placeholder)
   - Update App DB (callback)

## Step 2: Configure the Webhook Node

1. Click on the **Webhook** node
2. Copy the Production URL (it will look like: `https://your-n8n.com/webhook/abc123`)
3. Save this URL - you'll need it for your `.env.local` file

## Step 3: Set Up Transcription Service

Replace the placeholder "Transcribe Audio" node with your actual transcription service:

### Option A: OpenAI Whisper

1. Delete the placeholder node
2. Add an **HTTP Request** node
3. Configure:
   ```
   URL: https://api.openai.com/v1/audio/transcriptions
   Method: POST
   Authentication: Header Auth
   Header Name: Authorization
   Header Value: Bearer YOUR_OPENAI_API_KEY
   Body Type: Form-Data
   Fields:
     - file: {{$binary.data}}
     - model: whisper-1
   ```

### Option B: Google Speech-to-Text

1. Add **Google Cloud Speech to Text** node
2. Configure with your GCP credentials
3. Set audio encoding and language

### Option C: Custom API

1. Use **HTTP Request** node
2. Configure with your API endpoint and authentication

## Step 4: Configure the Update Callback

1. Click on the **Update App DB** node
2. Update the URL to match your application:
   - Development: `http://localhost:3000/api/transcribe`
   - Production: `https://your-app.com/api/transcribe`

## Step 5: Environment Variables

Update your `.env.local` file:

```env
# Your n8n webhook URL from Step 2
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id

# Your application URL for callbacks
NEXT_PUBLIC_API_URL=http://localhost:3000  # or your production URL
```

## Step 6: Test the Integration

### Test via n8n UI:

1. Click **"Execute Workflow"** in n8n
2. Send a test payload to the webhook:
   ```json
   {
     "fileName": "test.mp3",
     "fileSize": 1024,
     "fileType": "audio/mp3",
     "fileContent": "base64_encoded_audio_here",
     "doctorName": "Dr. Test",
     "patientName": "Test Patient",
     "documentType": "consultation",
     "uploadId": "test-123",
     "userId": "user-456",
     "uploadTime": "2024-01-01T00:00:00Z"
   }
   ```

### Test via Application:

1. Start your Next.js app: `npm run dev`
2. Sign in to the dashboard
3. Navigate to Transcriptionist Workspace
4. Upload a small test audio file
5. Check n8n Executions tab for the workflow run
6. Verify the transcription appears in your app

## Step 7: Production Setup

### Security Considerations:

1. **Webhook Authentication**: Add Basic Auth or API Key to webhook
2. **Rate Limiting**: Configure n8n to limit requests
3. **Error Handling**: Add error nodes to handle failures
4. **Monitoring**: Set up alerts for failed executions

### Scaling:

1. **Queue Processing**: For high volume, add a queue (Redis/RabbitMQ)
2. **Parallel Processing**: Configure n8n worker mode
3. **Storage**: Use cloud storage for large files

## Troubleshooting

### Common Issues:

| Issue | Solution |
|-------|----------|
| Webhook not receiving data | Check CORS settings and firewall rules |
| Transcription fails | Verify API keys and service limits |
| Callback fails | Check application URL and authentication |
| Large files timeout | Implement chunked upload or use storage references |

### Debug Tips:

1. Enable verbose logging in n8n
2. Check browser console for CORS errors
3. Use n8n's "Test" feature to debug individual nodes
4. Monitor Supabase logs for database errors

## Advanced Features

### Real-time Updates:

Add a WebSocket or SSE node to send real-time status updates to your app.

### Batch Processing:

Create a scheduled workflow to process pending transcriptions.

### Multi-language Support:

Add language detection before transcription.

### Quality Control:

Add a review step with confidence scoring.

## Support

- n8n Documentation: https://docs.n8n.io
- Community Forum: https://community.n8n.io
- This Project: [GitHub Issues]
