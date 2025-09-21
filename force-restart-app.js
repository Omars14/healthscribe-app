#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Force Restart Application with HTTP Configuration');
console.log('====================================================');

try {
    // Check current .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log('📄 Current .env.local content:');
        console.log(envContent);
        
        // Check if it's using HTTP
        if (envContent.includes('http://supabase.healthscribe.pro')) {
            console.log('✅ Configuration already uses HTTP');
        } else {
            console.log('❌ Configuration still uses HTTPS - fixing...');
            
            // Force update to HTTP
            const updatedContent = envContent
                .replace(/https:\/\/supabase\.healthscribe\.pro/g, 'http://supabase.healthscribe.pro')
                .replace(/https:\/\/www\.healthscribe\.pro/g, 'http://www.healthscribe.pro');
            
            fs.writeFileSync(envPath, updatedContent);
            console.log('✅ Updated .env.local to use HTTP');
        }
    } else {
        console.log('❌ .env.local not found');
    }
    
    // Force stop PM2
    console.log('🛑 Force stopping PM2...');
    try {
        execSync('pm2 stop all', { stdio: 'inherit' });
    } catch (e) {
        console.log('PM2 stop failed (might not be running)');
    }
    
    // Kill any remaining Node processes
    console.log('🔪 Killing any remaining Node processes...');
    try {
        execSync('pkill -f node', { stdio: 'inherit' });
    } catch (e) {
        console.log('No Node processes to kill');
    }
    
    // Wait a moment
    console.log('⏳ Waiting 3 seconds...');
    execSync('sleep 3', { stdio: 'inherit' });
    
    // Start the application
    console.log('🚀 Starting application...');
    execSync('pm2 start npm --name "healthscribe" -- start', { stdio: 'inherit' });
    
    // Wait for startup
    console.log('⏳ Waiting for application to start...');
    execSync('sleep 5', { stdio: 'inherit' });
    
    // Check status
    console.log('📊 Application status:');
    execSync('pm2 status', { stdio: 'inherit' });
    
    // Test the application
    console.log('🧪 Testing application...');
    try {
        const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://www.healthscribe.pro', { encoding: 'utf8' });
        console.log(`✅ Application responding with status: ${response}`);
    } catch (e) {
        console.log('❌ Application not responding yet');
    }
    
    console.log('🎉 Force restart completed!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Test your application at http://www.healthscribe.pro');
    console.log('2. Try logging in - should now work without SSL errors!');
    console.log('3. The app will use self-hosted Supabase at http://supabase.healthscribe.pro (HTTP)');
    
} catch (error) {
    console.error('❌ Error during force restart:', error.message);
    process.exit(1);
}




