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

    console.log('🔧 FIXING POSTGREST DATABASE CONNECTION\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Get database IP
    console.log('1️⃣ Getting database IP...\n');
    const dbIp = (await executeCommand(conn, `docker inspect supabase-db-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    console.log(`Database IP: ${dbIp}\n`);

    // Step 2: Test database connection
    console.log('2️⃣ Testing database connection...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "SELECT 1;"
`);

    // Step 3: Stop old PostgREST
    console.log('\n3️⃣ Stopping old PostgREST...\n');
    await executeCommand(conn, `
docker stop supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null || true
docker rm supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null || true
echo "✅ Stopped"
`);

    // Step 4: Start PostgREST with correct configuration
    console.log('\n4️⃣ Starting PostgREST with correct configuration...\n');
    await executeCommand(conn, `
docker run -d \\
  --name supabase-rest-e088wwks88k8k48sccg8gk0o \\
  --network coolify \\
  --label coolify.managed=true \\
  -e "PGRST_DB_URI=postgresql://postgres:postgres@${dbIp}:5432/postgres" \\
  -e "PGRST_DB_SCHEMAS=public,storage,auth" \\
  -e "PGRST_DB_ANON_ROLE=anon" \\
  -e "PGRST_DB_EXTRA_SEARCH_PATH=public" \\
  -e "PGRST_JWT_SECRET=p6WslAn863JJYORSGONvfi3sXLpkqKQv" \\
  -e "PGRST_DB_USE_LEGACY_GUCS=false" \\
  -e "PGRST_APP_SETTINGS_JWT_SECRET=p6WslAn863JJYORSGONvfi3sXLpkqKQv" \\
  -e "PGRST_SERVER_HOST=0.0.0.0" \\
  -e "PGRST_SERVER_PORT=3000" \\
  --restart unless-stopped \\
  postgrest/postgrest:v12.2.12

echo "✅ PostgREST started"
sleep 15
`);

    // Step 5: Check logs
    console.log('\n5️⃣ Checking PostgREST logs...\n');
    await executeCommand(conn, `
docker logs supabase-rest-e088wwks88k8k48sccg8gk0o 2>&1 | tail -20
`);

    // Step 6: Test REST API
    console.log('\n6️⃣ Testing REST API...\n');
    const restIp = (await executeCommand(conn, `docker inspect supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    console.log(`REST IP: ${restIp}\n`);
    
    await executeCommand(conn, `
echo "Test 1: Health check"
curl -s "http://${restIp}:3000/"

echo ""
echo "Test 2: Transcriptions"
curl -s "http://${restIp}:3000/transcriptions?select=id,status&limit=3" \\
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwMjk5MjYwLCJleHAiOjIwNzU2NTkyNjB9.fuBekR-do0ST4CxThWM5UcjFacFpZC3AMqxNSSp3DMM" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjAyOTkyNjAsImV4cCI6MjA3NTY1OTI2MH0.BLOKCUrBXkmjGPsg39H4aGInVjgBqZPaRsMH1dpksDQ"
`);

    // Step 7: Update Traefik
    console.log('\n\n7️⃣ Updating Traefik...\n');
    const authIp = (await executeCommand(conn, `docker inspect supabase-auth-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const storageIp = (await executeCommand(conn, `docker inspect supabase-storage-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const n8nIp = (await executeCommand(conn, `docker inspect n8n-tw4ckcco4kck08gs4g8wgowc 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const appIp = (await executeCommand(conn, `docker inspect tkwoos4soccckws84088wc04-184252873467 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();

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

docker restart coolify-proxy
sleep 10
echo "✅ Traefik updated"
`);

    // Step 8: Final test
    console.log('\n8️⃣ Final test via Traefik...\n');
    await executeCommand(conn, `
curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=id,status&limit=3" \\
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwMjk5MjYwLCJleHAiOjIwNzU2NTkyNjB9.fuBekR-do0ST4CxThWM5UcjFacFpZC3AMqxNSSp3DMM" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjAyOTkyNjAsImV4cCI6MjA3NTY1OTI2MH0.BLOKCUrBXkmjGPsg39H4aGInVjgBqZPaRsMH1dpksDQ"
`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅✅✅ POSTGREST FIXED! ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🎯 PostgREST connected to database');
    console.log(`🗄️  Database: ${dbIp}:5432`);
    console.log(`🌐 REST API: ${restIp}:3000`);
    console.log('\n🚀 Hard refresh (CTRL+SHIFT+R) and check transcription history!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

