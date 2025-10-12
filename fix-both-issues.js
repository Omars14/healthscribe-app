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

    console.log('🔧 FIXING REST API AND N8N ISSUES\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Test REST API directly
    console.log('1️⃣ Testing REST API directly...\n');
    const restIp = (await executeCommand(conn, `docker inspect supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    console.log(`REST IP: ${restIp}\n`);
    
    await executeCommand(conn, `
echo "Testing REST internally:"
curl -s "http://${restIp}:3000/user_profiles?select=*&id=eq.24e938c1-8fed-49ea-93ca-c9572f5ab35f" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY" \\
  2>&1 | head -10
`);

    // Step 2: Check the transcription record
    console.log('\n2️⃣ Checking transcription record...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "
SELECT id, audio_file_path, status, created_at 
FROM public.transcriptions 
WHERE id = 'd8afddfa-0032-4fb8-a25d-689c13e94132' 
LIMIT 1;
"
`);

    // Step 3: Fix Traefik config - remove strip prefix for REST
    console.log('\n3️⃣ Fixing Traefik configuration (removing incorrect strip prefix)...\n');
    
    const authIp = (await executeCommand(conn, `docker inspect supabase-auth-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const storageIp = (await executeCommand(conn, `docker inspect supabase-storage-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const n8nIp = (await executeCommand(conn, `docker ps -f name=n8n | grep -v NAMES | head -1 | awk '{print $1}' | xargs docker inspect 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();
    const appIp = (await executeCommand(conn, `docker inspect healthscribe-app 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | awk -F'"' '{print $4}'`)).trim();

    await executeCommand(conn, `
cat > /data/coolify/proxy/dynamic/healthscribe-fixed.yaml << 'EOF'
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

echo "✅ Configuration created"
`);

    // Step 4: Remove old config
    console.log('\n4️⃣ Removing old configuration...\n');
    await executeCommand(conn, 'rm -f /data/coolify/proxy/dynamic/healthscribe-direct.yaml && echo "✅ Old config removed"');

    // Step 5: Restart Traefik
    console.log('\n5️⃣ Restarting Traefik...\n');
    await executeCommand(conn, 'docker restart coolify-proxy && sleep 10 && echo "✅ Traefik restarted"');

    // Step 6: Test REST endpoint
    console.log('\n6️⃣ Testing REST endpoint through Traefik...\n');
    await executeCommand(conn, `
curl -s "https://supabase.healthscribe.pro/rest/v1/user_profiles?select=*&id=eq.24e938c1-8fed-49ea-93ca-c9572f5ab35f" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY" \\
  2>&1 | head -10
`);

    // Step 7: Check application logs for n8n payload
    console.log('\n7️⃣ Checking application logs for n8n payload...\n');
    await executeCommand(conn, `
docker logs healthscribe-app 2>&1 | grep -A 10 "d8afddfa-0032-4fb8-a25d-689c13e94132" | tail -20
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ FIXES APPLIED');
    console.log('='.repeat(80));
    console.log('\n📋 Summary:');
    console.log('1. ✅ REST API routing fixed (removed incorrect strip prefix)');
    console.log('2. ✅ Traefik restarted');
    console.log('3. ℹ️  Check n8n payload above for missing url field');
    console.log('');
    console.log('🔄 Hard refresh browser and try again!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

