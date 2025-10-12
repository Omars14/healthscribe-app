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

    console.log('🔧 PATCHING SERVER-SIDE API WITH NODE SCRIPT\n');
    console.log('=' .repeat(80) + '\n');
    
    // Create patch script that will run inside container
    console.log('📝 Step 1: Creating patch script...\n');
    await executeCommand(conn, `
cat > /tmp/patch-api.js <<'PATCHSCRIPT'
const fs = require('fs');
const path = require('path');

const OLD_URL = 'yaznemrwbingjwqutbvb.supabase.co';
const NEW_URL = 'supabase.healthscribe.pro';

const OLD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjA0MzAsImV4cCI6MjA3MTAzNjQzMH0.uluQzD4-m91tUq0gOrUNOfR9rlN0Ry4tAPlxp-PWrIo';
const NEW_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA';

const OLD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ2MDQzMCwiZXhwIjoyMDcxMDM2NDMwfQ.9Ib029SJ7rGbBI4JMoEKacX4LMOZbzOedDZ9JGtuXas';
const NEW_SERVICE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY';

function patchFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    if (content.includes(OLD_URL)) {
      content = content.replace(new RegExp(OLD_URL, 'g'), NEW_URL);
      modified = true;
    }

    if (content.includes(OLD_ANON_KEY)) {
      content = content.replace(new RegExp(OLD_ANON_KEY, 'g'), NEW_ANON_KEY);
      modified = true;
    }

    if (content.includes(OLD_SERVICE_KEY)) {
      content = content.replace(new RegExp(OLD_SERVICE_KEY, 'g'), NEW_SERVICE_KEY);
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log('✅ Patched: ' + filePath);
      return 1;
    }

    return 0;
  } catch (error) {
    return 0;
  }
}

function walk(dir, callback) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walk(filePath, callback);
      } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.json'))) {
        callback(filePath);
      }
    });
  } catch (error) {
    // Ignore errors
  }
}

let patchedFiles = 0;

if (fs.existsSync('/app/.next/server')) {
  console.log('Patching server bundles...');
  walk('/app/.next/server', (file) => {
    patchedFiles += patchFile(file);
  });
}

if (fs.existsSync('/app/.next/static')) {
  console.log('Patching static bundles...');
  walk('/app/.next/static', (file) => {
    patchedFiles += patchFile(file);
  });
}

console.log('Total files patched: ' + patchedFiles);
PATCHSCRIPT

echo "Patch script created"
`);

    // Step 2: Copy script to container and run
    console.log('\n🚀 Step 2: Running patch script inside container...\n');
    await executeCommand(conn, `
docker cp /tmp/patch-api.js healthscribe-app:/tmp/patch-api.js
docker exec healthscribe-app node /tmp/patch-api.js
`);

    // Step 3: Restart container
    console.log('\n🔄 Step 3: Restarting container...\n');
    await executeCommand(conn, `
docker restart healthscribe-app
sleep 35
docker ps --filter "name=healthscribe-app" --format "{{.Names}} - {{.Status}}"
`);

    // Step 4: Test
    console.log('\n✅ Step 4: Testing patched API...\n');
    await executeCommand(conn, `
TOKEN=\$(curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' | jq -r '.access_token')

echo "Testing transcriptions API..."
curl -s "https://healthscribe.pro/api/transcriptions" \\
  -H "Authorization: Bearer \$TOKEN" | jq '{success, count}'
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ SERVER-SIDE API PATCHED - TESTING IN BROWSER');
    console.log('='.repeat(80));
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

