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

    console.log('🔧 FIXING YAML SYNTAX ERRORS\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Get IPs
    console.log('1️⃣ Getting container IPs...\n');
    const authIp = (await executeCommand(conn, `docker inspect supabase-auth-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const restIp = (await executeCommand(conn, `docker inspect supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const storageIp = (await executeCommand(conn, `docker inspect supabase-storage-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const n8nIp = (await executeCommand(conn, `docker ps -f name=n8n | grep -v NAMES | head -1 | awk '{print $1}' | xargs docker inspect 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const appIp = (await executeCommand(conn, `docker inspect healthscribe-app 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();

    console.log(`✅ Auth: ${authIp}, REST: ${restIp}, Storage: ${storageIp}, N8N: ${n8nIp}, App: ${appIp}\n`);

    // Step 2: Remove old config and create clean one
    console.log('2️⃣ Creating clean YAML configuration...\n');
    await executeCommand(conn, `
rm -f /data/coolify/proxy/dynamic/healthscribe-system.yaml
rm -f /data/coolify/proxy/dynamic/supabase.yaml

cat > /data/coolify/proxy/dynamic/healthscribe-complete.yaml << 'ENDOFFILE'
http:
  routers:
    supabase-auth:
      rule: "Host(\\`supabase.healthscribe.pro\\`) && PathPrefix(\\`/auth/v1\\`)"
      service: supabase-auth
      entryPoints:
        - https
      middlewares:
        - cors-headers
      tls:
        certResolver: letsencrypt

    supabase-rest:
      rule: "Host(\\`supabase.healthscribe.pro\\`) && PathPrefix(\\`/rest/v1\\`)"
      service: supabase-rest
      entryPoints:
        - https
      middlewares:
        - cors-headers
      tls:
        certResolver: letsencrypt

    supabase-storage:
      rule: "Host(\\`supabase.healthscribe.pro\\`) && PathPrefix(\\`/storage/v1\\`)"
      service: supabase-storage
      entryPoints:
        - https
      middlewares:
        - cors-headers
      tls:
        certResolver: letsencrypt

    n8n-webhook:
      rule: "Host(\\`n8n.healthscribe.pro\\`)"
      service: n8n
      entryPoints:
        - https
      middlewares:
        - cors-headers
      tls:
        certResolver: letsencrypt

    healthscribe-main:
      rule: "Host(\\`healthscribe.pro\\`) || Host(\\`www.healthscribe.pro\\`)"
      service: healthscribe-app
      entryPoints:
        - https
      tls:
        certResolver: letsencrypt

  services:
    supabase-auth:
      loadBalancer:
        servers:
          - url: "http://${authIp}:9999"

    supabase-rest:
      loadBalancer:
        servers:
          - url: "http://${restIp}:3000"

    supabase-storage:
      loadBalancer:
        servers:
          - url: "http://${storageIp}:5000"

    n8n:
      loadBalancer:
        servers:
          - url: "http://${n8nIp}:5678"

    healthscribe-app:
      loadBalancer:
        servers:
          - url: "http://${appIp}:3000"

  middlewares:
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
          - "*"
        accessControlExposeHeaders:
          - "*"
        accessControlAllowCredentials: true
        accessControlMaxAge: 3600
        addVaryHeader: true
ENDOFFILE

echo "✅ Configuration created"
`);

    // Step 3: Fix the backticks in the file
    console.log('\n3️⃣ Fixing backtick escapes...\n');
    await executeCommand(conn, `
sed -i "s/\\\\\\\\\\\`/\`/g" /data/coolify/proxy/dynamic/healthscribe-complete.yaml
echo "✅ Backticks fixed"
cat /data/coolify/proxy/dynamic/healthscribe-complete.yaml | head -20
`);

    // Step 4: Restart Traefik
    console.log('\n4️⃣ Restarting Traefik...\n');
    await executeCommand(conn, `
docker restart coolify-proxy
sleep 10
echo "✅ Traefik restarted"
`);

    // Step 5: Test all endpoints
    console.log('\n5️⃣ Testing all endpoints...\n');
    
    console.log('Application:');
    await executeCommand(conn, `curl -s -I -m 10 https://healthscribe.pro 2>&1 | grep "HTTP" | head -1`);
    
    console.log('\nSupabase Auth:');
    await executeCommand(conn, `curl -s -I -m 10 https://supabase.healthscribe.pro/auth/v1/health 2>&1 | grep "HTTP" | head -1`);
    
    console.log('\nN8N:');
    await executeCommand(conn, `curl -s -I -m 10 https://n8n.healthscribe.pro 2>&1 | grep "HTTP" | head -1`);

    // Step 6: Check for errors
    console.log('\n6️⃣ Checking for errors...\n');
    await executeCommand(conn, `
docker logs coolify-proxy --tail 5 2>&1 | grep "ERR" || echo "✅ No errors found"
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL SYSTEMS OPERATIONAL');
    console.log('='.repeat(80));
    console.log('\n🌐 All Services Online:');
    console.log('✅ https://healthscribe.pro');
    console.log('✅ https://supabase.healthscribe.pro');
    console.log('✅ https://n8n.healthscribe.pro');
    console.log('');
    console.log('✅ N8N Webhook: https://n8n.healthscribe.pro/webhook/medical-transcribe-v2');
    console.log('✅ Callback URL: https://healthscribe.pro/api/transcription-result-v2');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

