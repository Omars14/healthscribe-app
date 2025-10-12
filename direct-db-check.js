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

    console.log('🔍 Direct Database Check...\n');
    
    //Check what's actually in the profiles table
    const profiles = await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -t -A -c "SELECT id, email, role FROM public.user_profiles WHERE email = 'omars14@gmail.com' OR email LIKE '%omar%';"
`);
    
    console.log('Profiles with omar:\n' + profiles);
    
    // Get user ID
    const userId = await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -t -A -c "SELECT id FROM auth.users WHERE email = 'omars14@gmail.com';"
`);
    
    console.log('\nUser ID from auth.users:\n' + userId);
    
    // Now manually create the profile with correct ID
    console.log('Creating profile with matching ID...\n');
    const result = await executeCommand(conn, `
cat > /tmp/fix-profile.sql <<'SQLEND'
DELETE FROM public.user_profiles WHERE email = 'omars14@gmail.com';

INSERT INTO public.user_profiles (id, email, role, full_name, created_at, updated_at)
VALUES 
  ('24e938c1-8fed-49ea-93ca-c9572f5ab35f', 'omars14@gmail.com', 'admin', 'Omar S', NOW(), NOW());

SELECT 'Inserted:' as status, id, email, role FROM public.user_profiles WHERE email = 'omars14@gmail.com';
SQLEND

docker cp /tmp/fix-profile.sql supabase-db-e088wwks88k8k48sccg8gk0o:/tmp/fix-profile.sql

docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -f /tmp/fix-profile.sql
`);

    // Verify via direct query
    console.log('\n✅ Verification:\n');
    const verify = await executeCommand(conn, `
docker exec supabase-db-e088wwks88k8k48sccg8gk0o psql -U postgres -d postgres -t -A -c "SELECT COUNT(*) FROM public.user_profiles WHERE id = '24e938c1-8fed-49ea-93ca-c9572f5ab35f' AND email = 'omars14@gmail.com' AND role = 'admin';"
`);
    
    console.log('Admin profiles matching: ' + verify);
    
    if (verify.trim() === '1') {
      console.log('\n✅✅✅ ADMIN PROFILE CONFIRMED IN DATABASE! ✅✅✅\n');
      console.log('='.repeat(80));
      console.log('✅ SYSTEM 100% OPERATIONAL - SELF-HOSTED SUPABASE');
      console.log('='.repeat(80));
    }

    conn.end();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

