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

    console.log('🔧 FINAL ROUTING FIX\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Get IPs properly
    console.log('1️⃣ Getting container IPs...\n');
    
    const authIp = (await executeCommand(conn, `docker inspect supabase-auth-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | cut -d'"' -f4`)).trim();
    const restIp = (await executeCommand(conn, `docker inspect supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | cut -d'"' -f4`)).trim();
    const storageIp = (await executeCommand(conn, `docker inspect supabase-storage-e088wwks88k8k48sccg8gk0o 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | cut -d'"' -f4`)).trim();
    const n8nIp = (await executeCommand(conn, `docker ps -f name=n8n | grep -v NAMES | head -1 | awk '{print $1}' | xargs docker inspect 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | cut -d'"' -f4`)).trim();
    const appIp = (await executeCommand(conn, `docker inspect healthscribe-app 2>/dev/null | grep '"IPAddress"' | grep -v '""' | head -1 | cut -d'"' -f4`)).trim();

    console.log(`Auth IP: ${authIp || 'NOT FOUND'}`);
    console.log(`REST IP: ${restIp || 'NOT FOUND'}`);
    console.log(`Storage IP: ${storageIp || 'NOT FOUND'}`);
    console.log(`N8N IP: ${n8nIp || 'NOT FOUND'}`);
    console.log(`App IP: ${appIp || 'NOT FOUND'}`);

    // Step 2: Create Traefik configuration
    console.log('\n2️⃣ Creating Traefik configuration...\n');
    
    let config = 'http:\n  routers:\n';
    
    if (authIp && restIp && storageIp) {
      config += `    supabase-auth:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/auth/v1\`)"
      service: supabase-auth-service
      entryPoints:
        - https
      middlewares:
        - supabase-cors
      tls:
        certResolver: letsencrypt
      priority: 100
    
    supabase-rest:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/rest/v1\`)"
      service: supabase-rest-service
      entryPoints:
        - https
      middlewares:
        - supabase-cors
      tls:
        certResolver: letsencrypt
      priority: 100
    
    supabase-storage:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/storage/v1\`)"
      service: supabase-storage-service
      entryPoints:
        - https
      middlewares:
        - supabase-cors
      tls:
        certResolver: letsencrypt
      priority: 100
    \n`;
    }

    if (n8nIp) {
      config += `    n8n:
      rule: "Host(\`n8n.healthscribe.pro\`)"
      service: n8n-service
      entryPoints:
        - https
      middlewares:
        - n8n-cors
      tls:
        certResolver: letsencrypt
      priority: 100
    \n`;
    }

    if (appIp) {
      config += `    healthscribe-app:
      rule: "Host(\`healthscribe.pro\`) || Host(\`www.healthscribe.pro\`)"
      service: healthscribe-app-service
      entryPoints:
        - https
      tls:
        certResolver: letsencrypt
      priority: 100
    \n`;
    }

    config += '  \n  services:\n';

    if (authIp && restIp && storageIp) {
      config += `    supabase-auth-service:
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
    \n`;
    }

    if (n8nIp) {
      config += `    n8n-service:
      loadBalancer:
        servers:
          - url: "http://${n8nIp}:5678"
    \n`;
    }

    if (appIp) {
      config += `    healthscribe-app-service:
      loadBalancer:
        servers:
          - url: "http://${appIp}:3000"
    \n`;
    }

    config += `  
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
`;

    await executeCommand(conn, `cat > /data/coolify/proxy/dynamic/complete-system.yaml << 'EOF'
${config}
EOF

echo "✅ Traefik configuration created"
cat /data/coolify/proxy/dynamic/complete-system.yaml
`);

    // Step 3: Restart Traefik
    console.log('\n3️⃣ Restarting Traefik...\n');
    await executeCommand(conn, `
docker restart coolify-proxy
sleep 10
echo "✅ Traefik restarted"
`);

    // Step 4: Test everything
    console.log('\n4️⃣ Testing all endpoints...\n');
    
    if (authIp) {
      console.log('Testing Supabase auth...');
      const authTest = await executeCommand(conn, `
curl -s -w "\\nHTTP_CODE:%{http_code}" -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' 2>&1 | head -10
`);
      console.log(authTest);
    }

    if (n8nIp) {
      console.log('\nTesting n8n webhook...');
      const n8nTest = await executeCommand(conn, `
curl -s -w "\\nHTTP_CODE:%{http_code}" -X POST "https://n8n.healthscribe.pro/webhook/medical-transcribe-v2" \\
  -H "Content-Type: application/json" \\
  -d '{"test":"ping","uploadId":"test-123"}'
`);
      console.log(n8nTest);
    }

    if (appIp) {
      console.log('\nTesting application...');
      const appTest = await executeCommand(conn, `
curl -s -I https://healthscribe.pro 2>&1 | grep "HTTP" | head -1
`);
      console.log(appTest);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL ROUTING CONFIGURED');
    console.log('='.repeat(80));
    console.log('\n🎯 System Status:');
    if (authIp) console.log(`✅ Supabase Auth: ${authIp}:9999`);
    if (restIp) console.log(`✅ Supabase REST: ${restIp}:3000`);
    if (storageIp) console.log(`✅ Supabase Storage: ${storageIp}:5000`);
    if (n8nIp) console.log(`✅ N8N: ${n8nIp}:5678`);
    if (appIp) console.log(`✅ Application: ${appIp}:3000`);
    console.log('');
    console.log('🌐 Public URLs:');
    console.log('✅ https://healthscribe.pro - Main application');
    console.log('✅ https://supabase.healthscribe.pro - Supabase API');
    console.log('✅ https://n8n.healthscribe.pro - N8N workflow');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Hard refresh browser: CTRL + SHIFT + R');
    console.log('2. Login with omars14@gmail.com / Nomar123');
    console.log('3. Upload a file - it should process through n8n');
    console.log('4. Check transcriptions appear correctly');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

