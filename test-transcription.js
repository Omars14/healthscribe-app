// Test script for transcription API
const fs = require('fs');
const path = require('path');

async function testTranscription() {
  console.log('🧪 Testing transcription API...\n');
  
  // Create a small test audio file (or use existing)
  const testAudioPath = 'C:\\Users\\Omar\\Desktop\\MRC Reports 28.04.2025 -1.mp3';
  
  // Check if file exists
  if (!fs.existsSync(testAudioPath)) {
    console.error('❌ Test audio file not found:', testAudioPath);
    return;
  }
  
  const audioBuffer = fs.readFileSync(testAudioPath);
  const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
  
  // Create form data
  const formData = new FormData();
  formData.append('audio', audioBlob, 'test-audio.mp3');
  formData.append('doctorName', 'Dr. Test');
  formData.append('patientName', 'Test Patient');
  formData.append('documentType', 'Test Transcription');
  
  try {
    console.log('📤 Sending request to API...');
    const response = await fetch('http://localhost:3002/api/transcribe-optimized', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success! Response:', result);
      
      if (result.transcriptionId) {
        console.log('\n📋 Transcription ID:', result.transcriptionId);
        console.log('🔄 Status:', result.status);
        
        // Check status after a few seconds
        setTimeout(async () => {
          console.log('\n🔍 Checking transcription status...');
          const statusResponse = await fetch(`http://localhost:3002/api/transcribe-optimized?id=${result.transcriptionId}`);
          const statusResult = await statusResponse.json();
          console.log('📊 Current status:', statusResult);
        }, 5000);
      }
    } else {
      console.error('❌ Error:', result);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Run test
testTranscription();
