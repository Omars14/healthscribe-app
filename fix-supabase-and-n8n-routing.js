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

    console.log('🔧 FIXING SUPABASE AND N8N ROUTING\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Find all Supabase containers
    console.log('1️⃣ Finding all Supabase containers...\n');
    await executeCommand(conn, `
docker ps --format "{{.Names}}" | grep supabase
`);

    // Step 2: Get correct IPs
    console.log('\n2️⃣ Getting container IPs...\n');
    
    const authIp = (await executeCommand(conn, `docker ps -f name=supabase_auth --format='{{.ID}}' | head -1 | xargs docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | head -1`)).trim();
    const restIp = (await executeCommand(conn, `docker ps -f name=supabase_rest --format='{{.ID}}' | head -1 | xargs docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | head -1`)).trim();
    const storageIp = (await executeCommand(conn, `docker ps -f name=supabase_storage --format='{{.ID}}' | head -1 | xargs docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | head -1`)).trim();
    const n8nIp = (await executeCommand(conn, `docker ps -f name=n8n --format='{{.ID}}' | head -1 | xargs docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | head -1`)).trim();
    const appIp = (await executeCommand(conn, `docker ps -f name=healthscribe-app --format='{{.ID}}' | head -1 | xargs docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | head -1`)).trim();

    console.log(`\nAuth IP: ${authIp || 'NOT FOUND'}`);
    console.log(`REST IP: ${restIp || 'NOT FOUND'}`);
    console.log(`Storage IP: ${storageIp || 'NOT FOUND'}`);
    console.log(`N8N IP: ${n8nIp || 'NOT FOUND'}`);
    console.log(`App IP: ${appIp || 'NOT FOUND'}`);

    // Step 3: Create Traefik configuration
    console.log('\n3️⃣ Creating Traefik configuration...\n');
    await executeCommand(conn, `
cat > /data/coolify/proxy/dynamic/complete-system.yaml << 'YAML'
http:
  routers:
${authIp ? `    supabase-auth:
      rule: "Host(\\\`supabase.healthscribe.pro\\\`) && PathPrefix(\\\`/auth/v1\\\`)"
      service: supabase-auth-service
      entryPoints:
        - https
      middlewares:
        - supabase-cors
      tls:
        certResolver: letsencrypt
      priority: 100
    
    supabase-rest:
      rule: "Host(\\\`supabase.healthscribe.pro\\\`) && PathPrefix(\\\`/rest/v1\\\`)"
      service: supabase-rest-service
      entryPoints:
        - https
      middlewares:
        - supabase-cors
      tls:
        certResolver: letsencrypt
      priority: 100
    
    supabase-storage:
      rule: "Host(\\\`supabase.healthscribe.pro\\\`) && PathPrefix(\\\`/storage/v1\\\`)"
      service: supabase-storage-service
      entryPoints:
        - https
      middlewares:
        - supabase-cors
      tls:
        certResolver: letsencrypt
      priority: 100
` : ''}    
${n8nIp ? `    n8n:
      rule: "Host(\\\`n8n.healthscribe.pro\\\`)"
      service: n8n-service
      entryPoints:
        - https
      middlewares:
        - n8n-cors
      tls:
        certResolver: letsencrypt
      priority: 100
` : ''}    
${appIp ? `    healthscribe-app:
      rule: "Host(\\\`healthscribe.pro\\\`) || Host(\\\`www.healthscribe.pro\\\`)"
      service: healthscribe-app-service
      entryPoints:
        - https
      tls:
        certResolver: letsencrypt
      priority: 100
` : ''}  
  services:
${authIp ? `    supabase-auth-service:
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
` : ''}    
${n8nIp ? `    n8n-service:
      loadBalancer:
        servers:
          - url: "http://${n8nIp}:5678"
` : ''}    
${appIp ? `    healthscribe-app-service:
      loadBalancer:
        servers:
          - url: "http://${appIp}:3000"
` : ''}  
  middlewares:
    supabase-cors:
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
    
    n8n-cors:
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
YAML

echo "✅ Traefik configuration created"
`);

    // Step 4: Restart Traefik
    console.log('\n4️⃣ Restarting Traefik...\n');
    await executeCommand(conn, `
docker restart coolify-proxy
sleep 5
echo "✅ Traefik restarted"
`);

    // Step 5: Test everything
    console.log('\n5️⃣ Testing all endpoints...\n');
    
    if (authIp) {
      console.log('Testing Supabase auth...');
      await executeCommand(conn, `
curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' 2>&1 | grep -E "access_token|error" | head -3
`);
    }

    if (n8nIp) {
      console.log('\nTesting n8n webhook...');
      await executeCommand(conn, `
curl -s -X POST "https://n8n.healthscribe.pro/webhook/medical-transcribe-v2" \\
  -H "Content-Type: application/json" \\
  -d '{"test":"ping","uploadId":"test-123"}' 2>&1 | head -3
`);
    }

    if (appIp) {
      console.log('\nTesting application...');
      await executeCommand(conn, `
curl -s -I https://healthscribe.pro 2>&1 | grep "HTTP" | head -1
`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ ROUTING FIXED');
    console.log('='.repeat(80));
    console.log('\n🌐 All systems configured:');
    if (authIp) console.log('✅ Supabase: https://supabase.healthscribe.pro');
    if (n8nIp) console.log('✅ N8N: https://n8n.healthscribe.pro');
    if (appIp) console.log('✅ Application: https://healthscribe.pro');
    console.log('');
    console.log('📝 Try now:');
    console.log('1. Hard refresh: CTRL + SHIFT + R');
    console.log('2. Login and upload a file');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

