#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const execAsync = promisify(exec);

const SSH_HOST = '154.26.155.207';
const SSH_USER = 'root';
const SSH_PASS = 'Nomar123';

async function main() {
  console.log('🚀 Uploading and executing Supabase restoration script...\n');

  try {
    // Step 1: Upload the script
    console.log('📤 Step 1: Uploading restore script to VPS...');
    const uploadCmd = `sshpass -p "${SSH_PASS}" scp -o StrictHostKeyChecking=no restore-supabase.sh ${SSH_USER}@${SSH_HOST}:/tmp/restore-supabase.sh`;
    await execAsync(uploadCmd);
    console.log('✅ Script uploaded\n');

    // Step 2: Make it executable and run it
    console.log('🔧 Step 2: Executing restore script on VPS...');
    const executeCmd = `sshpass -p "${SSH_PASS}" ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} "chmod +x /tmp/restore-supabase.sh && /tmp/restore-supabase.sh"`;
    const { stdout, stderr } = await execAsync(executeCmd, { maxBuffer: 1024 * 1024 * 10 });
    
    console.log(stdout);
    if (stderr && !stderr.includes('Pseudo-terminal')) {
      console.error('Stderr:', stderr);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 SUPABASE RESTORATION COMPLETED');
    console.log('='.repeat(80));
    console.log('\n📋 COPY THE KEYS ABOVE and update your .env.local');
    console.log('\n📝 OR run the next script to auto-update and deploy:');
    console.log('   node update-app-with-supabase-keys.js');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stdout) console.log('\nOutput:', error.stdout);
    if (error.stderr) console.error('\nStderr:', error.stderr);
    
    console.log('\n🔄 Manual steps:');
    console.log('1. SSH: ssh root@154.26.155.207');
    console.log('2. cd /opt/supabase/docker || cd /data/supabase/docker');
    console.log('3. docker-compose up -d');
    console.log('4. docker-compose logs -f auth');
    console.log('5. Get keys: cat .env | grep -E "ANON_KEY|SERVICE_ROLE_KEY"');
    process.exit(1);
  }
}

main();

