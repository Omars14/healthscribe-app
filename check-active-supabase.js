#!/usr/bin/env node

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

const DB_CONTAINERS = [
  'supabase_db_supabase',
  'supabase-db',
  'supabase-db-e088wwks88k8k48sccg8gk0o'
];

const DB_USERS = ['postgres', 'supabase_admin', 'supabase'];
const DBS = ['postgres', 'supabase'];

function executeSSH(command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    
    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        
        stream.on('close', () => {
          conn.end();
          resolve(output);
        }).on('data', (data) => {
          output += data.toString();
        }).stderr.on('data', (data) => {
          output += data.toString();
        });
      });
    }).on('error', reject).connect(SSH_CONFIG);
  });
}

async function main() {
  try {
    console.log('\n=== CHECKING ACTIVE SUPABASE DATABASE ===\n');
    
    for (const container of DB_CONTAINERS) {
      console.log(`\nTesting container: ${container}`);
      console.log('─'.repeat(60));
      
      for (const dbUser of DB_USERS) {
        for (const db of DBS) {
          try {
            const cmd = `docker exec -i ${container} psql -U ${dbUser} -d ${db} -c "SELECT COUNT(*) as user_count FROM auth.users;" 2>&1`;
            const result = await executeSSH(cmd);
            
            if (!result.includes('error') && !result.includes('FATAL') && !result.includes('does not exist')) {
              console.log(`✅ SUCCESS with ${dbUser}@${db}:`);
              console.log(result);
              
              // Get more details
              const tables = await executeSSH(`docker exec -i ${container} psql -U ${dbUser} -d ${db} -c "SELECT tablename FROM pg_tables WHERE schemaname IN ('public', 'auth') ORDER BY schemaname, tablename;" 2>&1`);
              console.log('\nTables found:');
              console.log(tables);
              
              console.log(`\n🎯 FOUND ACTIVE DATABASE:`);
              console.log(`   Container: ${container}`);
              console.log(`   User: ${dbUser}`);
              console.log(`   Database: ${db}`);
              return { container, dbUser, db };
            }
          } catch (err) {
            // Silent fail, try next combination
          }
        }
      }
    }
    
    console.log('\n❌ No accessible Supabase database found');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();

