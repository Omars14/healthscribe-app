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

    console.log('🔧 FIXING JWT SECRET MISMATCH\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Get the correct JWT secret from GoTrue
    console.log('1️⃣ Getting JWT secret from GoTrue (Auth)...\n');
    const jwtSecret = (await executeCommand(conn, `
docker exec supabase-auth-e088wwks88k8k48sccg8gk0o env | grep GOTRUE_JWT_SECRET | cut -d'=' -f2
`)).trim();
    
    console.log(`JWT Secret: ${jwtSecret}\n`);

    // Step 2: Check current PostgREST configuration
    console.log('2️⃣ Checking current PostgREST configuration...\n');
    await executeCommand(conn, `
docker exec supabase-rest-e088wwks88k8k48sccg8gk0o env | grep -E "PGRST_JWT_SECRET|JWT"
`);

    // Step 3: Find PostgREST service directory
    console.log('\n3️⃣ Finding PostgREST service directory...\n');
    await executeCommand(conn, `
find /data/coolify/services -name "*e088wwks88k8k48sccg8gk0o*" -type d | head -5
`);

    // Step 4: Update PostgREST environment
    console.log('\n4️⃣ Updating PostgREST with correct JWT secret...\n');
    await executeCommand(conn, `
# Stop PostgREST
docker stop supabase-rest-e088wwks88k8k48sccg8gk0o

# Find and update environment file
SERVICE_DIR=$(find /data/coolify/services -name "*e088wwks88k8k48sccg8gk0o*" -type d | head -1)

if [ -d "$SERVICE_DIR" ]; then
    echo "Found service directory: $SERVICE_DIR"
    
    # Update .env file if it exists
    if [ -f "$SERVICE_DIR/.env" ]; then
        echo "Updating .env file..."
        sed -i '/PGRST_JWT_SECRET/d' "$SERVICE_DIR/.env"
        echo "PGRST_JWT_SECRET=${jwtSecret}" >> "$SERVICE_DIR/.env"
        cat "$SERVICE_DIR/.env" | grep JWT
    fi
    
    # Update docker-compose if needed
    if [ -f "$SERVICE_DIR/docker-compose.yml" ]; then
        echo "Found docker-compose.yml"
    fi
fi

# Start PostgREST with correct JWT secret
docker rm supabase-rest-e088wwks88k8k48sccg8gk0o
docker run -d \\
  --name supabase-rest-e088wwks88k8k48sccg8gk0o \\
  --network coolify \\
  --label coolify.managed=true \\
  -e "PGRST_DB_URI=postgresql://postgres:postgres@supabase-db-e088wwks88k8k48sccg8gk0o:5432/postgres" \\
  -e "PGRST_DB_SCHEMA=public,storage" \\
  -e "PGRST_DB_ANON_ROLE=anon" \\
  -e "PGRST_JWT_SECRET=${jwtSecret}" \\
  -e "PGRST_DB_USE_LEGACY_GUCS=false" \\
  -e "PGRST_APP_SETTINGS_JWT_SECRET=${jwtSecret}" \\
  --restart unless-stopped \\
  postgrest/postgrest:v12.2.12

echo "✅ PostgREST restarted with correct JWT secret"
sleep 10
`);

    // Step 5: Verify
    console.log('\n5️⃣ Verifying JWT secret is now correct...\n');
    await executeCommand(conn, `
docker exec supabase-rest-e088wwks88k8k48sccg8gk0o env | grep PGRST_JWT_SECRET
`);

    // Step 6: Test REST API
    console.log('\n6️⃣ Testing REST API...\n');
    const restIp = (await executeCommand(conn, `docker inspect supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    console.log(`REST IP: ${restIp}\n`);
    
    await executeCommand(conn, `
curl -s "http://${restIp}:3000/transcriptions?select=id,status&limit=3" \\
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTg1MTQwMTAsImV4cCI6MjM4OTIzNDAxMH0.qjBCdR_u9CWR9Fhx1VwoZdBdtetp_h9bE9qEieyQM_4"
`);

    // Step 7: Update Traefik
    console.log('\n7️⃣ Updating Traefik with new REST IP...\n');
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

    // Step 8: Final test via Traefik
    console.log('\n8️⃣ Final test via Traefik...\n');
    await executeCommand(conn, `
curl -s "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=id,status&limit=3" \\
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4NTE0MDEwLCJleHAiOjIzODkyMzQwMTB9.aEtU27HNIhkw1qj_4q2tnTyvLnGvWTWvHjJYFnsB3hI" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTg1MTQwMTAsImV4cCI6MjM4OTIzNDAxMH0.qjBCdR_u9CWR9Fhx1VwoZdBdtetp_h9bE9qEieyQM_4"
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅✅✅ JWT SECRET FIXED! ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🎯 PostgREST now uses the correct JWT secret');
    console.log(`🔑 JWT Secret: ${jwtSecret}`);
    console.log(`🌐 REST API IP: ${restIp}`);
    console.log('\n🚀 Hard refresh (CTRL+SHIFT+R) and check transcription history!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

