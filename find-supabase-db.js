#!/usr/bin/env node

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '154.26.155.207',
  port: 22,
  username: 'root',
  password: 'Nomar123'
};

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
    console.log('\n=== FINDING SUPABASE DATABASE ===\n');
    
    console.log('All running containers:');
    const all = await executeSSH('docker ps --format "{{.Names}}\t{{.Image}}"');
    console.log(all);
    
    console.log('\n Looking for Supabase-related containers:');
    const supabase = await executeSSH('docker ps --format "{{.Names}}\t{{.Image}}" | grep -i supabase');
    console.log(supabase || 'No Supabase containers found');
    
    console.log('\nLooking for PostgreSQL containers (excluding coolify-db):');
    const postgres = await executeSSH('docker ps --format "{{.Names}}\t{{.Image}}" | grep -i postgres | grep -v coolify');
    console.log(postgres || 'No PostgreSQL containers found');
    
    console.log('\nLooking for database containers:');
    const db = await executeSSH('docker ps --format "{{.Names}}\t{{.Image}}" | grep -iE "(db|database)" | grep -v coolify');
    console.log(db || 'No database containers found');
    
    console.log('\nChecking Coolify applications:');
    const apps = await executeSSH('ls -la /data/coolify/ 2>/dev/null || echo "Coolify data dir not found"');
    console.log(apps);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();

