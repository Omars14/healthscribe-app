const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testN8nWebhookMock() {
  console.log('🚀 Testing n8n Webhook with larger audio sample...\n');
  
  // Create a larger valid WAV file header (44 bytes) + some silence data
  // This is a properly formatted WAV file with 1 second of silence
  const wavHeader = Buffer.from([
    // RIFF header
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x24, 0x08, 0x00, 0x00, // File size - 8
    0x57, 0x41, 0x56, 0x45, // "WAVE"
    // fmt chunk
    0x66, 0x6D, 0x74, 0x20, // "fmt "
    0x10, 0x00, 0x00, 0x00, // Chunk size (16)
    0x01, 0x00,             // Audio format (1 = PCM)
    0x01, 0x00,             // Number of channels (1)
    0x44, 0xAC, 0x00, 0x00, // Sample rate (44100)
    0x88, 0x58, 0x01, 0x00, // Byte rate
    0x02, 0x00,             // Block align
    0x10, 0x00,             // Bits per sample (16)
    // data chunk
    0x64, 0x61, 0x74, 0x61, // "data"
    0x00, 0x08, 0x00, 0x00  // Data size
  ]);
  
  // Add 2048 bytes of silence
  const silence = Buffer.alloc(2048);
  const fullAudio = Buffer.concat([wavHeader, silence]);
  const base64Audio = fullAudio.toString('base64');
  
  const webhookUrl = 'http://localhost:5678/webhook-test/medical-transcribe-v2';
  
  const testPayload = {
    id: `test-${Date.now()}`,
    transcriptionId: `trans-${Date.now()}`,
    audio: base64Audio,
    format: 'wav',
    fileName: 'test-medical-audio.wav',
    doctorName: 'Dr. Sarah Johnson',
    patientName: 'John Smith',
    documentType: 'consultation',
    additionalNotes: 'Patient presents with chest pain. History of hypertension.',
    audioUrl: 'https://example.com/test-audio.wav',
    fileSize: fullAudio.length,
    userId: 'test-user-123',
    callbackUrl: 'http://localhost:3000/api/transcription-result-v2',
    language: 'en'
  };
  
  console.log('📦 Webhook URL:', webhookUrl);
  console.log('📝 Test Payload:');
  console.log('  - Transcription ID:', testPayload.transcriptionId);
  console.log('  - Doctor:', testPayload.doctorName);
  console.log('  - Patient:', testPayload.patientName);
  console.log('  - Document Type:', testPayload.documentType);
  console.log('  - Audio Size:', testPayload.fileSize, 'bytes');
  console.log('  - Language:', testPayload.language);
  console.log('');
  
  try {
    console.log('📤 Sending request to n8n webhook...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload),
      timeout: 30000
    });
    
    console.log('📨 Response Status:', response.status, response.statusText);
    
    const responseData = await response.text();
    
    if (response.ok) {
      console.log('✅ SUCCESS! Webhook executed successfully');
      console.log('\n📋 Response from n8n:');
      try {
        const jsonResponse = JSON.parse(responseData);
        console.log(JSON.stringify(jsonResponse, null, 2));
      } catch {
        console.log(responseData.substring(0, 500));
      }
    } else {
      console.log('❌ Workflow execution failed');
      console.log('Error Response:', responseData);
      
      console.log('\n🔍 Common Issues to Check in n8n:');
      console.log('1. OpenAI API Key - Is it configured in the OpenAI Whisper node?');
      console.log('2. Gemini API Key - Is it configured in the Gemini Format node?');
      console.log('3. Check each node for red error indicators');
      console.log('4. The audio is silence, so transcription might be empty');
      console.log('\nYou can also:');
      console.log('- Disable the OpenAI node temporarily to test the rest of the flow');
      console.log('- Add mock text in the "Prepare for Gemini" node as fallback');
    }
    
    console.log('\n📊 Check n8n Editor:');
    console.log('1. Go to http://localhost:5678');
    console.log('2. Look at the execution (should show in the executions list)');
    console.log('3. Click on it to see which node failed');
    console.log('4. Hover over the failed node to see the error message');
    
  } catch (error) {
    console.error('❌ Error calling webhook:', error.message);
  }
  
  console.log('\n✅ Test complete!');
}

// Run the test
testN8nWebhookMock().catch(console.error);
