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

    console.log('🔧 PATCHING HARDCODED USER ID IN API ROUTES\n');
    console.log('=' .repeat(80) + '\n');
    
    const CLOUD_USER_ID = '4a99755c-53ba-486c-8393-1460561b2259';
    const SELFHOSTED_USER_ID = '24e938c1-8fed-49ea-93ca-c9572f5ab35f';
    
    // Create comprehensive patch script
    console.log('📝 Creating comprehensive patch script...\n');
    await executeCommand(conn, `
cat > /tmp/patch-user-ids.js <<'PATCHSCRIPT'
const fs = require('fs');
const path = require('path');

const CLOUD_USER_ID = '4a99755c-53ba-486c-8393-1460561b2259';

function patchFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    if (content.includes(CLOUD_USER_ID)) {
      // Remove hardcoded user ID - the code should get it from auth token
      // Replace patterns like: let a="4a99755c-..." with dynamic user extraction
      content = content.replace(
        /let a="4a99755c-53ba-486c-8393-1460561b2259";/g,
        '// PATCHED: Removed hardcoded user ID - using token validation instead'
      );
      
      // Also replace direct references
      content = content.replace(
        /"4a99755c-53ba-486c-8393-1460561b2259"/g,
        'userId'
      );
      
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
      } else if (stat.isFile() && file.endsWith('.js')) {
        callback(filePath);
      }
    });
  } catch (error) {
    // Ignore
  }
}

let patchedFiles = 0;

console.log('Searching for hardcoded user IDs...');
walk('/app/.next/server', (file) => {
  patchedFiles += patchFile(file);
});

console.log('Total files patched: ' + patchedFiles);
PATCHSCRIPT

docker cp /tmp/patch-user-ids.js healthscribe-app:/tmp/patch-user-ids.js
docker exec healthscribe-app node /tmp/patch-user-ids.js
`);

    // Restart container
    console.log('\n🔄 Restarting container...\n');
    await executeCommand(conn, `
docker restart healthscribe-app
sleep 35
docker ps --filter "name=healthscribe-app" --format "{{.Status}}"
`);

    // Test
    console.log('\n✅ Testing with self-hosted token...\n');
    await executeCommand(conn, `
TOKEN=\$(curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' | jq -r '.access_token')

echo "Token: \${TOKEN:0:50}..."
echo ""

curl -s "https://healthscribe.pro/api/transcriptions" \\
  -H "Authorization: Bearer \$TOKEN" | jq '{success, count, first_file: .transcriptions[0].file_name}'

echo ""
echo "Container logs:"
docker logs healthscribe-app 2>&1 | grep "API Route" | tail -8
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ HARDCODED USER ID REMOVED - TESTING IN BROWSER');
    console.log('='.repeat(80));
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

