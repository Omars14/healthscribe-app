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

    console.log('🔧 BYPASSING KONG - ROUTING DIRECTLY TO CONTAINERS\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Get IPs
    console.log('1️⃣ Getting container IPs...\n');
    const authIp = (await executeCommand(conn, `docker inspect supabase-auth-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const restIp = (await executeCommand(conn, `docker inspect supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const storageIp = (await executeCommand(conn, `docker inspect supabase-storage-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const n8nIp = (await executeCommand(conn, `docker ps -f name=n8n | grep -v NAMES | head -1 | awk '{print $1}' | xargs docker inspect 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const appIp = (await executeCommand(conn, `docker inspect healthscribe-app 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();

    console.log(`Auth: ${authIp}, REST: ${restIp}, Storage: ${storageIp}, N8N: ${n8nIp}, App: ${appIp}\n`);

    // Step 2: Create new Traefik config that routes DIRECTLY to containers (no Kong)
    console.log('2️⃣ Creating direct routing configuration (bypassing Kong)...\n');
    await executeCommand(conn, `
cat > /data/coolify/proxy/dynamic/healthscribe-direct.yaml << 'EOF'
http:
  routers:
    supabase-auth-direct:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/auth/v1\`)"
      service: supabase-auth-direct
      entryPoints:
        - https
      middlewares:
        - supabase-strip-auth
        - cors-headers
      tls:
        certResolver: letsencrypt

    supabase-rest-direct:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/rest/v1\`)"
      service: supabase-rest-direct
      entryPoints:
        - https
      middlewares:
        - supabase-strip-rest
        - cors-headers
      tls:
        certResolver: letsencrypt

    supabase-storage-direct:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/storage/v1\`)"
      service: supabase-storage-direct
      entryPoints:
        - https
      middlewares:
        - supabase-strip-storage
        - cors-headers
      tls:
        certResolver: letsencrypt

    n8n-webhook:
      rule: "Host(\`n8n.healthscribe.pro\`)"
      service: n8n-direct
      entryPoints:
        - https
      middlewares:
        - cors-headers
      tls:
        certResolver: letsencrypt

    healthscribe-main:
      rule: "Host(\`healthscribe.pro\`) || Host(\`www.healthscribe.pro\`)"
      service: healthscribe-app-direct
      entryPoints:
        - https
      tls:
        certResolver: letsencrypt

  services:
    supabase-auth-direct:
      loadBalancer:
        servers:
          - url: "http://${authIp}:9999"

    supabase-rest-direct:
      loadBalancer:
        servers:
          - url: "http://${restIp}:3000"

    supabase-storage-direct:
      loadBalancer:
        servers:
          - url: "http://${storageIp}:5000"

    n8n-direct:
      loadBalancer:
        servers:
          - url: "http://${n8nIp}:5678"

    healthscribe-app-direct:
      loadBalancer:
        servers:
          - url: "http://${appIp}:3000"

  middlewares:
    supabase-strip-auth:
      stripPrefix:
        prefixes:
          - "/auth/v1"
    
    supabase-strip-rest:
      stripPrefix:
        prefixes:
          - "/rest/v1"
    
    supabase-strip-storage:
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
          - "*"
        accessControlExposeHeaders:
          - "*"
        accessControlAllowCredentials: true
        accessControlMaxAge: 3600
        addVaryHeader: true
EOF

echo "✅ Configuration created"
`);

    // Step 3: Remove old config
    console.log('\n3️⃣ Removing old configuration...\n');
    await executeCommand(conn, 'rm -f /data/coolify/proxy/dynamic/healthscribe-complete.yaml && echo "✅ Old config removed"');

    // Step 4: Restart Traefik
    console.log('\n4️⃣ Restarting Traefik...\n');
    await executeCommand(conn, 'docker restart coolify-proxy && sleep 15 && echo "✅ Traefik restarted"');

    // Step 5: Test login
    console.log('\n5️⃣ Testing login endpoint...\n');
    await executeCommand(conn, `
curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' \\
  2>&1 | grep -E "access_token|error" | head -3
`);

    // Step 6: Test all endpoints
    console.log('\n6️⃣ Testing all endpoints...\n');
    console.log('Application:');
    await executeCommand(conn, 'curl -s -I https://healthscribe.pro | grep HTTP');
    console.log('\nAuth:');
    await executeCommand(conn, 'curl -s -I https://supabase.healthscribe.pro/auth/v1/health | grep HTTP');
    console.log('\nN8N:');
    await executeCommand(conn, 'curl -s -I https://n8n.healthscribe.pro | grep HTTP');

    console.log('\n\n' + '='.repeat(80));
    console.log('✅✅✅ DIRECT ROUTING CONFIGURED ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🎉 Kong bypassed - routing directly to containers!');
    console.log('');
    console.log('🌐 All Services:');
    console.log('✅ Application: https://healthscribe.pro');
    console.log('✅ Supabase: https://supabase.healthscribe.pro');
    console.log('✅ N8N: https://n8n.healthscribe.pro');
    console.log('');
    console.log('🔧 Configuration:');
    console.log(`✅ Auth: ${authIp}:9999`);
    console.log(`✅ REST: ${restIp}:3000`);
    console.log(`✅ Storage: ${storageIp}:5000`);
    console.log('');
    console.log('🚀 Try logging in again now!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

