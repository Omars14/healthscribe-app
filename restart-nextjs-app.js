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
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
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
    log('\n' + '='.repeat(60), colors.cyan);
    log('RESTARTING NEXT.JS APPLICATION', colors.bright + colors.cyan);
    log('='.repeat(60) + '\n', colors.cyan);
    
    // Find Next.js/Healthscribe containers
    log('Finding application containers...', colors.cyan);
    const containers = await executeSSH('docker ps --format "{{.Names}}"');
    console.log(containers);
    
    const appContainers = containers.split('\n').filter(name => 
      name.includes('healthscribe') || 
      name.includes('dashboard') ||
      name.includes('tkwoos4s') || 
      name.match(/^[a-z0-9]{24}-\d+$/)
    );
    
    if (appContainers.length === 0) {
      log('❌ No application containers found', colors.red);
      return;
    }
    
    log(`\nFound ${appContainers.length} application container(s):`, colors.green);
    appContainers.forEach(c => console.log(`  - ${c}`));
    
    for (const container of appContainers) {
      if (!container.trim()) continue;
      
      log(`\n🔄 Restarting: ${container}`, colors.cyan);
      const result = await executeSSH(`docker restart ${container}`);
      log(`✅ Restarted: ${result.trim()}`, colors.green);
    }
    
    log('\n' + '='.repeat(60), colors.green);
    log('✅ APPLICATION RESTARTED SUCCESSFULLY', colors.bright + colors.green);
    log('='.repeat(60) + '\n', colors.green);
    
    console.log('Next steps:');
    console.log('1. Wait 10-15 seconds for the app to fully start');
    console.log('2. Clear your browser cache and cookies');
    console.log('3. Go to: https://www.healthscribe.pro');
    console.log('4. Login as: omars14@gmail.com');
    console.log('5. Check dashboard - should show transcription count');
    console.log('6. Navigate to /dashboard/transcriptions - should see 29 transcriptions');
    console.log('7. Navigate to /dashboard/admin/users - should have admin access');
    console.log('');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();

