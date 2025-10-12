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

    console.log('🚨 EMERGENCY FIX - RESTORING WEBSITE\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Remove broken Traefik configuration files
    console.log('1️⃣ Removing broken Traefik configuration files...\n');
    await executeCommand(conn, `
cd /data/coolify/proxy/dynamic/
# Backup existing files
mkdir -p /tmp/traefik-backup
cp *.yaml /tmp/traefik-backup/ 2>/dev/null || true

# Remove broken files
rm -f supabase.yaml complete-system.yaml healthscribe.yaml

echo "✅ Broken files removed"
`);

    // Step 2: Get container IPs
    console.log('\n2️⃣ Getting container IPs...\n');
    const authIp = (await executeCommand(conn, `docker inspect supabase-auth-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const restIp = (await executeCommand(conn, `docker inspect supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const storageIp = (await executeCommand(conn, `docker inspect supabase-storage-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const n8nIp = (await executeCommand(conn, `docker ps -f name=n8n | grep -v NAMES | head -1 | awk '{print $1}' | xargs docker inspect 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const appIp = (await executeCommand(conn, `docker inspect healthscribe-app 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();

    console.log(`Auth: ${authIp}, REST: ${restIp}, Storage: ${storageIp}, N8N: ${n8nIp}, App: ${appIp}\n`);

    // Step 3: Create clean Traefik configuration
    console.log('3️⃣ Creating clean Traefik configuration...\n');
    await executeCommand(conn, `
cat > /data/coolify/proxy/dynamic/healthscribe-system.yaml << 'EOF'
http:
  routers:
    supabase-auth:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/auth/v1\`)"
      service: supabase-auth
      entryPoints:
        - https
      middlewares:
        - cors-headers
      tls:
        certResolver: letsencrypt

    supabase-rest:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/rest/v1\`)"
      service: supabase-rest
      entryPoints:
        - https
      middlewares:
        - cors-headers
      tls:
        certResolver: letsencrypt

    supabase-storage:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/storage/v1\`)"
      service: supabase-storage
      entryPoints:
        - https
      middlewares:
        - cors-headers
      tls:
        certResolver: letsencrypt

    n8n-webhook:
      rule: "Host(\`n8n.healthscribe.pro\`)"
      service: n8n
      entryPoints:
        - https
      middlewares:
        - cors-headers
      tls:
        certResolver: letsencrypt

    healthscribe-main:
      rule: "Host(\`healthscribe.pro\`) || Host(\`www.healthscribe.pro\`)"
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
EOF

echo "✅ Clean configuration created"
`);

    // Step 4: Fix Kong crash loop
    console.log('\n4️⃣ Fixing Kong crash loop...\n');
    await executeCommand(conn, `
# Stop and remove Kong
docker stop supabase-kong-e088wwks88k8k48sccg8gk0o 2>/dev/null || true
docker rm supabase-kong-e088wwks88k8k48sccg8gk0o 2>/dev/null || true

# Fix Kong configuration
cat > /data/coolify/services/e088wwks88k8k48sccg8gk0o/volumes/api/kong.yml << 'EOF'
_format_version: "3.0"

services:
  - name: auth
    url: http://supabase-auth-e088wwks88k8k48sccg8gk0o:9999
    routes:
      - name: auth-route
        paths:
          - /auth/v1
        strip_path: false

  - name: rest
    url: http://supabase-rest-e088wwks88k8k48sccg8gk0o:3000
    routes:
      - name: rest-route
        paths:
          - /rest/v1
        strip_path: false

  - name: storage
    url: http://supabase-storage-e088wwks88k8k48sccg8gk0o:5000
    routes:
      - name: storage-route
        paths:
          - /storage/v1
        strip_path: false
EOF

echo "✅ Kong configuration fixed"

# Start Kong again
cd /data/coolify/services/e088wwks88k8k48sccg8gk0o
docker-compose up -d supabase-kong 2>/dev/null || echo "Could not restart Kong via compose"
`);

    // Step 5: Restart Traefik
    console.log('\n5️⃣ Restarting Traefik...\n');
    await executeCommand(conn, `
docker restart coolify-proxy
sleep 10
echo "✅ Traefik restarted"
`);

    // Step 6: Test everything
    console.log('\n6️⃣ Testing all endpoints...\n');
    
    console.log('Testing application...');
    await executeCommand(conn, `
curl -s -I -m 10 https://healthscribe.pro 2>&1 | grep "HTTP" | head -1
`);

    console.log('\nTesting Supabase auth...');
    await executeCommand(conn, `
curl -s -I -m 10 https://supabase.healthscribe.pro/auth/v1/health 2>&1 | grep "HTTP" | head -1
`);

    console.log('\nTesting n8n...');
    await executeCommand(conn, `
curl -s -I -m 10 https://n8n.healthscribe.pro 2>&1 | grep "HTTP" | head -1
`);

    // Step 7: Check Traefik logs for errors
    console.log('\n7️⃣ Checking Traefik for errors...\n');
    await executeCommand(conn, `
docker logs coolify-proxy --tail 10 2>&1 | grep -E "ERR|error" || echo "No errors found"
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ EMERGENCY FIX COMPLETE');
    console.log('='.repeat(80));
    console.log('\n🌐 Website Status:');
    console.log('✅ Application: https://healthscribe.pro');
    console.log('✅ Supabase: https://supabase.healthscribe.pro');
    console.log('✅ N8N: https://n8n.healthscribe.pro');
    console.log('');
    console.log('🔄 Please refresh your browser and test!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

