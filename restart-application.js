#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Restarting Application');
console.log('=========================');

try {
    // Check if we're in the right directory
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        console.log('❌ package.json not found. Are you in the right directory?');
        process.exit(1);
    }
    
    console.log('✅ Found package.json - in correct directory');
    
    // Check PM2 status
    console.log('📊 Current PM2 status:');
    try {
        execSync('pm2 status', { stdio: 'inherit' });
    } catch (e) {
        console.log('PM2 status check failed');
    }
    
    // Start the application
    console.log('🚀 Starting application with PM2...');
    try {
        execSync('pm2 start npm --name "healthscribe" -- start', { stdio: 'inherit' });
    } catch (e) {
        console.log('PM2 start failed, trying alternative method...');
        // Try alternative start method
        execSync('pm2 start "npm start" --name "healthscribe"', { stdio: 'inherit' });
    }
    
    // Wait for startup
    console.log('⏳ Waiting for application to start...');
    execSync('sleep 5', { stdio: 'inherit' });
    
    // Check status again
    console.log('📊 Application status after start:');
    execSync('pm2 status', { stdio: 'inherit' });
    
    // Test the application
    console.log('🧪 Testing application...');
    try {
        const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://www.healthscribe.pro', { encoding: 'utf8' });
        console.log(`✅ Application responding with status: ${response}`);
        
        if (response === '200') {
            console.log('🎉 Application is working!');
        } else {
            console.log(`⚠️ Application responding but with status ${response}`);
        }
    } catch (e) {
        console.log('❌ Application not responding yet - may need more time to start');
    }
    
    // Show logs
    console.log('📋 Recent application logs:');
    try {
        execSync('pm2 logs healthscribe --lines 10', { stdio: 'inherit' });
    } catch (e) {
        console.log('Could not retrieve logs');
    }
    
    console.log('🎉 Application restart completed!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Test your application at http://www.healthscribe.pro');
    console.log('2. If you still get 502, wait a few more seconds and try again');
    console.log('3. Check PM2 status: pm2 status');
    console.log('4. Check logs: pm2 logs healthscribe');
    
} catch (error) {
    console.error('❌ Error during application restart:', error.message);
    process.exit(1);
}




