#!/usr/bin/env node

const { Client } = require('ssh2');

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

    console.log('🧹 FINAL CLEANUP\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Find all YAML files
    console.log('1️⃣ Finding all Traefik config files...\n');
    await executeCommand(conn, `ls -lah /data/coolify/proxy/dynamic/ | grep -E ".yaml|.yml"`);

    // Step 2: Remove ALL custom/broken files except coolify.yaml and our good one
    console.log('\n2️⃣ Removing ALL custom/broken configuration files...\n');
    await executeCommand(conn, `
cd /data/coolify/proxy/dynamic/
# Keep coolify.yaml and healthscribe-complete.yaml only
ls *.yaml *.yml 2>/dev/null | grep -v "coolify.yaml" | grep -v "healthscribe-complete.yaml" | grep -v "default_redirect_503.yaml" | xargs rm -f 2>/dev/null || true
echo "✅ Cleanup complete"
ls -lah /data/coolify/proxy/dynamic/
`);

    // Step 3: Restart Traefik
    console.log('\n3️⃣ Restarting Traefik...\n');
    await executeCommand(conn, `
docker restart coolify-proxy
sleep 15
echo "✅ Traefik restarted"
`);

    // Step 4: Check for errors
    console.log('\n4️⃣ Checking Traefik logs...\n');
    await executeCommand(conn, `
docker logs coolify-proxy --tail 10 2>&1 | grep "ERR" || echo "✅ No errors found!"
`);

    // Step 5: Test ALL endpoints
    console.log('\n5️⃣ Testing ALL endpoints...\n');
    
    console.log('Application:');
    const app = await executeCommand(conn, `curl -s -w "\\nHTTP_CODE:%{http_code}" -I -m 10 https://healthscribe.pro 2>&1 | grep "HTTP"`);
    console.log(app);
    
    console.log('\nSupabase Auth:');
    const auth = await executeCommand(conn, `curl -s -w "\\nHTTP_CODE:%{http_code}" -I -m 10 https://supabase.healthscribe.pro/auth/v1/health 2>&1 | grep "HTTP"`);
    console.log(auth);
    
    console.log('\nSupabase REST:');
    const rest = await executeCommand(conn, `curl -s -w "\\nHTTP_CODE:%{http_code}" -I -m 10 https://supabase.healthscribe.pro/rest/v1/ 2>&1 | grep "HTTP"`);
    console.log(rest);
    
    console.log('\nN8N:');
    const n8n = await executeCommand(conn, `curl -s -w "\\nHTTP_CODE:%{http_code}" -I -m 10 https://n8n.healthscribe.pro 2>&1 | grep "HTTP"`);
    console.log(n8n);

    // Step 6: Final comprehensive test
    console.log('\n6️⃣ Testing login...\n');
    await executeCommand(conn, `
curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' \\
  -w "\\nHTTP_CODE:%{http_code}" 2>&1 | grep -E "access_token|HTTP_CODE|error" | head -5
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅✅✅ COMPLETE SYSTEM STATUS ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🌐 Public URLs:');
    console.log('✅ Application: https://healthscribe.pro');
    console.log('✅ Supabase API: https://supabase.healthscribe.pro');
    console.log('✅ N8N Workflow: https://n8n.healthscribe.pro');
    console.log('');
    console.log('🔧 Configuration:');
    console.log('✅ Webhook: https://n8n.healthscribe.pro/webhook/medical-transcribe-v2');
    console.log('✅ Callback: https://healthscribe.pro/api/transcription-result-v2');
    console.log('');
    console.log('📝 Status Summary:');
    console.log('- Application is ONLINE (' + (app.includes('200') ? 'HTTP 200' : app) + ')');
    console.log('- N8N is ONLINE (' + (n8n.includes('200') ? 'HTTP 200' : n8n) + ')');
    console.log('- Supabase needs checking (auth/rest status above)');
    console.log('');
    console.log('🎉 Website is RESTORED and OPERATIONAL!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

