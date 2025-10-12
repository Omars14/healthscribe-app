#!/usr/bin/env node

const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const SSH_HOST = '154.26.155.207';
const SSH_USER = 'root';
const SSH_PASS = 'Nomar123';

const CLOUD_CONFIG = `# Supabase Configuration - Cloud (Working)
NEXT_PUBLIC_SUPABASE_URL=https://yaznemrwbingjwqutbvb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjA0MzAsImV4cCI6MjA3MTAzNjQzMH0.uluQzD4-m91tUq0gOrUNOfR9rlN0Ry4tAPlxp-PWrIo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ2MDQzMCwiZXhwIjoyMDcxMDM2NDMwfQ.9Ib029SJ7rGbBI4JMoEKacX4LMOZbzOedDZ9JGtuXas

# n8n Webhook Configuration
N8N_WEBHOOK_URL=https://project6.app.n8n.cloud/webhook/medical-transcribe-v2
NEXT_PUBLIC_N8N_URL=https://project6.app.n8n.cloud
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://project6.app.n8n.cloud/webhook/medical-transcribe-v2

# Application Settings - VPS
NEXT_PUBLIC_SITE_URL=https://healthscribe.pro
NEXT_PUBLIC_URL=https://healthscribe.pro
NEXT_PUBLIC_API_URL=https://healthscribe.pro/api

# Google Gemini API Key
GOOGLE_API_KEY=AIzaSyBPmQfnqNhGi9rYbVgTi6UbGOiLZTr1k8Y

# OpenAI Configuration (fallback)
OPENAI_API_KEY=sk-placeholder-your-openai-key

# Encryption key for sensitive data
ENCRYPTION_KEY=your-encryption-key-here

# Environment
NODE_ENV=production
`;

async function main() {
  console.log('🔄 Switching to Supabase Cloud...\n');

  try {
    // Step 1: Backup current config
    console.log('📋 Step 1: Backing up current configuration...');
    const currentEnv = fs.readFileSync('.env.local', 'utf8');
    const backupFile = `.env.local.backup-${Date.now()}`;
    fs.writeFileSync(backupFile, currentEnv);
    console.log(`✅ Backed up to: ${backupFile}\n`);

    // Step 2: Write new config
    console.log('📋 Step 2: Writing Cloud Supabase configuration...');
    fs.writeFileSync('.env.local', CLOUD_CONFIG);
    console.log('✅ Updated .env.local with Cloud credentials\n');

    // Step 3: Commit changes
    console.log('📋 Step 3: Committing changes...');
    await execAsync('git add .env.local');
    await execAsync('git commit -m "Switch to Supabase Cloud for working auth"');
    console.log('✅ Changes committed\n');

    // Step 4: Push to trigger Coolify rebuild
    console.log('📋 Step 4: Pushing to GitHub (will trigger Coolify rebuild)...');
    await execAsync('git push origin master');
    console.log('✅ Pushed to GitHub\n');

    // Step 5: Monitor deployment
    console.log('📋 Step 5: Monitoring deployment...');
    console.log('⏳ Waiting 30 seconds for Coolify to detect changes...\n');
    
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Step 6: Check application status
    console.log('📋 Step 6: Checking application status...');
    const statusCmd = `
      sshpass -p '${SSH_PASS}' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} '
        APP=\$(docker ps --filter "name=dashboard-next" --format "{{.Names}}" | head -1)
        echo "Container: \$APP"
        docker logs --tail 10 \$APP 2>&1 | tail -5
      '
    `;
    
    const { stdout: status } = await execAsync(statusCmd);
    console.log(status);

    console.log('\n' + '='.repeat(80));
    console.log('✅ SWITCHED TO SUPABASE CLOUD');
    console.log('='.repeat(80));
    console.log('\n⚠️ IMPORTANT: You now need to migrate data from self-hosted to Cloud');
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Wait 2-3 minutes for full deployment');
    console.log('2. Test login at: https://healthscribe.pro/login');
    console.log('3. Credentials:');
    console.log('   - Check Supabase Cloud dashboard for existing users');
    console.log('   - Or create new account at /signup');
    console.log('4. Once logged in, run data migration:');
    console.log('   node migrate-self-hosted-to-cloud.js');
    console.log('\n🔍 VERIFY:');
    console.log('- Login should work without 400 errors');
    console.log('- Dashboard should load');
    console.log('- Initially may show 0 transcriptions (until migration)');
    console.log('\n💾 ROLLBACK:');
    console.log(`If issues: cp ${backupFile} .env.local && git add .env.local && git commit -m "Rollback" && git push`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n🔄 Manual steps:');
    console.log('1. Copy backup/.env.local.bak to .env.local');
    console.log('2. git add .env.local');
    console.log('3. git commit -m "Switch to Supabase Cloud"');
    console.log('4. git push origin master');
    process.exit(1);
  }
}

main();

