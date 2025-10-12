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

    console.log('🔧 UPDATING TRAEFIK - ADDING STRIP REST PREFIX\n');
    console.log('=' .repeat(80) + '\n');

    // Update config with strip-rest middleware
    console.log('1️⃣ Updating Traefik configuration...\n');
    await executeCommand(conn, `
cat > /data/coolify/proxy/dynamic/healthscribe-system.yaml << 'YAMLEOF'
http:
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
        - cors-headers
      tls:
        certResolver: letsencrypt

    supabase-rest-route:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/rest/v1\`)"
      service: supabase-rest-service
      entryPoints:
        - https
      middlewares:
        - strip-rest
        - cors-headers
      tls:
        certResolver: letsencrypt

    supabase-storage-route:
      rule: "Host(\`supabase.healthscribe.pro\`) && PathPrefix(\`/storage/v1\`)"
      service: supabase-storage-service
      entryPoints:
        - https
      middlewares:
        - strip-storage
        - cors-headers
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
          - Authorization
          - Content-Type
          - apikey
          - Prefer
          - X-Client-Info
        accessControlExposeHeaders:
          - Content-Range
          - X-Total-Count
        accessControlAllowCredentials: true
        accessControlMaxAge: 3600
        addVaryHeader: true
YAMLEOF

echo "✅ Configuration updated"
`);

    // Restart Traefik
    console.log('\n2️⃣ Restarting Traefik...\n');
    await executeCommand(conn, `
docker restart coolify-proxy
sleep 15
echo "✅ Traefik restarted"
`);

    // Test REST API
    console.log('\n3️⃣ Testing REST API...\n');
    await executeCommand(conn, `
curl -s 'https://supabase.healthscribe.pro/rest/v1/transcriptions?select=id,status&limit=3&user_id=eq.24e938c1-8fed-49ea-93ca-c9572f5ab35f' \\
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwMjk5MjYwLCJleHAiOjIwNzU2NTkyNjB9.fuBekR-do0ST4CxThWM5UcjFacFpZC3AMqxNSSp3DMM'
`);

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ TRAEFIK UPDATED');
    console.log('='.repeat(80) + '\n');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

