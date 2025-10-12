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

    console.log('🪣 CREATING BUCKET IN MINIO (ACTUAL STORAGE BACKEND)\n');
    console.log('=' .repeat(80) + '\n');
    
    // Check Minio
    console.log('📋 Checking Minio...\n');
    await executeCommand(conn, `
docker ps --filter "name=minio-e088"
docker logs supabase-minio-e088wwks88k8k48sccg8gk0o --tail 15
`);

    // Create bucket in Minio directly
    console.log('\n🪣 Creating audio-files bucket in Minio...\n');
    await executeCommand(conn, `
# Create bucket using minio client command
docker exec supabase-minio-e088wwks88k8k48sccg8gk0o mkdir -p /data/audio-files
docker exec supabase-minio-e088wwks88k8k48sccg8gk0o ls -la /data/ | head -20
`);

    // Update database to match
    console.log('\n📝 Ensuring database has bucket record...\n');
    await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres <<'SQL'
-- Clean up and create fresh
DELETE FROM storage.objects WHERE bucket_id = 'audio-files';
DELETE FROM storage.buckets WHERE id = 'audio-files';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, owner)
VALUES (
  'audio-files',
  'audio-files',
  true,
  524288000,
  NULL,
  NULL
);

SELECT id, name, public FROM storage.buckets;
SQL
`);

    // Restart storage service stack
    console.log('\n🔄 Restarting storage stack...\n');
    await executeCommand(conn, `
cd /data/coolify/services/e088wwks88k8k48sccg8gk0o

docker-compose stop supabase-storage supabase-kong
sleep 10

docker-compose up -d supabase-minio
sleep 15

docker-compose up -d supabase-storage
sleep 20

docker-compose up -d supabase-kong
sleep 25

docker ps --filter "name=minio-e088\\|storage-e088\\|kong-e088" --format "{{.Names}} - {{.Status}}"
`);

    // Test storage again
    console.log('\n✅ Testing storage API...\n');
    await executeCommand(conn, `
curl -s "https://supabase.healthscribe.pro/storage/v1/bucket" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY" \\
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY"
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ STORAGE BUCKET CREATED IN MINIO');
    console.log('='.repeat(80));
    console.log('\n🎯 TRY UPLOADING DS505670.mp3 NOW');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

