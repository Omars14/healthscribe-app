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

    console.log('🪝 GETTING COOLIFY WEBHOOK AND TRIGGERING DEPLOYMENT\n');
    console.log('=' .repeat(80) + '\n');
    
    // Get webhook details
    console.log('🔍 Getting webhook from Coolify database...\n');
    const webhookData = await executeCommand(conn, `
docker exec coolify-db psql -U coolify -d coolify -t -A -c "SELECT uuid, manual_webhook_secret_github FROM applications WHERE id = 2;"
`);

    console.log('Webhook data: ' + webhookData.trim() + '\n');

    const [uuid, secret] = webhookData.trim().split('|');

    if (uuid && uuid.length > 10) {
      console.log('✅ Webhook UUID: ' + uuid + '\n');
      
      // Trigger webhook
      console.log('📡 Calling deployment webhook...\n');
      await executeCommand(conn, `
curl -X POST "http://localhost:8001/api/v1/deploy?uuid=${uuid}&force=true" \\
  -H "Content-Type: application/json" \\
  -d '{"ref": "refs/heads/master", "repository": {"full_name": "Omars14/healthscribe-app"}}'
`);

      console.log('\n⏱️  Waiting for deployment to start (60 seconds)...\n');
      await new Promise(resolve => setTimeout(resolve, 60000));

      // Check deployment status
      console.log('📋 Checking deployment logs...\n');
      await executeCommand(conn, `
docker logs coolify 2>&1 | grep -iE "ApplicationDeployment|Building|RUNNING|healthscribe" | tail -20
`);

      // Check container status
      console.log('\n📦 Checking container status...\n');
      await executeCommand(conn, `
docker ps | grep tkwoos4
`);

    } else {
      console.log('❌ Could not extract webhook UUID\n');
      
      // Alternative: Check Coolify's auto-deployment settings
      console.log('📋 Checking if auto-deployment is enabled...\n');
      await executeCommand(conn, `
docker exec coolify-db psql -U coolify -d coolify -t -A -c "SELECT git_repository, auto_deploy FROM applications WHERE id = 2;"
`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ WEBHOOK TRIGGERED - MONITORING DEPLOYMENT');
    console.log('='.repeat(80));
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

