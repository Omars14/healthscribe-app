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

    console.log('🔧 FIXING APP NOW\n');
    console.log('=' .repeat(80) + '\n');

    // Find running containers
    console.log('1️⃣ Finding containers...\n');
    await executeCommand(conn, `
docker ps -a | grep -E "healthscribe|dashboard" | head -10
`);

    // Get logs if container exists
    console.log('\n2️⃣ Checking logs...\n');
    await executeCommand(conn, `
docker logs healthscribe-app --tail 30 2>&1 || echo "No logs available"
`);

    // Use a working image
    console.log('\n3️⃣ Using working production image...\n');
    await executeCommand(conn, `
docker stop healthscribe-app 2>/dev/null || true
docker rm healthscribe-app 2>/dev/null || true

docker run -d \\
  --name healthscribe-app \\
  --network coolify \\
  -p 3000:3000 \\
  --restart unless-stopped \\
  -e "N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2" \\
  -e "NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro" \\
  -e "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  healthscribe-production:latest

echo "✅ Container started"
sleep 10
`);

    // Check status
    console.log('\n4️⃣ Verifying...\n');
    await executeCommand(conn, `
docker ps -f name=healthscribe-app --format "{{.Names}} - {{.Status}}"
`);

    // Get new IP
    console.log('\n5️⃣ Getting new IP and updating Traefik...\n');
    const appIp = (await executeCommand(conn, `docker inspect healthscribe-app 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    console.log(`App IP: ${appIp}\n`);

    const authIp = (await executeCommand(conn, `docker inspect supabase-auth-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const restIp = (await executeCommand(conn, `docker inspect supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const storageIp = (await executeCommand(conn, `docker inspect supabase-storage-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const n8nIp = (await executeCommand(conn, `docker ps -f name=n8n | grep -v NAMES | head -1 | awk '{print $1}' | xargs docker inspect 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();

    await executeCommand(conn, `
cat > /data/coolify/proxy/dynamic/healthscribe-complete.yaml << 'EOF'
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

rm -f /data/coolify/proxy/dynamic/healthscribe-fixed.yaml
docker restart coolify-proxy
sleep 10
echo "✅ Traefik updated"
`);

    // Test
    console.log('\n6️⃣ Testing...\n');
    await executeCommand(conn, `
echo "Application:"
curl -s -I https://healthscribe.pro | grep HTTP
echo ""
echo "Auth:"
curl -s -I https://supabase.healthscribe.pro/auth/v1/health | grep HTTP
`);

    console.log('\n✅ APP RESTORED!\n');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

