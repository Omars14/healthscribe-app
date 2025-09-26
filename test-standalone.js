#!/usr/bin/env node

/**
 * Test script to verify the standalone build works properly
 * Run this after `npm run build` to test the production build locally
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing HealthScribe Pro Standalone Build');
console.log('='.repeat(50));

// Check if standalone build exists
const standalonePath = path.join(__dirname, '.next', 'standalone');
const serverPath = path.join(standalonePath, 'server.js');

if (!fs.existsSync(standalonePath)) {
  console.error('❌ Standalone build not found. Run `npm run build` first.');
  process.exit(1);
}

if (!fs.existsSync(serverPath)) {
  console.error('❌ Server.js not found in standalone build.');
  process.exit(1);
}

console.log('✅ Standalone build files found');

// Set test environment variables
const testEnv = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: '3001',
  HOSTNAME: '0.0.0.0',
  // Use local test values
  NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.healthscribe.pro',
  NEXT_PUBLIC_URL: 'http://localhost:3001'
};

console.log('🚀 Starting standalone server on http://localhost:3001');
console.log('Press Ctrl+C to stop the server');

// Start the server
const server = spawn('node', ['server.js'], {
  cwd: standalonePath,
  env: testEnv,
  stdio: 'inherit'
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping server...');
  server.kill('SIGINT');
  process.exit(0);
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
  } else {
    console.log('✅ Server stopped successfully');
  }
  process.exit(code);
});

// Test endpoints after a delay
setTimeout(async () => {
  console.log('\n🔍 Testing endpoints...');
  
  try {
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3001/api/health');
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Health check passed:', health.status);
    } else {
      console.log('⚠️  Health check failed:', healthResponse.status);
    }

    // Test main page
    const mainResponse = await fetch('http://localhost:3001');
    if (mainResponse.ok) {
      console.log('✅ Main page loads successfully');
    } else {
      console.log('⚠️  Main page failed:', mainResponse.status);
    }

    console.log('\n🎉 Local testing complete!');
    console.log('Visit http://localhost:3001 to test the dashboard');

  } catch (error) {
    console.log('⚠️  Could not test endpoints:', error.message);
    console.log('Server might still be starting up...');
  }
}, 3000);