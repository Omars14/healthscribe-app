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

    console.log('🚀 USING COOLIFY DOCKER-COMPOSE\n');
    console.log('=' .repeat(80) + '\n');

    console.log('1️⃣ Checking docker-compose.yaml...\n');
    await executeCommand(conn, `
cat /data/coolify/applications/tkwoos4soccckws84088wc04/docker-compose.yaml
`);

    console.log('\n2️⃣ Checking .env file...\n');
    await executeCommand(conn, `
cat /data/coolify/applications/tkwoos4soccckws84088wc04/.env | head -20
`);

    console.log('\n3️⃣ Updating .env with correct webhook URL...\n');
    await executeCommand(conn, `
cd /data/coolify/applications/tkwoos4soccckws84088wc04

# Add N8N webhook URL if missing
grep -q "N8N_WEBHOOK_URL" .env || echo "N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2" >> .env
grep -q "NEXT_PUBLIC_N8N_WEBHOOK_URL" .env || echo "NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2" >> .env
grep -q "CALLBACK_URL" .env || echo "CALLBACK_URL=https://healthscribe.pro" >> .env

# Update existing values
sed -i 's|N8N_WEBHOOK_URL=.*|N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2|' .env
sed -i 's|NEXT_PUBLIC_N8N_WEBHOOK_URL=.*|NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2|' .env
sed -i 's|CALLBACK_URL=.*|CALLBACK_URL=https://healthscribe.pro|' .env

echo "✅ .env updated"
cat .env | grep -E "N8N|CALLBACK"
`);

    console.log('\n4️⃣ Starting application via docker-compose...\n');
    await executeCommand(conn, `
cd /data/coolify/applications/tkwoos4soccckws84088wc04
docker-compose down 2>/dev/null || true
docker-compose up -d
echo "✅ Application started"
sleep 15
`);

    console.log('\n5️⃣ Checking status...\n');
    await executeCommand(conn, `
cd /data/coolify/applications/tkwoos4soccckws84088wc04
docker-compose ps
`);

    console.log('\n6️⃣ Getting container name and IP...\n');
    const containerName = (await executeCommand(conn, `docker ps --filter "label=com.docker.compose.project=tkwoos4soccckws84088wc04" --format "{{.Names}}" | head -1`)).trim();
    console.log(`Container: ${containerName}\n`);

    if (containerName) {
      const appIp = (await executeCommand(conn, `docker inspect ${containerName} 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
      
      if (appIp) {
        console.log(`App IP: ${appIp}\n`);

        console.log('7️⃣ Updating Traefik...\n');
        const authIp = (await executeCommand(conn, `docker inspect supabase-auth-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
        const restIp = (await executeCommand(conn, `docker inspect supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
        const storageIp = (await executeCommand(conn, `docker inspect supabase-storage-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
        const n8nIp = (await executeCommand(conn, `docker inspect n8n-tw4ckcco4kck08gs4g8wgowc 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();

        await executeCommand(conn, `
cat > /data/coolify/proxy/dynamic/healthscribe.yaml << 'EOF'
http:
  routers:
    supabase-auth:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/auth/v1\`)"
      service: supabase-auth
      entryPoints:
        - https
      middlewares:
        - supabase-strip-auth
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
        - supabase-strip-storage
        - cors-headers
      tls:
        certResolver: letsencrypt

    n8n:
      rule: "Host(\`n8n.healthscribe.pro\`)"
      service: n8n
      entryPoints:
        - https
      middlewares:
        - cors-headers
      tls:
        certResolver: letsencrypt

    healthscribe:
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

rm -f /data/coolify/proxy/dynamic/healthscribe-*.yaml
docker restart coolify-proxy
sleep 10
echo "✅ Traefik updated"
`);

        console.log('\n8️⃣ Testing...\n');
        await executeCommand(conn, `
echo "Application:"
curl -s -I https://healthscribe.pro | grep HTTP
echo ""
echo "Internal test:"
curl -s -I http://${appIp}:3000 | grep HTTP
`);

        console.log('\n' + '='.repeat(80));
        console.log('✅ APP DEPLOYED VIA COOLIFY!');
        console.log('='.repeat(80));
        console.log(`\n📦 Container: ${containerName}`);
        console.log(`🌐 IP: ${appIp}`);
        console.log('\n🚀 Try accessing https://healthscribe.pro now!');
        console.log('');

      } else {
        console.log('❌ No IP - container may have failed');
        await executeCommand(conn, `docker logs ${containerName} --tail 30 2>&1`);
      }
    } else {
      console.log('❌ No container found');
    }

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

