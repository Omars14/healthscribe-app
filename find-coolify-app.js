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

    console.log('🔍 FINDING COOLIFY APP\n');
    console.log('=' .repeat(80) + '\n');

    console.log('1️⃣ All application containers:\n');
    await executeCommand(conn, `
docker ps -a | head -50
`);

    console.log('\n2️⃣ Finding Coolify services:\n');
    await executeCommand(conn, `
ls -la /data/coolify/applications/
`);

    console.log('\n3️⃣ Checking Coolify labels:\n');
    await executeCommand(conn, `
docker ps --filter "label=coolify.managed=true" --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}"
`);

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

