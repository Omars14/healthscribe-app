# N8N Webhook Configuration for Transcription System

## Webhook URL
Set your n8n webhook URL in the `.env.local` file:
```
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/upload
```

## Expected Webhook Format

The transcription system sends a JSON payload to your n8n webhook with the following structure:

### Request Headers
```
Content-Type: application/json
X-Request-ID: [transcription-id]
X-Source: dashboard-next
```

### Request Body (JSON)
```json
{
  // Audio data (base64 encoded)
  "audioFile": "base64-encoded-audio-content",
  "fileName": "audio.mp3",
  "fileSize": 123456,
  "fileType": "audio/mpeg",
  
  // Metadata
  "doctorName": "Dr. Smith",
  "patientName": "John Doe",
  "documentType": "Medical Note",
  
  // Tracking information
  "uploadId": "uuid-transcription-id",
  "uploadTime": "2024-01-01T12:00:00.000Z",
  "source": "dashboard-next"
}
```

## N8N Workflow Setup

### 1. Webhook Node Configuration
- **HTTP Method**: POST
- **Path**: /upload (or your preferred path)
- **Response Mode**: "When Last Node Finishes" or "Immediately"
- **Response Data**: "First Entry JSON"

### 2. Processing the Audio
In your n8n workflow, you'll need to:

1. **Extract the base64 audio** from `audioFile` field
2. **Convert base64 to binary** for processing
3. **Send to transcription service** (Whisper API, etc.)
4. **Update Supabase** with the transcription result

### 3. Example N8N Workflow Nodes

#### Node 1: Webhook (Trigger)
- Receives the JSON payload

#### Node 2: Convert Base64 to Binary
```javascript
// In a Function node
const audioBase64 = $input.first().json.audioFile;
const audioBuffer = Buffer.from(audioBase64, 'base64');

return {
  binary: {
    data: audioBuffer,
    mimeType: $input.first().json.fileType || 'audio/mpeg',
    fileName: $input.first().json.fileName || 'audio.mp3'
  },
  json: $input.first().json
};
```

#### Node 3: Send to Transcription Service
- Use HTTP Request node to send audio to Whisper API or similar
- Include the binary data from previous step

#### Node 4: Update Supabase
- Use Supabase node or HTTP Request to update the transcription record
- Update the record with ID from `uploadId` field
- Set `transcription_text` and `status` fields

### 4. Response Handling

The webhook should respond with one of these status codes:
- **200/201/202**: Success - request accepted
- **400**: Bad request - invalid payload
- **500**: Server error - processing failed

### 5. Error Handling

For robust operation:
1. Add error handling nodes in n8n
2. Update Supabase status to 'failed' on errors
3. Log errors for debugging
4. Consider retry logic for transient failures

## Testing the Webhook

You can test the webhook directly using curl:

```bash
curl -X POST https://your-n8n-instance.com/webhook/upload \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: test-123" \
  -H "X-Source: dashboard-next" \
  -d '{
    "audioFile": "base64-audio-content-here",
    "fileName": "test.mp3",
    "fileSize": 1024,
    "fileType": "audio/mpeg",
    "doctorName": "Dr. Test",
    "patientName": "Test Patient",
    "documentType": "Test Note",
    "uploadId": "test-uuid",
    "uploadTime": "2024-01-01T12:00:00.000Z",
    "source": "dashboard-next"
  }'
```

## Troubleshooting

### Common Issues:

1. **Timeout errors**: Increase the timeout in the code (currently 45 seconds)
2. **"No item to return" error**: This is normal for async processing - the code handles it
3. **CORS errors**: Ensure n8n webhook allows requests from your domain
4. **Large files failing**: Consider increasing n8n's payload size limit

### Debug Tips:

1. Check the browser console for client-side errors
2. Check the Next.js server logs for API errors
3. Check n8n execution logs for workflow errors
4. Verify the webhook URL is accessible from your deployment
