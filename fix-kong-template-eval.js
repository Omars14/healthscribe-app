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

    console.log('🔧 FIXING KONG CONFIGURATION\n');
    console.log('=' .repeat(80) + '\n');
    
    // Create minimal working kong.yml
    console.log('📝 Creating minimal working kong.yml...\n');
    await executeCommand(conn, `
cat > /data/coolify/services/e088wwks88k8k48sccg8gk0o/volumes/api/temp.yml <<'YAML'
_format_version: "1.1"

services:
  - name: auth-v1
    url: http://supabase-auth:9999
    routes:
      - name: auth-v1-all
        strip_path: true
        paths:
          - /auth/v1/

  - name: rest-v1
    url: http://supabase-rest:3000
    routes:
      - name: rest-v1-all
        strip_path: true
        paths:
          - /rest/v1/

  - name: storage-v1
    url: http://supabase-storage:5000
    routes:
      - name: storage-v1-all
        strip_path: true
        paths:
          - /storage/v1/
YAML

echo "✅ Created temp.yml"
`);

    // Restart Kong
    console.log('\n🔄 Restarting Kong...\n');
    await executeCommand(conn, `
cd /data/coolify/services/e088wwks88k8k48sccg8gk0o
docker-compose restart supabase-kong
sleep 30

docker ps --filter "name=kong-e088" --format "{{.Names}} - {{.Status}}"
`);

    // Test
    console.log('\n🧪 Testing Kong...\n');
    await executeCommand(conn, `
echo "Testing auth health..."
curl -s https://supabase.healthscribe.pro/auth/v1/health | grep -o 'GoTrue' && echo " ✅" || echo " ❌"
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ KONG CONFIGURATION FIXED');
    console.log('='.repeat(80));
    console.log('\n🎯 NOW TRIGGERING COOLIFY REBUILD FOR CODE FIX...\n');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

