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

    console.log('🔧 REBUILDING FROM COOLIFY CONFIG\n');
    console.log('=' .repeat(80) + '\n');

    // Option 1: Modify docker-compose to use existing image
    console.log('1️⃣ Using existing healthscribe-final image...\n');
    await executeCommand(conn, `
cd /data/coolify/applications/tkwoos4soccckws84088wc04

# Backup original
cp docker-compose.yaml docker-compose.yaml.bak

# Update to use existing image
cat docker-compose.yaml | sed 's|tkwoos4soccckws84088wc04:907c11912c102fc6051164dd762671bfa1e78009|healthscribe-final:latest|' > docker-compose.yaml.new
mv docker-compose.yaml.new docker-compose.yaml

echo "✅ Updated docker-compose.yaml"
cat docker-compose.yaml | head -10
`);

    console.log('\n2️⃣ Starting application...\n');
    await executeCommand(conn, `
cd /data/coolify/applications/tkwoos4soccckws84088wc04
docker-compose up -d
echo "✅ Started"
sleep 15
`);

    console.log('\n3️⃣ Checking status...\n');
    await executeCommand(conn, `
cd /data/coolify/applications/tkwoos4soccckws84088wc04
docker-compose ps
docker ps | grep tkwoos4soccckws84088wc04
`);

    const containerName = (await executeCommand(conn, `docker ps --filter "name=tkwoos4soccckws84088wc04" --format "{{.Names}}" | head -1`)).trim();
    
    if (containerName) {
      console.log(`\n✅ Container running: ${containerName}\n`);

      const appIp = (await executeCommand(conn, `docker inspect ${containerName} 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
      console.log(`IP: ${appIp}\n`);

      if (appIp) {
        console.log('4️⃣ Updating Traefik...\n');
        const authIp = (await executeCommand(conn, `docker inspect supabase-auth-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
        const restIp = (await executeCommand(conn, `docker inspect supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
        const storageIp = (await executeCommand(conn, `docker inspect supabase-storage-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
        const n8nIp = (await executeCommand(conn, `docker inspect n8n-tw4ckcco4kck08gs4g8wgowc 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();

        await executeCommand(conn, `
cat > /data/coolify/proxy/dynamic/system.yaml << 'EOF'
http:
  routers:
    supabase-auth:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/auth/v1\`)"
      service: supabase-auth
      entryPoints:
        - https
      middlewares:
        - supabase-strip-auth
        - cors-all
      tls:
        certResolver: letsencrypt

    supabase-rest:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/rest/v1\`)"
      service: supabase-rest
      entryPoints:
        - https
      middlewares:
        - cors-all
      tls:
        certResolver: letsencrypt

    supabase-storage:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/storage/v1\`)"
      service: supabase-storage
      entryPoints:
        - https
      middlewares:
        - supabase-strip-storage
        - cors-all
      tls:
        certResolver: letsencrypt

    n8n:
      rule: "Host(\`n8n.healthscribe.pro\`)"
      service: n8n
      entryPoints:
        - https
      middlewares:
        - cors-all
      tls:
        certResolver: letsencrypt

    healthscribe:
      rule: "Host(\`healthscribe.pro\`) || Host(\`www.healthscribe.pro\`)"
      service: healthscribe
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

    healthscribe:
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
    
    cors-all:
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

rm -f /data/coolify/proxy/dynamic/healthscribe*.yaml
docker restart coolify-proxy
sleep 10
echo "✅ Traefik updated"
`);

        console.log('\n5️⃣ Testing...\n');
        await executeCommand(conn, `
echo "Application (external):"
curl -s -I https://healthscribe.pro | grep HTTP
echo ""
echo "Application (internal):"
curl -s -I http://${appIp}:3000 | grep HTTP
echo ""
echo "Auth:"
curl -s -I https://supabase.healthscribe.pro/auth/v1/health | grep HTTP
echo ""
echo "N8N:"
curl -s -I https://n8n.healthscribe.pro | grep HTTP
`);

        console.log('\n' + '='.repeat(80));
        console.log('✅✅✅ SYSTEM RESTORED! ✅✅✅');
        console.log('='.repeat(80));
        console.log(`\n📦 Container: ${containerName}`);
        console.log(`🌐 IP: ${appIp}`);
        console.log('\n🚀 Application: https://healthscribe.pro');
        console.log('🔐 Supabase: https://supabase.healthscribe.pro');
        console.log('🔄 N8N: https://n8n.healthscribe.pro');
        console.log('\n✅ Hard refresh (CTRL+SHIFT+R) and try again!');
        console.log('');

      } else {
        console.log('Container running but no IP - check logs');
        await executeCommand(conn, `docker logs ${containerName} --tail 30 2>&1`);
      }
    } else {
      console.log('❌ Container failed to start - checking logs...\n');
      await executeCommand(conn, `docker logs tkwoos4soccckws84088wc04-184252873467 --tail 50 2>&1`);
    }

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

