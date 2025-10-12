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

    console.log('🔍 DIAGNOSING SYSTEM STATUS\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Check all containers
    console.log('1️⃣ Checking all containers...\n');
    await executeCommand(conn, `
echo "Application containers:"
docker ps -f name=healthscribe-app --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
echo ""
echo "Supabase containers:"
docker ps -f name=supabase --format "table {{.Names}}\\t{{.Status}}"
echo ""
echo "N8N containers:"
docker ps -f name=n8n --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
echo ""
echo "Traefik:"
docker ps -f name=coolify-proxy --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
`);

    // Step 2: Check Traefik logs
    console.log('\n2️⃣ Checking Traefik logs (last 20 lines)...\n');
    await executeCommand(conn, `
docker logs coolify-proxy --tail 20 2>&1 | grep -E "error|Error|ERROR|404|500" || echo "No errors found in last 20 lines"
`);

    // Step 3: Check application logs
    console.log('\n3️⃣ Checking application logs (last 20 lines)...\n');
    await executeCommand(conn, `
docker logs healthscribe-app --tail 20 2>&1
`);

    // Step 4: Test all endpoints
    console.log('\n4️⃣ Testing all endpoints...\n');
    
    console.log('Testing main application...');
    await executeCommand(conn, `
curl -s -I -m 5 https://healthscribe.pro 2>&1 | grep "HTTP" || echo "Application unreachable"
`);

    console.log('\nTesting Supabase auth...');
    await executeCommand(conn, `
curl -s -I -m 5 https://supabase.healthscribe.pro/auth/v1/health 2>&1 | grep "HTTP" || echo "Supabase auth unreachable"
`);

    console.log('\nTesting n8n...');
    await executeCommand(conn, `
curl -s -I -m 5 https://n8n.healthscribe.pro 2>&1 | grep "HTTP" || echo "N8N unreachable"
`);

    // Step 5: Check Traefik configuration
    console.log('\n5️⃣ Checking Traefik configuration files...\n');
    await executeCommand(conn, `
echo "Dynamic configuration files:"
ls -lah /data/coolify/proxy/dynamic/ | grep -E ".yaml|.yml"
echo ""
echo "Checking for syntax errors in complete-system.yaml:"
if [ -f /data/coolify/proxy/dynamic/complete-system.yaml ]; then
    cat /data/coolify/proxy/dynamic/complete-system.yaml | head -50
else
    echo "File does not exist!"
fi
`);

    // Step 6: Check if containers are healthy
    console.log('\n6️⃣ Checking container health...\n');
    await executeCommand(conn, `
docker inspect healthscribe-app --format='{{.State.Status}} - {{.State.Health.Status}}' 2>/dev/null || echo "App container not found or no health check"
docker inspect coolify-proxy --format='{{.State.Status}}' 2>/dev/null || echo "Traefik container not found"
`);

    // Step 7: Check network connectivity
    console.log('\n7️⃣ Testing internal network connectivity...\n');
    await executeCommand(conn, `
APP_IP=$(docker inspect healthscribe-app --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null | head -1)
echo "Application IP: $APP_IP"
if [ ! -z "$APP_IP" ]; then
    echo "Testing internal access to app on port 3000..."
    curl -s -I -m 3 http://$APP_IP:3000 2>&1 | grep "HTTP" || echo "App not responding internally"
fi
`);

    console.log('\n' + '='.repeat(80));
    console.log('📊 DIAGNOSIS COMPLETE');
    console.log('='.repeat(80));
    console.log('\nAnalyzing results...\n');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

