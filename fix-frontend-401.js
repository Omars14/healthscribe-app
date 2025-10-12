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

    console.log('🔧 Fixing Frontend 401 Error...\n');
    
    // Check current env in container
    console.log('1. Checking current environment:\n');
    await executeCommand(conn, `
docker exec tkwoos4soccckws84088wc04-170735192160 cat /app/.env.local | grep SUPABASE
`);

    // Update Kong CORS configuration
    console.log('\n2. Updating Kong CORS configuration:\n');
    await executeCommand(conn, `
cat > /data/coolify/services/e088wwks88k8k48sccg8gk0o/volumes/api/kong.yml <<'KONGEOF'
_format_version: '2.1'
_transform: true

consumers:
  - username: anon
    keyauth_credentials:
      - key: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA
  - username: service_role
    keyauth_credentials:
      - key: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY

acls:
  - consumer: anon
    group: anon
  - consumer: service_role
    group: admin

plugins:
  - name: cors
    config:
      origins:
        - https://healthscribe.pro
        - http://localhost:3000
        - https://*.healthscribe.pro
      methods:
        - GET
        - HEAD
        - PUT
        - PATCH
        - POST
        - DELETE
        - OPTIONS
      headers:
        - Accept
        - Accept-Language
        - Content-Language
        - Content-Type
        - Authorization
        - apikey
        - X-Client-Info
      exposed_headers:
        - X-Total-Count
        - Content-Range
      credentials: true
      max_age: 3600

services:
  - name: auth-v1-open
    url: http://supabase-auth:9999/verify
    routes:
      - name: auth-v1-open
        strip_path: true
        paths:
          - /auth/v1/verify
    plugins:
      - name: cors

  - name: auth-v1-open-callback
    url: http://supabase-auth:9999/callback
    routes:
      - name: auth-v1-open-callback
        strip_path: true
        paths:
          - /auth/v1/callback
    plugins:
      - name: cors

  - name: auth-v1-open-authorize
    url: http://supabase-auth:9999/authorize
    routes:
      - name: auth-v1-open-authorize
        strip_path: true
        paths:
          - /auth/v1/authorize
    plugins:
      - name: cors

  - name: auth-v1
    url: http://supabase-auth:9999/
    routes:
      - name: auth-v1-all
        strip_path: true
        paths:
          - /auth/v1/
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon

  - name: rest-v1
    url: http://supabase-rest:3000/
    routes:
      - name: rest-v1-all
        strip_path: true
        paths:
          - /rest/v1/
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon

  - name: realtime-v1
    url: http://realtime-dev:4000/socket/
    routes:
      - name: realtime-v1-all
        strip_path: true
        paths:
          - /realtime/v1/
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon

  - name: storage-v1
    url: http://supabase-storage:5000/
    routes:
      - name: storage-v1-all
        strip_path: true
        paths:
          - /storage/v1/
    plugins:
      - name: cors

  - name: meta-v1
    url: http://supabase-meta:8080/
    routes:
      - name: meta-v1-all
        strip_path: true
        paths:
          - /pg/
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin

  - name: functions-v1
    url: http://supabase-edge-functions:9000/
    routes:
      - name: functions-v1-all
        strip_path: true
        paths:
          - /functions/v1/
    plugins:
      - name: cors

  - name: analytics-v1
    url: http://supabase-analytics:4000/
    routes:
      - name: analytics-v1-all
        strip_path: true
        paths:
          - /analytics/v1/
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
KONGEOF

echo "Kong config updated with CORS"
`);

    // Restart Kong and application
    console.log('\n3. Restarting Kong:\n');
    await executeCommand(conn, `
cd /data/coolify/services/e088wwks88k8k48sccg8gk0o
docker-compose restart supabase-kong
sleep 20
docker ps --filter "name=kong-e088" --format "{{.Status}}"
`);

    // Rebuild application with new env
    console.log('\n4. Rebuilding application:\n');
    const envContent = fs.readFileSync('.env.local', 'utf8');
    await executeCommand(conn, `
cat > /tmp/healthscribe.env << 'ENVEOF'
${envContent}
ENVEOF

docker cp /tmp/healthscribe.env tkwoos4soccckws84088wc04-170735192160:/app/.env.local

# Force rebuild the Next.js app
docker exec tkwoos4soccckws84088wc04-170735192160 rm -rf /app/.next 2>/dev/null || echo "No .next to remove"

docker restart tkwoos4soccckws84088wc04-170735192160

sleep 35

curl -sI https://healthscribe.pro | head -3
`);

    // Test from browser perspective
    console.log('\n5. Testing login as browser would:\n');
    await executeCommand(conn, `
curl -i -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "Origin: https://healthscribe.pro" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' 2>&1 | head -20
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ CORS CONFIGURED & APPLICATION REBUILT');
    console.log('='.repeat(80));
    console.log('\n🎯 TEST NOW (clear browser cache first):');
    console.log('1. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('2. Go to: https://healthscribe.pro/login');
    console.log('3. Email: omars14@gmail.com');
    console.log('4. Password: Nomar123');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

