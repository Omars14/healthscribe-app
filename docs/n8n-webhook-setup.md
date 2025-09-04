# n8n Webhook Integration Setup

This guide explains how to set up and configure the n8n webhook integration for automated transcription processing.

## Overview

The transcription system uses n8n webhooks to process audio files asynchronously. When a user uploads an audio file, it's sent to n8n for transcription, and the results are returned to the application.

## Architecture

```
User Upload → Next.js API → n8n Webhook → Transcription Service → Database Update
```

## Setup Instructions

### 1. Configure Environment Variables

Copy the `.env.local.example` file to `.env.local` and update the values:

```bash
cp .env.local.example .env.local
```

Update the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
```

### 2. n8n Workflow Configuration

Create a new workflow in n8n with the following nodes:

#### Webhook Node (Trigger)
- **Webhook URL**: Copy this URL and use it as `NEXT_PUBLIC_N8N_WEBHOOK_URL`
- **HTTP Method**: POST
- **Response Mode**: Immediately respond with "Webhook received"

#### Process Audio Node
Configure based on your transcription service:

**Option A: OpenAI Whisper**
```javascript
// Extract base64 audio and convert to file
const audioData = $input.item.json.audioData;
const buffer = Buffer.from(audioData, 'base64');
// Send to Whisper API
```

**Option B: Google Speech-to-Text**
```javascript
// Similar process for Google Cloud Speech API
```

**Option C: Custom Service**
```javascript
// Integrate with your preferred transcription service
```

#### Update Database Node
Use HTTP Request node to call back to your application:

- **URL**: `https://your-app-domain.com/api/transcribe`
- **Method**: PUT
- **Body**:
```json
{
  "transcriptionId": "{{$input.item.json.transcriptionId}}",
  "transcription": "{{$node['Transcribe'].json.text}}",
  "status": "completed",
  "audioUrl": "{{$node['Upload'].json.url}}"
}
```

### 3. Database Schema

Ensure your Supabase database has the following table structure:

```sql
CREATE TABLE transcriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT,
  doctor_name TEXT,
  patient_name TEXT,
  document_type TEXT,
  transcription_text TEXT,
  audio_url TEXT,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  file_size BIGINT,
  metadata JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_transcriptions_status ON transcriptions(status);
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at DESC);
```

## Testing the Integration

### 1. Test n8n Webhook

Use curl to test the n8n webhook directly:

```bash
curl -X POST https://your-n8n-instance.com/webhook/your-webhook-id \
  -H "Content-Type: application/json" \
  -d '{
    "transcriptionId": "test-123",
    "audioData": "base64_encoded_audio_here",
    "fileName": "test.mp3",
    "metadata": {
      "doctorName": "Dr. Test",
      "patientName": "Test Patient"
    }
  }'
```

### 2. Test Application Upload

1. Start the development server:
```bash
npm run dev
```

2. Navigate to the dashboard: `http://localhost:3000/dashboard`

3. Upload a test audio file with the following:
   - Doctor Name: "Dr. Test"
   - Patient Name: "Test Patient"
   - Document Type: "Consultation"
   - Audio File: Any MP3/WAV file under 100MB

4. Monitor the console for:
   - "Transcription submitted: [ID]"
   - "Status update: [STATUS]"

### 3. Verify Database Updates

Check Supabase to verify records are created and updated:

```sql
SELECT * FROM transcriptions 
ORDER BY created_at DESC 
LIMIT 10;
```

## Webhook Response Format

The n8n webhook should return data in this format:

### Success Response
```json
{
  "transcription": "The transcribed text content...",
  "audioUrl": "https://storage.example.com/audio/file.mp3",
  "metadata": {
    "duration": 180,
    "confidence": 0.95,
    "language": "en"
  },
  "message": "Transcription completed successfully"
}
```

### Error Response
```json
{
  "error": "Failed to process audio: Invalid format",
  "status": "failed"
}
```

## Monitoring & Debugging

### Check API Logs
```bash
# View Next.js API logs
npm run dev
# Look for console.log outputs in terminal
```

### Check n8n Execution History
1. Open n8n interface
2. Go to Executions tab
3. Review webhook execution logs

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Webhook timeout | Increase timeout in n8n settings or implement async processing |
| Large file uploads fail | Adjust Next.js body size limit in `next.config.js` |
| Transcription never completes | Check n8n workflow execution logs for errors |
| Database not updating | Verify Supabase credentials and table permissions |

## Production Considerations

1. **Security**: Add authentication to webhook endpoints
2. **Rate Limiting**: Implement rate limiting for API endpoints
3. **File Storage**: Use cloud storage (S3, GCS) for audio files
4. **Error Handling**: Implement retry logic for failed transcriptions
5. **Monitoring**: Set up alerts for failed transcriptions

## Example n8n Workflow JSON

You can import this workflow template into n8n:

```json
{
  "name": "Medical Transcription Webhook",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "path": "transcribe",
        "responseMode": "onReceived",
        "responseData": "allEntries"
      }
    },
    {
      "name": "Process Audio",
      "type": "n8n-nodes-base.code",
      "position": [450, 300],
      "parameters": {
        "code": "// Your transcription logic here\nreturn items;"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [["Process Audio"]]
    }
  }
}
```

## Support

For issues or questions:
1. Check the application logs
2. Review n8n execution history
3. Verify environment variables
4. Check database permissions
