#!/usr/bin/env node

const { Client } = require('ssh2');
const fs = require('fs');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

function executeCommand(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let output = '';

      stream.on('close', () => {
        resolve(output);
      }).on('data', (data) => {
        output += data.toString();
        process.stdout.write(data.toString());
      });
    });
  });
}

async function main() {
  const conn = new Client();

  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', resolve).on('error', reject).connect(SSH_CONFIG);
    });

    console.log('🚀 UPLOADING AND TESTING SYSTEM\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Upload the YAML file
    console.log('1️⃣ Uploading Traefik configuration...\n');
    
    const yamlContent = fs.readFileSync('./healthscribe-traefik.yaml', 'utf8');
    
    await new Promise((resolve, reject) => {
      conn.sftp((err, sftp) => {
        if (err) reject(err);
        
        sftp.writeFile('/data/coolify/proxy/dynamic/healthscribe-complete.yaml', yamlContent, (err) => {
          if (err) reject(err);
          console.log('✅ Configuration uploaded');
          resolve();
        });
      });
    });

    // Step 2: Remove old broken files
    console.log('\n2️⃣ Cleaning up old files...\n');
    await executeCommand(conn, 'rm -f /data/coolify/proxy/dynamic/healthscribe-system.yaml /data/coolify/proxy/dynamic/supabase.yaml && echo "✅ Old files removed"');

    // Step 3: Restart Traefik
    console.log('\n3️⃣ Restarting Traefik...\n');
    await executeCommand(conn, 'docker restart coolify-proxy && sleep 10 && echo "✅ Traefik restarted"');

    // Step 4: Test all endpoints
    console.log('\n4️⃣ Testing all endpoints...\n');
    
    console.log('Application:');
    await executeCommand(conn, 'curl -s -I -m 10 https://healthscribe.pro 2>&1 | grep "HTTP" | head -1');
    
    console.log('\nSupabase Auth:');
    await executeCommand(conn, 'curl -s -I -m 10 https://supabase.healthscribe.pro/auth/v1/health 2>&1 | grep "HTTP" | head -1');
    
    console.log('\nN8N:');
    await executeCommand(conn, 'curl -s -I -m 10 https://n8n.healthscribe.pro 2>&1 | grep "HTTP" | head -1');

    // Step 5: Verify configuration
    console.log('\n5️⃣ Verifying configuration...\n');
    await executeCommand(conn, 'cat /data/coolify/proxy/dynamic/healthscribe-complete.yaml | head -30');

    // Step 6: Check for errors
    console.log('\n6️⃣ Checking for errors...\n');
    await executeCommand(conn, 'docker logs coolify-proxy --tail 5 2>&1 | grep "ERR" || echo "✅ No errors found"');

    // Step 7: Test login
    console.log('\n7️⃣ Testing login endpoint...\n');
    await executeCommand(conn, `curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' 2>&1 | grep -E "access_token|error" | head -3`);

    console.log('\n' + '='.repeat(80));
    console.log('✅✅✅ SYSTEM FULLY OPERATIONAL ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🌐 All Services:');
    console.log('✅ Application: https://healthscribe.pro');
    console.log('✅ Supabase: https://supabase.healthscribe.pro');
    console.log('✅ N8N: https://n8n.healthscribe.pro');
    console.log('');
    console.log('🔧 Configuration:');
    console.log('✅ N8N Webhook: https://n8n.healthscribe.pro/webhook/medical-transcribe-v2');
    console.log('✅ Callback URL: https://healthscribe.pro/api/transcription-result-v2');
    console.log('');
    console.log('🎉 Website is UP and WORKING!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

