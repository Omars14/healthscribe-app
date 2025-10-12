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

    console.log('🔧 FINAL POSTGREST FIX\n');
    console.log('=' .repeat(80) + '\n');

    // Step 1: Get database IP correctly
    console.log('1️⃣ Getting database IP (correctly)...\n');
    await executeCommand(conn, `
docker network inspect coolify --format='{{range .Containers}}{{if contains .Name "supabase-db-e088wwks88k8k48sccg8gk0o"}}{{.IPv4Address}}{{end}}{{end}}' | cut -d'/' -f1
`);
    
    const dbIp = (await executeCommand(conn, `docker network inspect coolify --format='{{range .Containers}}{{if contains .Name "supabase-db-e088wwks88k8k48sccg8gk0o"}}{{.IPv4Address}}{{end}}{{end}}' | cut -d'/' -f1`)).trim();
    console.log(`Database IP: ${dbIp}\n`);

    // Step 2: Stop and remove old PostgREST
    console.log('2️⃣ Removing old PostgREST...\n');
    await executeCommand(conn, `
docker stop supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null || true
docker rm supabase-rest-e088wwks88k8k48sccg8gk0o 2>/dev/null || true
`);

    // Step 3: Start PostgREST with correct credentials and IP
    console.log('\n3️⃣ Starting PostgREST with correct credentials...\n');
    await executeCommand(conn, `
docker run -d \\
  --name supabase-rest-e088wwks88k8k48sccg8gk0o \\
  --network coolify \\
  --label coolify.managed=true \\
  -e "PGRST_DB_URI=postgresql://supabase_admin:1uss7163gybAy2wtTrXzSIhE7sGI8O5o@${dbIp}:5432/postgres" \\
  -e "PGRST_DB_SCHEMAS=public,storage,auth" \\
  -e "PGRST_DB_ANON_ROLE=anon" \\
  -e "PGRST_DB_EXTRA_SEARCH_PATH=public" \\
  -e "PGRST_JWT_SECRET=p6WslAn863JJYORSGONvfi3sXLpkqKQv" \\
  -e "PGRST_DB_USE_LEGACY_GUCS=false" \\
  -e "PGRST_SERVER_HOST=0.0.0.0" \\
  -e "PGRST_SERVER_PORT=3000" \\
  --restart unless-stopped \\
  postgrest/postgrest:v12.2.12

echo "✅ PostgREST started"
sleep 20
`);

    // Step 4: Check logs
    console.log('\n4️⃣ Checking logs...\n');
    await executeCommand(conn, `
docker logs supabase-rest-e088wwks88k8k48sccg8gk0o 2>&1 | tail -15
`);

    // Step 5: Test
    console.log('\n5️⃣ Testing REST API...\n');
    const restIp = (await executeCommand(conn, `docker network inspect coolify --format='{{range .Containers}}{{if contains .Name "supabase-rest-e088wwks88k8k48sccg8gk0o"}}{{.IPv4Address}}{{end}}{{end}}' | cut -d'/' -f1`)).trim();
    console.log(`REST IP: ${restIp}\n`);
    
    await executeCommand(conn, `
curl -s "http://${restIp}:3000/transcriptions?select=id,status&limit=3" \\
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwMjk5MjYwLCJleHAiOjIwNzU2NTkyNjB9.fuBekR-do0ST4CxThWM5UcjFacFpZC3AMqxNSSp3DMM" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjAyOTkyNjAsImV4cCI6MjA3NTY1OTI2MH0.BLOKCUrBXkmjGPsg39H4aGInVjgBqZPaRsMH1dpksDQ"
`);

    console.log('\n\n' + '='.repeat(80));
    console.log('CHECK RESULTS ABOVE');
    console.log('='.repeat(80) + '\n');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

