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

    console.log('🔍 DEBUGGING POSTGREST CONNECTION\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Check database password
    console.log('1️⃣ Getting database password...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o env | grep -E "POSTGRES_PASSWORD|POSTGRES_USER"
`);

    // Step 2: Test direct connection
    console.log('\n2️⃣ Testing direct database connection...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "SELECT version();"
`);

    // Step 3: Check network connectivity
    console.log('\n3️⃣ Testing network connectivity from PostgREST to DB...\n');
    await executeCommand(conn, `
docker exec supabase-rest-e088wwks88k8k48sccg8gk0o ping -c 2 10.0.3.3 2>&1 || echo "Ping not available"
docker exec supabase-rest-e088wwks88k8k48sccg8gk0o nc -zv 10.0.3.3 5432 2>&1 || echo "Netcat not available"
`);

    // Step 4: Check PostgREST environment
    console.log('\n4️⃣ Checking PostgREST environment variables...\n');
    await executeCommand(conn, `
docker exec supabase-rest-e088wwks88k8k48sccg8gk0o env | grep PGRST
`);

    // Step 5: Let's try using the coolify network directly
    console.log('\n5️⃣ Checking database connection from another container...\n');
    await executeCommand(conn, `
docker run --rm --network coolify postgres:15-alpine psql "postgresql://postgres:postgres@10.0.3.3:5432/postgres" -c "SELECT 1;" 2>&1 || echo "Connection failed"
`);

    // Step 6: Check if database is listening on correct interface
    console.log('\n6️⃣ Checking database listening configuration...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "SHOW listen_addresses;"
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -c "SELECT * FROM pg_hba_file_rules LIMIT 5;"
`);

    console.log('\n' + '='.repeat(80));
    console.log('DEBUG COMPLETE');
    console.log('='.repeat(80) + '\n');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

