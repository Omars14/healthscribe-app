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

    console.log('🔧 FIXING YAML\n');
    console.log('=' .repeat(80) + '\n');

    // Fix the YAML file
    console.log('Fixing YAML...\n');
    await executeCommand(conn, 'sed -i "s/\\\\\\\\`/`/g" /data/coolify/proxy/dynamic/healthscribe-complete.yaml');
    console.log('✅ Fixed\n');

    // Restart Traefik
    console.log('Restarting Traefik...\n');
    await executeCommand(conn, 'docker restart coolify-proxy');
    await executeCommand(conn, 'sleep 10');
    console.log('✅ Restarted\n');

    // Test
    console.log('Testing...\n');
    await executeCommand(conn, 'curl -s -I https://healthscribe.pro | grep HTTP');
    console.log('');
    await executeCommand(conn, 'curl -s -I https://supabase.healthscribe.pro/auth/v1/health | grep HTTP');
    console.log('');

    console.log('\n✅ DONE!');
    console.log('🌐 Website: https://healthscribe.pro');
    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

