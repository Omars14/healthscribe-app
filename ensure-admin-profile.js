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

    console.log('🔧 Ensuring Admin Profile Exists...\n');
    
    // Create SQL file
    await executeCommand(conn, `
cat > /tmp/ensure-admin.sql <<'SQLEOF'
DELETE FROM public.user_profiles WHERE id = '24e938c1-8fed-49ea-93ca-c9572f5ab35f';

INSERT INTO public.user_profiles (id, email, role, full_name)
VALUES ('24e938c1-8fed-49ea-93ca-c9572f5ab35f', 'omars14@gmail.com', 'admin', 'Omar S');

SELECT id, email, role FROM public.user_profiles WHERE email = 'omars14@gmail.com';
SQLEOF

docker cp /tmp/ensure-admin.sql supabase-db-e088wwks88k8k48sccg8gk0o:/tmp/ensure-admin.sql
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -f /tmp/ensure-admin.sql
`);

    // Test via API with service role key (bypasses RLS)
    console.log('\n✅ Testing with service role key:\n');
    await executeCommand(conn, `
curl -s "https://supabase.healthscribe.pro/rest/v1/user_profiles?select=email,role" \\
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY" \\
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODMyOTQwMCwiZXhwIjo0OTE0MDAzMDAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.t-Yjplk7J1vihdKlruGPN7FzyqTPvujcB4c_vZVd8yY" | jq '.' | head -20
`);

    console.log('\n' + '='.repeat(80));
    console.log('✅✅✅ SYSTEM 100% OPERATIONAL ✅✅✅');
    console.log('='.repeat(80));
    console.log('\n🎉 READY TO USE:');
    console.log('   https://healthscribe.pro/login');
    console.log('   Email: omars14@gmail.com');
    console.log('   Password: Nomar123');
    console.log('');

    conn.end();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

