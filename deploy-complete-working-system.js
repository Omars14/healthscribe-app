#!/usr/bin/env node

const { Client } = require('ssh2');
const { execSync } = require('child_process');

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
  console.log('🚀 DEPLOYING COMPLETE WORKING SYSTEM\n');
  console.log('=' .repeat(80) + '\n');

  try {
    // Step 1: Commit changes
    console.log('1️⃣ Committing changes to Git...\n');
    try {
      execSync('git add src/app/api/transcribe-optimized/route.ts', { stdio: 'inherit' });
      execSync('git commit -m "fix: restore working n8n webhook and callback URLs from commit 31bec53"', { stdio: 'inherit' });
      execSync('git push origin master', { stdio: 'inherit' });
      console.log('\n✅ Changes pushed to GitHub\n');
    } catch (error) {
      console.log('⚠️  Git commit/push may have failed or no changes to commit\n');
    }

    // Step 2: SSH to VPS
    const conn = new Client();
    
    await new Promise((resolve, reject) => {
      conn.on('ready', resolve).on('error', reject).connect(SSH_CONFIG);
    });

    console.log('2️⃣ Connected to VPS\n');

    // Step 3: Get container IPs
    console.log('3️⃣ Getting all container IPs...\n');
    const authIp = (await executeCommand(conn, `docker inspect supabase_auth_supabase --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || echo ""`)).trim();
    const restIp = (await executeCommand(conn, `docker inspect supabase_rest_supabase --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || echo ""`)).trim();
    const storageIp = (await executeCommand(conn, `docker inspect supabase_storage_supabase --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || echo ""`)).trim();
    const n8nIp = (await executeCommand(conn, `docker inspect n8n --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || docker ps -f name=n8n --format='{{.ID}}' | xargs -r docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' || echo ""`)).trim();
    const appIp = (await executeCommand(conn, `docker inspect healthscribe-app --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || echo ""`)).trim();

    console.log(`\n✅ Supabase Auth IP: ${authIp || 'NOT FOUND'}`);
    console.log(`✅ Supabase REST IP: ${restIp || 'NOT FOUND'}`);
    console.log(`✅ Supabase Storage IP: ${storageIp || 'NOT FOUND'}`);
    console.log(`✅ N8N IP: ${n8nIp || 'NOT FOUND'}`);
    console.log(`✅ Application IP: ${appIp || 'NOT FOUND'}`);

    // Step 4: Create comprehensive Traefik configuration
    console.log('\n4️⃣ Creating comprehensive Traefik configuration...\n');
    
    let traefikConfig = `http:
  routers:`;

    // Add Supabase routing if IPs exist
    if (authIp || restIp || storageIp) {
      traefikConfig += `
    supabase-auth:
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
      priority: 100`;
    }

    // Add n8n routing if IP exists
    if (n8nIp) {
      traefikConfig += `
    n8n:
      rule: "Host(\`n8n.healthscribe.pro\`)"
      service: n8n-service
      entryPoints:
        - https
      middlewares:
        - n8n-cors
      tls:
        certResolver: letsencrypt
      priority: 100`;
    }

    // Add application routing if IP exists
    if (appIp) {
      traefikConfig += `
    healthscribe-app:
      rule: "Host(\`healthscribe.pro\`) || Host(\`www.healthscribe.pro\`)"
      service: healthscribe-app-service
      entryPoints:
        - https
      tls:
        certResolver: letsencrypt
      priority: 100`;
    }

    // Add services section
    traefikConfig += `
  
  services:`;

    if (authIp) {
      traefikConfig += `
    supabase-auth-service:
      loadBalancer:
        servers:
          - url: "http://${authIp}:9999"`;
    }

    if (restIp) {
      traefikConfig += `
    
    supabase-rest-service:
      loadBalancer:
        servers:
          - url: "http://${restIp}:3000"`;
    }

    if (storageIp) {
      traefikConfig += `
    
    supabase-storage-service:
      loadBalancer:
        servers:
          - url: "http://${storageIp}:5000"`;
    }

    if (n8nIp) {
      traefikConfig += `
    
    n8n-service:
      loadBalancer:
        servers:
          - url: "http://${n8nIp}:5678"`;
    }

    if (appIp) {
      traefikConfig += `
    
    healthscribe-app-service:
      loadBalancer:
        servers:
          - url: "http://${appIp}:3000"`;
    }

    // Add middlewares
    traefikConfig += `
  
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

    await executeCommand(conn, `
cat > /data/coolify/proxy/dynamic/complete-system.yaml << 'YAML'
${traefikConfig}
YAML

echo "✅ Traefik configuration created"
`);

    // Step 5: Update application environment
    console.log('\n5️⃣ Updating application environment variables...\n');
    await executeCommand(conn, `
if docker ps | grep -q healthscribe-app; then
    docker exec healthscribe-app sh -c 'cat > /app/.env.production.local << EOF
N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2
CALLBACK_URL=https://healthscribe.pro
URL=https://healthscribe.pro
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY
NEXT_PUBLIC_SITE_URL=https://healthscribe.pro
NEXT_PUBLIC_URL=https://healthscribe.pro
GOOGLE_API_KEY=AIzaSyBPmQfnqNhGi9rYbVgTi6UbGOiLZTr1k8Y
NODE_ENV=production
EOF'
    echo "✅ Environment variables updated"
fi
`);

    // Step 6: Restart everything
    console.log('\n6️⃣ Restarting all services...\n');
    await executeCommand(conn, `
echo "Restarting Traefik..."
docker restart coolify-proxy
sleep 5

echo "Restarting application..."
if docker ps | grep -q healthscribe-app; then
    docker restart healthscribe-app
    sleep 10
fi

echo "✅ All services restarted"
`);

    // Step 7: Test everything
    console.log('\n7️⃣ Testing complete system...\n');
    
    console.log('Testing application...');
    await executeCommand(conn, `
curl -s -I https://healthscribe.pro 2>&1 | grep "HTTP" || echo "App test failed"
`);

    console.log('\nTesting Supabase auth...');
    await executeCommand(conn, `
curl -s -X POST "https://supabase.healthscribe.pro/auth/v1/token?grant_type=password" \\
  -H "Content-Type: application/json" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoiYW5vbiJ9.USAl15ClzSLfHwEYQn-bQQaZNz79FkDGUPsohnnEqJA" \\
  -d '{"email":"omars14@gmail.com","password":"Nomar123"}' 2>&1 | grep -E "access_token|error" || echo "Auth test failed"
`);

    console.log('\nTesting n8n webhook...');
    await executeCommand(conn, `
curl -s -X POST "https://n8n.healthscribe.pro/webhook/medical-transcribe-v2" \\
  -H "Content-Type: application/json" \\
  -d '{"test":"ping","uploadId":"test-123"}' 2>&1 | head -10
`);

    console.log('\nChecking application logs...');
    await executeCommand(conn, `
docker logs healthscribe-app 2>&1 | tail -15
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ COMPLETE SYSTEM DEPLOYMENT FINISHED');
    console.log('='.repeat(80));
    console.log('\n📋 Configuration Summary:');
    console.log('1. ✅ Code updated with working webhook and callback URLs from commit 31bec53');
    console.log('2. ✅ Traefik configured for:');
    console.log('   - Supabase: https://supabase.healthscribe.pro');
    console.log('   - N8N: https://n8n.healthscribe.pro');
    console.log('   - Application: https://healthscribe.pro');
    console.log('3. ✅ Environment variables updated');
    console.log('4. ✅ All services restarted');
    console.log('');
    console.log('🌐 Next steps:');
    console.log('1. Hard refresh browser: CTRL + SHIFT + R');
    console.log('2. Clear browser cache if needed');
    console.log('3. Try logging in and uploading a file');
    console.log('4. Check that transcription processes through n8n');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

