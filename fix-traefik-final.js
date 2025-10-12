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

    console.log('🔧 FIXING TRAEFIK WITH KONG IP 10.0.3.15\n');
    console.log('=' .repeat(80) + '\n');
    
    // Create Traefik config with correct backticks
    await executeCommand(conn, `
cat > /data/coolify/proxy/dynamic/supabase.yaml <<'EOF'
http:
  routers:
    supabase:
      rule: 'Host(\\\`supabase.healthscribe.pro\\\`)'
      service: supabase-service
      entryPoints:
        - https
      tls:
        certResolver: letsencrypt
  
  services:
    supabase-service:
      loadBalancer:
        servers:
          - url: 'http://10.0.3.15:8000'
EOF

cat /data/coolify/proxy/dynamic/supabase.yaml
`);

    // Reload Traefik
    console.log('\n🔄 Reloading Traefik...\n');
    await executeCommand(conn, `
docker kill -s HUP coolify-proxy
sleep 15
`);

    // Test
    console.log('✅ Testing...\n');
    await executeCommand(conn, `
curl -s https://supabase.healthscribe.pro/auth/v1/health
echo ""
curl -i -X OPTIONS https://supabase.healthscribe.pro/auth/v1/health -H 'Origin: https://healthscribe.pro' 2>&1 | grep -E 'HTTP|Access-Control' | head -5
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ TRAEFIK FIXED');
    console.log('='.repeat(80));
    console.log('\n🎯 TRY LOGGING IN NOW!');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

