#!/usr/bin/env node

/**
 * Script to automatically update ngrok URL in environment variables
 * Run this script after starting ngrok to update the webhook URLs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.example');

// Function to get ngrok URL from the ngrok API
async function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    https.get('https://api.ngrok.com/tunnels', {
      headers: {
        'Authorization': `Bearer ${process.env.NGROK_AUTH_TOKEN}`,
        'Ngrok-Version': '2'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const tunnels = JSON.parse(data);
          if (tunnels.tunnels && tunnels.tunnels.length > 0) {
            const tunnel = tunnels.tunnels.find(t => t.forwards_to.includes('5678')) || tunnels.tunnels[0];
            resolve(tunnel.public_url);
          } else {
            reject('No active ngrok tunnels found');
          }
        } catch (error) {
          reject(`Failed to parse ngrok response: ${error.message}`);
        }
      });
    }).on('error', reject);
  });
}

// Function to get ngrok URL from local API (fallback)
async function getNgrokUrlLocal() {
  return new Promise((resolve, reject) => {
    const req = require('http').get('http://127.0.0.1:4040/api/tunnels', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const tunnels = JSON.parse(data);
          if (tunnels.tunnels && tunnels.tunnels.length > 0) {
            // Find the tunnel for port 5678 (n8n) or use the first one
            const tunnel = tunnels.tunnels.find(t => 
              t.config && t.config.addr && t.config.addr.includes('5678')
            ) || tunnels.tunnels[0];
            resolve(tunnel.public_url);
          } else {
            reject('No active ngrok tunnels found');
          }
        } catch (error) {
          reject(`Failed to parse ngrok response: ${error.message}`);
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject('Timeout connecting to ngrok local API');
    });
  });
}

// Function to manually input ngrok URL
async function getManualNgrokUrl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter your ngrok URL (e.g., https://abc123.ngrok.io): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Function to update environment file
function updateEnvFile(ngrokUrl) {
  if (!fs.existsSync(envPath)) {
    console.log('Creating .env.local file...');
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
    } else {
      fs.writeFileSync(envPath, '');
    }
  }

  let envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Construct the webhook URL
  const webhookUrl = `${ngrokUrl}/webhook/medical-transcribe-v2`;
  
  // Update or add the webhook URLs
  const webhookKeys = [
    'N8N_WEBHOOK_URL',
    'NEXT_PUBLIC_WEBHOOK_URL',
    'NEXT_PUBLIC_N8N_WEBHOOK_URL'
  ];

  webhookKeys.forEach(key => {
    const regex = new RegExp(`^${key}=.*$`, 'gm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${webhookUrl}`);
    } else {
      envContent += `\n${key}=${webhookUrl}`;
    }
  });

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated webhook URLs to: ${webhookUrl}`);
}

// Function to update Vercel environment variables
async function updateVercelEnv(ngrokUrl) {
  console.log('\n📝 To update Vercel environment variables:');
  console.log('1. Run: vercel env pull');
  console.log('2. Update the webhook URLs in .env.local');
  console.log('3. Run: vercel env push');
  console.log('\nOr update manually in Vercel dashboard:');
  console.log(`   N8N_WEBHOOK_URL=${ngrokUrl}/webhook/medical-transcribe-v2`);
  console.log(`   NEXT_PUBLIC_N8N_WEBHOOK_URL=${ngrokUrl}/webhook/medical-transcribe-v2`);
}

// Main function
async function main() {
  console.log('🔍 Detecting ngrok URL...\n');
  
  let ngrokUrl = null;
  
  try {
    // Try to get from local API first
    console.log('Checking local ngrok API...');
    ngrokUrl = await getNgrokUrlLocal();
    console.log(`✅ Found ngrok URL: ${ngrokUrl}`);
  } catch (error) {
    console.log(`❌ Local API failed: ${error}`);
    
    // Try ngrok cloud API if auth token is available
    if (process.env.NGROK_AUTH_TOKEN) {
      try {
        console.log('\nTrying ngrok cloud API...');
        ngrokUrl = await getNgrokUrl();
        console.log(`✅ Found ngrok URL: ${ngrokUrl}`);
      } catch (cloudError) {
        console.log(`❌ Cloud API failed: ${cloudError}`);
      }
    }
    
    // Fall back to manual input
    if (!ngrokUrl) {
      console.log('\n⚠️  Could not automatically detect ngrok URL.');
      console.log('Make sure ngrok is running: ngrok http 5678');
      ngrokUrl = await getManualNgrokUrl();
    }
  }
  
  if (ngrokUrl) {
    // Ensure the URL uses https
    if (ngrokUrl.startsWith('http://')) {
      ngrokUrl = ngrokUrl.replace('http://', 'https://');
    }
    
    console.log(`\n🚀 Using ngrok URL: ${ngrokUrl}`);
    updateEnvFile(ngrokUrl);
    await updateVercelEnv(ngrokUrl);
    
    console.log('\n✨ Done! Your webhook URLs have been updated.');
    console.log('\n⚠️  Remember to:');
    console.log('1. Restart your Next.js development server');
    console.log('2. Update Vercel environment variables if deploying');
  } else {
    console.error('❌ Failed to get ngrok URL');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
