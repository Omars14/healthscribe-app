const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testN8nTrigger() {
  console.log('🧪 Testing n8n trigger from API\n');
  
  // Create a small test audio file (or use existing)
  const testAudioPath = path.join(__dirname, 'test-audio.mp3');
  
  // Check if test audio exists, if not create a dummy file
  if (!fs.existsSync(testAudioPath)) {
    console.log('Creating dummy audio file...');
    // Create a small dummy MP3 file (just for testing)
    const dummyData = Buffer.alloc(1024); // 1KB dummy data
    fs.writeFileSync(testAudioPath, dummyData);
  }
  
  // Create form data
  const form = new FormData();
  form.append('audio', fs.createReadStream(testAudioPath), 'test-audio.mp3');
  form.append('doctorName', 'Test Doctor');
  form.append('patientName', 'Test Patient');
  form.append('documentType', 'consultation');
  form.append('additionalNotes', 'This is a test');
  
  console.log('Sending request to API...\n');
  
  try {
    // First, we need to login to get a session
    // For testing, we'll use a direct API call
    const response = await fetch('http://localhost:3000/api/transcribe-medical', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        // Add a test auth header if needed
        'Cookie': 'your-auth-cookie-here' // You'll need to get this from browser
      }
    });
    
    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));
    
    if (result.transcriptionId) {
      console.log('\n✅ Transcription created with ID:', result.transcriptionId);
      console.log('\nNow check the server logs to see if n8n was triggered.');
      console.log('Also check n8n execution history at http://localhost:5678');
    } else {
      console.log('\n❌ Failed to create transcription');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. The Next.js server is running (npm run dev)');
    console.log('2. You are logged in (check browser and copy auth cookie)');
  }
}

testN8nTrigger();
