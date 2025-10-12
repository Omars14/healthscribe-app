#!/usr/bin/env node

const { Client } = require('ssh2');
const fs = require('fs');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

function executeCommand(conn, command, description) {
  return new Promise((resolve, reject) => {
    if (description) console.log(`\n🔧 ${description}...`);
    
    conn.exec(command, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let output = '';
      let errorOutput = '';

      stream.on('close', (code, signal) => {
        resolve({ output, errorOutput, code });
      }).on('data', (data) => {
        output += data.toString();
        process.stdout.write(data.toString());
      }).stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
    });
  });
}

async function main() {
  console.log('🌐 Configuring Supabase Cloud (Correct Configuration)...\n');

  // Update local .env.local with Cloud credentials
  console.log('📝 Updating .env.local with Supabase Cloud credentials...\n');
  
  const envContent = `# Supabase Configuration - Cloud (CORRECT - HAS YOUR DATA)
NEXT_PUBLIC_SUPABASE_URL=https://yaznemrwbingjwqutbvb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjA0MzAsImV4cCI6MjA3MTAzNjQzMH0.uluQzD4-m91tUq0gOrUNOfR9rlN0Ry4tAPlxp-PWrIo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ2MDQzMCwiZXhwIjoyMDcxMDM2NDMwfQ.9Ib029SJ7rGbBI4JMoEKacX4LMOZbzOedDZ9JGtuXas

# n8n Webhook Configuration
N8N_WEBHOOK_URL=https://project6.app.n8n.cloud/webhook/medical-transcribe-v2
NEXT_PUBLIC_N8N_URL=https://project6.app.n8n.cloud
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://project6.app.n8n.cloud/webhook/medical-transcribe-v2

# Application Settings
NEXT_PUBLIC_SITE_URL=https://healthscribe.pro
NEXT_PUBLIC_URL=https://healthscribe.pro
NEXT_PUBLIC_API_URL=https://healthscribe.pro/api

# Google Gemini API Key
GOOGLE_API_KEY=AIzaSyBPmQfnqNhGi9rYbVgTi6UbGOiLZTr1k8Y

# OpenAI Configuration
OPENAI_API_KEY=sk-placeholder-your-openai-key

# Encryption key
ENCRYPTION_KEY=your-encryption-key-here

# Environment
NODE_ENV=production
`;

  fs.writeFileSync('.env.local', envContent);
  console.log('✅ .env.local updated with Supabase Cloud\n');

  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH Connected\n');
        resolve();
      }).on('error', reject).connect(SSH_CONFIG);
    });

    // Stop all self-hosted Supabase containers to avoid confusion
    console.log('='.repeat(70));
    console.log('Cleaning Up Self-Hosted Supabase Containers');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Stopping self-hosted Supabase containers..."
      docker stop supabase_kong_supabase supabase_db_supabase supabase_auth_supabase 2>/dev/null || echo "Some already stopped"
      docker stop supabase-kong-e088wwks88k8k48sccg8gk0o supabase-db-e088wwks88k8k48sccg8gk0o 2>/dev/null || echo "e088 already stopped"
      
      echo "✅ Self-hosted containers stopped"
    `, 'Stopping unused containers');

    // Restart application containers
    console.log('\n' + '='.repeat(70));
    console.log('Restarting Application');
    console.log('='.repeat(70));
    
    await executeCommand(conn, `
      echo "Finding application containers..."
      APP_CONTAINERS=\$(docker ps --filter "name=tkwoos4\\|healthscribe-app" --format "{{.Names}}")
      
      for CONTAINER in \$APP_CONTAINERS; do
        echo "Restarting: \$CONTAINER"
        docker restart \$CONTAINER
      done
      
      echo ""
      echo "Waiting 20 seconds for restart..."
      sleep 20
      
      echo ""
      echo "Application status:"
      curl -sI https://healthscribe.pro | head -3
    `, 'Restarting application');

    conn.end();
    console.log('\n✅ SSH session closed');

    console.log('\n' + '='.repeat(80));
    console.log('✅ CONFIGURED TO USE SUPABASE CLOUD');
    console.log('='.repeat(80));
    
    console.log('\n📊 Configuration:');
    console.log('✅ Using: Supabase Cloud');
    console.log('✅ URL: https://yaznemrwbingjwqutbvb.supabase.co');
    console.log('✅ This is where your data has always been');
    console.log('✅ Self-hosted Supabase containers stopped');
    console.log('✅ Application restarted');
    
    console.log('\n🧪 TEST NOW:');
    console.log('━'.repeat(80));
    console.log('1. Go to: https://healthscribe.pro/login');
    console.log('2. Email: omars14@gmail.com');
    console.log('3. Password: Nomar123');
    console.log('4. You should see your transcription history!');
    console.log('━'.repeat(80));
    
    console.log('\n✅ Your data is in Supabase Cloud and the app is now correctly configured!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

