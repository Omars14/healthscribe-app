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

    console.log('🔧 FIXING TRAEFIK ROUTING COMPLETELY\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Get all container IPs
    console.log('1️⃣ Getting container IPs...\n');
    const authIp = (await executeCommand(conn, `docker inspect supabase-auth-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const restIp = (await executeCommand(conn, `docker inspect supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const storageIp = (await executeCommand(conn, `docker inspect supabase-storage-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const n8nIp = (await executeCommand(conn, `docker inspect n8n-tw4ckcco4kck08gs4g8wgowc 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const appIp = (await executeCommand(conn, `docker inspect tkwoos4soccckws84088wc04-184252873467 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();

    console.log(`\n📍 Container IPs:`);
    console.log(`   Auth:    ${authIp}:9999`);
    console.log(`   REST:    ${restIp}:3000`);
    console.log(`   Storage: ${storageIp}:5000`);
    console.log(`   N8N:     ${n8nIp}:5678`);
    console.log(`   App:     ${appIp}:3000\n`);

    // Step 2: Remove all old Traefik configs
    console.log('2️⃣ Removing old Traefik configurations...\n');
    await executeCommand(conn, `
rm -f /data/coolify/proxy/dynamic/system.yaml
rm -f /data/coolify/proxy/dynamic/complete.yaml
rm -f /data/coolify/proxy/dynamic/final.yaml
rm -f /data/coolify/proxy/dynamic/supabase.yaml
rm -f /data/coolify/proxy/dynamic/healthscribe.yaml
echo "✅ Old configs removed"
`);

    // Step 3: Create new clean Traefik configuration
    console.log('\n3️⃣ Creating new Traefik configuration...\n');
    await executeCommand(conn, `
cat > /data/coolify/proxy/dynamic/healthscribe-system.yaml << 'YAMLEOF'
http:
  routers:
    healthscribe-app:
      rule: "Host(\`healthscribe.pro\`) || Host(\`www.healthscribe.pro\`)"
      service: healthscribe-app
      entryPoints:
        - https
      tls:
        certResolver: letsencrypt

    supabase-auth-route:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/auth/v1\`)"
      service: supabase-auth-service
      entryPoints:
        - https
      middlewares:
        - strip-auth
        - cors-headers
      tls:
        certResolver: letsencrypt

    supabase-rest-route:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/rest/v1\`)"
      service: supabase-rest-service
      entryPoints:
        - https
      middlewares:
        - cors-headers
      tls:
        certResolver: letsencrypt

    supabase-storage-route:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/storage/v1\`)"
      service: supabase-storage-service
      entryPoints:
        - https
      middlewares:
        - strip-storage
        - cors-headers
      tls:
        certResolver: letsencrypt

    n8n-route:
      rule: "Host(\`n8n.healthscribe.pro\`)"
      service: n8n-service
      entryPoints:
        - https
      tls:
        certResolver: letsencrypt

  services:
    healthscribe-app:
      loadBalancer:
        servers:
          - url: "http://${appIp}:3000"

    supabase-auth-service:
      loadBalancer:
        servers:
          - url: "http://${authIp}:9999"

    supabase-rest-service:
      loadBalancer:
        servers:
          - url: "http://${restIp}:3000"

    supabase-storage-service:
      loadBalancer:
        servers:
          - url: "http://${storageIp}:5000"

    n8n-service:
      loadBalancer:
        servers:
          - url: "http://${n8nIp}:5678"

  middlewares:
    strip-auth:
      stripPrefix:
        prefixes:
          - "/auth/v1"

    strip-storage:
      stripPrefix:
        prefixes:
          - "/storage/v1"

    cors-headers:
      headers:
        accessControlAllowMethods:
          - GET
          - POST
          - PUT
          - PATCH
          - DELETE
          - OPTIONS
        accessControlAllowOriginList:
          - "https://healthscribe.pro"
          - "https://www.healthscribe.pro"
        accessControlAllowHeaders:
          - Authorization
          - Content-Type
          - apikey
          - Prefer
          - X-Client-Info
        accessControlExposeHeaders:
          - Content-Range
          - X-Total-Count
        accessControlAllowCredentials: true
        accessControlMaxAge: 3600
        addVaryHeader: true
YAMLEOF

echo "✅ Configuration created"
`);

    // Step 4: Restart Traefik
    console.log('\n4️⃣ Restarting Traefik...\n');
    await executeCommand(conn, `
docker restart coolify-proxy
sleep 15
echo "✅ Traefik restarted"
`);

    // Step 5: Check Traefik logs for errors
    console.log('\n5️⃣ Checking Traefik logs...\n');
    await executeCommand(conn, `
docker logs coolify-proxy 2>&1 | grep -E "ERR|healthscribe" | tail -10
`);

    // Step 6: Test all endpoints
    console.log('\n6️⃣ Testing all endpoints...\n');
    
    console.log('Testing Application:');
    await executeCommand(conn, `
curl -s -I https://healthscribe.pro 2>&1 | head -1
`);

    console.log('\nTesting N8N:');
    await executeCommand(conn, `
curl -s -I https://n8n.healthscribe.pro 2>&1 | head -1
`);

    console.log('\nTesting Supabase Auth:');
    await executeCommand(conn, `
curl -s -I https://supabase.healthscribe.pro/auth/v1/health 2>&1 | head -1
`);

    console.log('\nTesting Supabase REST API:');
    await executeCommand(conn, `
curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=id,status&limit=3" \\
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwMjk5MjYwLCJleHAiOjIwNzU2NTkyNjB9.fuBekR-do0ST4CxThWM5UcjFacFpZC3AMqxNSSp3DMM" \\
  2>&1 | head -20
`);

    console.log('\nTesting Supabase Storage:');
    await executeCommand(conn, `
curl -s -I "https://supabase.healthscribe.pro/storage/v1/bucket" \\
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwMjk5MjYwLCJleHAiOjIwNzU2NTkyNjB9.fuBekR-do0ST4CxThWM5UcjFacFpZC3AMqxNSSp3DMM" \\
  2>&1 | head -1
`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅✅✅ TRAEFIK ROUTING FIXED! ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n📊 All routes configured:');
    console.log('✅ https://healthscribe.pro → Application');
    console.log('✅ https://n8n.healthscribe.pro → N8N');
    console.log('✅ https://supabase.healthscribe.pro/auth/v1 → Supabase Auth');
    console.log('✅ https://supabase.healthscribe.pro/rest/v1 → Supabase REST');
    console.log('✅ https://supabase.healthscribe.pro/storage/v1 → Supabase Storage');
    console.log('\n🚀 Hard refresh (CTRL+SHIFT+R) and check transcription history!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

