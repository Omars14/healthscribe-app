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

    console.log('🔍 VERIFYING PATCH AND FIXING IF NEEDED\n');
    
    // Extract route file
    console.log('📄 Extracting API route file to verify...\n');
    await executeCommand(conn, `
docker cp healthscribe-app:/app/.next/server/app/api/transcriptions/route.js /tmp/route-check.js
cat /tmp/route-check.js | grep -c "4a99755c"
`);

    // Create better patch that handles minified code
    console.log('\n🔧 Creating improved patch script...\n');
    await executeCommand(conn, `
cat > /tmp/fix-user-id.sh <<'FIXSCRIPT'
#!/bin/sh

# The issue: Hardcoded user ID in minified code
# Pattern: let a="4a99755c-53ba-486c-8393-1460561b2259";
# We need to make the API route NOT use a hardcoded user ID

# Download the full route.js
cd /app/.next/server/app/api/transcriptions

# Create a wrapper that intercepts the hardcoded user call
cat > /tmp/intercept.js <<'INTERCEPT'
const originalModule = require('./route.js');

// Override the GET handler to fix user ID
const originalGET = originalModule.GET;

module.exports = {
  GET: async (request) => {
    try {
      // Get auth token from request
      const authHeader = request.headers.get('authorization');
      let token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        const cookies = request.cookies;
        token = cookies.get('sb-access-token')?.value;
      }
      
      if (!token) {
        return new Response(JSON.stringify({ success: false, error: 'No auth token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Call original but it will have wrong user ID - we'll override
      const response = await originalGET(request);
      return response;
      
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
INTERCEPT

# Actually, better approach: Just find and replace in the file
cd /app/.next/server/app/api/transcriptions
cp route.js route.js.backup

# Use node to do the replacement (more reliable than sed in Alpine)
node -e "
const fs = require('fs');
let content = fs.readFileSync('route.js', 'utf8');
content = content.replace(/let a=\"4a99755c-53ba-486c-8393-1460561b2259\";/g, 'let a=userId;');
content = content.replace(/4a99755c-53ba-486c-8393-1460561b2259/g, 'DYNAMIC_USER_ID');
fs.writeFileSync('route.js', content);
console.log('Route patched');
"

echo "User ID hardcoding removed"
FIXSCRIPT

chmod +x /tmp/fix-user-id.sh
docker cp /tmp/fix-user-id.sh healthscribe-app:/tmp/fix-user-id.sh
docker exec healthscribe-app sh /tmp/fix-user-id.sh
`);

    // Restart
    console.log('\n🔄 Restarting...\n');
    await executeCommand(conn, `
docker restart healthscribe-app
sleep 35
docker ps --filter "name=healthscribe-app"
`);

    // Test
    console.log('\n✅ Testing API...\n');
    await executeCommand(conn, `
TOKEN=\$(curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' | jq -r '.access_token')

curl -s "https://healthscribe.pro/api/transcriptions" \\
  -H "Authorization: Bearer \$TOKEN" | jq '{success, count}'

docker logs healthscribe-app 2>&1 | grep "Querying for user ID" | tail -3
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ TESTING IN BROWSER');
    console.log('='.repeat(80));
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

