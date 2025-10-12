#!/usr/bin/env node

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

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
    log('\n=== SUPABASE DATABASE DIAGNOSTIC ===\n', colors.cyan);
    
    // Find PostgreSQL container
    log('Finding PostgreSQL container...', colors.blue);
    const container = (await executeSSH('docker ps --format "{{.Names}}" | grep -E "(postgres|db)" | head -1')).trim();
    log(`Found: ${container}\n`, colors.green);
    
    // List all schemas
    log('Checking schemas...', colors.blue);
    const schemas = await executeSSH(`docker exec -i ${container} psql -U postgres -d postgres -c "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;"`);
    log(schemas, colors.cyan);
    
    // List all tables in public schema
    log('\nChecking tables in public schema...', colors.blue);
    const tables = await executeSSH(`docker exec -i ${container} psql -U postgres -d postgres -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"`);
    log(tables, colors.cyan);
    
    // List all tables in auth schema
    log('\nChecking tables in auth schema...', colors.blue);
    const authTables = await executeSSH(`docker exec -i ${container} psql -U postgres -d postgres -c "SELECT tablename FROM pg_tables WHERE schemaname = 'auth' ORDER BY tablename;"`);
    log(authTables, colors.cyan);
    
    // Count users in auth.users (if it exists)
    log('\nChecking auth.users...', colors.blue);
    const users = await executeSSH(`docker exec -i ${container} psql -U postgres -d postgres -c "SELECT COUNT(*) as user_count FROM auth.users;" 2>&1 || echo "auth.users doesn't exist"`);
    log(users, colors.cyan);
    
    // Sample users (if exists)
    log('\nSample users from auth.users...', colors.blue);
    const sampleUsers = await executeSSH(`docker exec -i ${container} psql -U postgres -d postgres -c "SELECT id, email, created_at FROM auth.users LIMIT 5;" 2>&1 || echo "No users found"`);
    log(sampleUsers, colors.cyan);
    
    // Check for transcriptions table
    log('\nChecking transcriptions table...', colors.blue);
    const transcriptions = await executeSSH(`docker exec -i ${container} psql -U postgres -d postgres -c "SELECT COUNT(*) as transcription_count FROM public.transcriptions;" 2>&1 || echo "transcriptions table doesn't exist"`);
    log(transcriptions, colors.cyan);
    
    // Check PostgreSQL version
    log('\nPostgreSQL version...', colors.blue);
    const version = await executeSSH(`docker exec -i ${container} psql -U postgres -d postgres -c "SELECT version();"`);
    log(version, colors.cyan);
    
    log('\n=== DIAGNOSTIC COMPLETE ===\n', colors.green);
    
  } catch (error) {
    log('Error: ' + error.message, colors.red);
  }
}

main();

