// Medical Transcription System Test Script
// Usage: node test-medical-transcription.js

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_AUDIO_FILE = 'test-audio.wav'; // You'll need to provide this
const AUTH_TOKEN = process.env.AUTH_TOKEN || ''; // Set this if authentication is required

// Test data
const TEST_DATA = {
  doctorName: 'Dr. Sarah Johnson',
  patientName: 'John Smith',
  documentType: 'surgery_report',
  additionalNotes: 'Post-operative notes for knee arthroscopy performed on ' + new Date().toISOString().split('T')[0]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.bright}${colors.blue}[Step ${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
}

// Create a test audio file if it doesn't exist
function createTestAudioFile() {
  if (!fs.existsSync(TEST_AUDIO_FILE)) {
    log('Creating test audio file...', colors.yellow);
    
    // Create a simple WAV header for a 1-second silent audio file
    const sampleRate = 44100;
    const numChannels = 1;
    const bitsPerSample = 16;
    const duration = 1; // seconds
    const numSamples = sampleRate * duration;
    const dataSize = numSamples * numChannels * (bitsPerSample / 8);
    const fileSize = 44 + dataSize;

    const buffer = Buffer.alloc(fileSize);
    
    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(fileSize - 8, 4);
    buffer.write('WAVE', 8);
    
    // fmt subchunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size
    buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // ByteRate
    buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // BlockAlign
    buffer.writeUInt16LE(bitsPerSample, 34);
    
    // data subchunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    
    // Write silent audio data (zeros)
    // Buffer is already initialized with zeros
    
    fs.writeFileSync(TEST_AUDIO_FILE, buffer);
    logSuccess('Test audio file created');
  } else {
    logInfo('Using existing test audio file');
  }
}

// Test the medical transcription API
async function testMedicalTranscription() {
  log('\n' + '='.repeat(60), colors.bright);
  log('MEDICAL TRANSCRIPTION SYSTEM TEST', colors.bright + colors.cyan);
  log('='.repeat(60) + '\n', colors.bright);

  try {
    // Step 1: Check API health
    logStep(1, 'Checking API health...');
    const healthResponse = await fetch(`${API_URL}/api/transcribe-medical`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      logSuccess(`API is healthy - Version: ${health.version}`);
      logInfo(`Available document types: ${health.features.documentTypes.join(', ')}`);
    } else {
      logError('API health check failed');
    }

    // Step 2: Prepare test audio file
    logStep(2, 'Preparing test audio file...');
    createTestAudioFile();
    
    const audioFile = fs.readFileSync(TEST_AUDIO_FILE);
    logSuccess(`Audio file loaded: ${(audioFile.length / 1024).toFixed(2)} KB`);

    // Step 3: Create form data
    logStep(3, 'Preparing upload data...');
    const formData = new FormData();
    formData.append('audio', audioFile, {
      filename: 'test-audio.wav',
      contentType: 'audio/wav'
    });
    formData.append('doctorName', TEST_DATA.doctorName);
    formData.append('patientName', TEST_DATA.patientName);
    formData.append('documentType', TEST_DATA.documentType);
    formData.append('additionalNotes', TEST_DATA.additionalNotes);
    
    logSuccess('Form data prepared');
    logInfo(`Doctor: ${TEST_DATA.doctorName}`);
    logInfo(`Patient: ${TEST_DATA.patientName}`);
    logInfo(`Document Type: ${TEST_DATA.documentType}`);

    // Step 4: Submit transcription
    logStep(4, 'Submitting transcription request...');
    
    const headers = {
      ...formData.getHeaders()
    };
    
    if (AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    const startTime = Date.now();
    const response = await fetch(`${API_URL}/api/transcribe-medical`, {
      method: 'POST',
      headers,
      body: formData
    });

    const responseTime = Date.now() - startTime;
    logInfo(`Response received in ${responseTime}ms`);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API returned ${response.status}: ${error}`);
    }

    const result = await response.json();
    
    if (result.success) {
      logSuccess('Transcription submitted successfully!');
      logInfo(`Transcription ID: ${result.transcriptionId}`);
      logInfo(`Status: ${result.status}`);
      if (result.audioUrl) {
        logInfo(`Audio URL: ${result.audioUrl}`);
      }
      
      // Step 5: Monitor transcription status
      if (result.transcriptionId) {
        logStep(5, 'Monitoring transcription status...');
        await monitorTranscriptionStatus(result.transcriptionId);
      }
    } else {
      logError(`Submission failed: ${result.error}`);
    }

  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
  }

  // Cleanup
  if (fs.existsSync(TEST_AUDIO_FILE)) {
    fs.unlinkSync(TEST_AUDIO_FILE);
    logInfo('Test audio file cleaned up');
  }

  log('\n' + '='.repeat(60), colors.bright);
  log('TEST COMPLETE', colors.bright + colors.cyan);
  log('='.repeat(60) + '\n', colors.bright);
}

// Monitor transcription status (optional)
async function monitorTranscriptionStatus(transcriptionId) {
  const maxAttempts = 30; // 30 attempts = ~2.5 minutes
  const pollInterval = 5000; // 5 seconds
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // This assumes you have a status endpoint
      const statusResponse = await fetch(`${API_URL}/api/transcription-status?id=${transcriptionId}`);
      
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        
        if (status.status === 'completed') {
          logSuccess('Transcription completed!');
          if (status.formattedText) {
            logInfo('Formatted text preview:');
            console.log(colors.cyan + status.formattedText.substring(0, 200) + '...' + colors.reset);
          }
          break;
        } else if (status.status === 'failed') {
          logError(`Transcription failed: ${status.error}`);
          break;
        } else {
          log(`Status check ${attempt}/${maxAttempts}: ${status.status}`, colors.yellow);
        }
      }
    } catch (error) {
      logError(`Status check failed: ${error.message}`);
    }
    
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  log('This script requires Node.js 18+ or the node-fetch package', colors.red);
  log('Install node-fetch: npm install node-fetch', colors.yellow);
  process.exit(1);
}

// Check if form-data is installed
try {
  require('form-data');
} catch (error) {
  log('Please install form-data package:', colors.red);
  log('npm install form-data', colors.yellow);
  process.exit(1);
}

// Run the test
testMedicalTranscription().catch(error => {
  logError('Unhandled error:');
  console.error(error);
  process.exit(1);
});
