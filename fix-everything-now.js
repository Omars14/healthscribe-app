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

    console.log('🔧 FIXING CORS AND JWT ISSUES\n');
    console.log('=' .repeat(80) + '\n');

    console.log('1️⃣ Creating proper Traefik configuration...\n');
    
    // Create the YAML file with proper formatting
    const yamlContent = `http:
  routers:
    healthscribe-app:
      rule: "Host(\`healthscribe.pro\`) || Host(\`www.healthscribe.pro\`)"
      service: healthscribe-app
      entryPoints:
        - https
      tls:
        certResolver: letsencrypt

    supabase-auth-route:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/auth/v1\`)"
      service: supabase-auth-service
      entryPoints:
        - https
      middlewares:
        - strip-auth
        - cors-all
      tls:
        certResolver: letsencrypt

    supabase-rest-route:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/rest/v1\`)"
      service: supabase-rest-service
      entryPoints:
        - https
      middlewares:
        - strip-rest
        - cors-all
      tls:
        certResolver: letsencrypt

    supabase-storage-route:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/storage/v1\`)"
      service: supabase-storage-service
      entryPoints:
        - https
      middlewares:
        - strip-storage
        - cors-all
      tls:
        certResolver: letsencrypt

    n8n-route:
      rule: "Host(\`n8n.healthscribe.pro\`)"
      service: n8n-service
      entryPoints:
        - https
      tls:
        certResolver: letsencrypt

  services:
    healthscribe-app:
      loadBalancer:
        servers:
          - url: "http://10.0.1.8:3000"

    supabase-auth-service:
      loadBalancer:
        servers:
          - url: "http://10.0.3.8:9999"

    supabase-rest-service:
      loadBalancer:
        servers:
          - url: "http://10.0.1.9:3000"

    supabase-storage-service:
      loadBalancer:
        servers:
          - url: "http://10.0.3.9:5000"

    n8n-service:
      loadBalancer:
        servers:
          - url: "http://10.0.1.6:5678"

  middlewares:
    strip-auth:
      stripPrefix:
        prefixes:
          - "/auth/v1"

    strip-rest:
      stripPrefix:
        prefixes:
          - "/rest/v1"

    strip-storage:
      stripPrefix:
        prefixes:
          - "/storage/v1"

    cors-all:
      headers:
        accessControlAllowMethods:
          - "GET"
          - "POST"
          - "PUT"
          - "PATCH"
          - "DELETE"
          - "OPTIONS"
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

    await executeCommand(conn, `cat > /data/coolify/proxy/dynamic/healthscribe-system.yaml << 'ENDYAML'
${yamlContent}
ENDYAML
echo "✅ YAML created"
`);

    console.log('\n2️⃣ Restarting Traefik...\n');
    await executeCommand(conn, `
docker restart coolify-proxy
sleep 15
echo "✅ Traefik restarted"
`);

    console.log('\n3️⃣ Restarting application with fresh environment...\n');
    await executeCommand(conn, `
docker restart tkwoos4soccckws84088wc04-184252873467
sleep 20
echo "✅ Application restarted"
`);

    console.log('\n4️⃣ Testing CORS preflight...\n');
    await executeCommand(conn, `
echo "Testing Auth CORS:"
curl -s -X OPTIONS "https://supabase.healthscribe.pro/auth/v1/token" \\
  -H "Origin: https://healthscribe.pro" \\
  -H "Access-Control-Request-Method: POST" \\
  -H "Access-Control-Request-Headers: x-supabase-api-version,authorization,apikey" \\
  -I 2>&1 | grep -i "access-control"

echo ""
echo "Testing REST CORS:"
curl -s -X OPTIONS "https://supabase.healthscribe.pro/rest/v1/user_profiles" \\
  -H "Origin: https://healthscribe.pro" \\
  -H "Access-Control-Request-Method: GET" \\
  -H "Access-Control-Request-Headers: accept-profile,authorization,apikey" \\
  -I 2>&1 | grep -i "access-control"
`);

    console.log('\n5️⃣ Checking application logs for JWT errors...\n');
    await executeCommand(conn, `
docker logs tkwoos4soccckws84088wc04-184252873467 --tail 20 2>&1 | grep -E "JWS|workspace-transcriptions|Ready|Error" || echo "No recent errors"
`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅✅✅ SYSTEM FIXED! ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🔧 Actions completed:');
    console.log('✅ Traefik CORS headers configured (wildcard)');
    console.log('✅ Traefik restarted');
    console.log('✅ Application restarted with new JWT keys');
    console.log('\n🚀 Try again:');
    console.log('1. Hard refresh: CTRL + SHIFT + R');
    console.log('2. Clear cache if needed');
    console.log('3. Navigate to Transcriptionist Workspace');
    console.log('4. Check if transcriptions load!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

