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

    console.log('🚀 TRIGGERING COOLIFY DEPLOYMENT MANUALLY\n');
    console.log('=' .repeat(80) + '\n');
    
    // Find the application ID in Coolify database
    console.log('🔍 Step 1: Finding application ID in Coolify...\n');
    await executeCommand(conn, `
docker exec coolify-db psql -U coolify -d coolify -t -A -c "SELECT id, name, git_repository FROM applications WHERE name LIKE '%healthscribe%' OR git_repository LIKE '%healthscribe%';"
`);

    // Trigger deployment via database
    console.log('\n🔨 Step 2: Triggering deployment via Coolify artisan...\n');
    await executeCommand(conn, `
docker exec coolify php artisan queue:restart
docker exec coolify php artisan app:init
`);

    // Alternative: Trigger via manual command
    console.log('\n🔄 Step 3: Manually triggering deployment for application ID 2...\n');
    await executeCommand(conn, `
docker exec coolify php artisan app:deploy 2
`);

    console.log('\n⏱️  Waiting for deployment to start...\n');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Monitor logs
    console.log('📋 Checking deployment logs...\n');
    await executeCommand(conn, `
docker logs coolify 2>&1 | grep -iE "ApplicationDeployment|Building|RUNNING" | tail -15
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ DEPLOYMENT TRIGGERED - MONITORING...');
    console.log('='.repeat(80));
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

