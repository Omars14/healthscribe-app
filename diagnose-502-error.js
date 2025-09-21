#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing 502 Bad Gateway Error');
console.log('===================================');

try {
    // Check PM2 status
    console.log('📊 PM2 Status:');
    execSync('pm2 status', { stdio: 'inherit' });
    
    // Check what port the application is running on
    console.log('\n🔍 Checking application ports:');
    try {
        execSync('netstat -tlnp | grep node', { stdio: 'inherit' });
    } catch (e) {
        console.log('No Node processes found with netstat');
    }
    
    // Check PM2 logs for errors
    console.log('\n📋 PM2 Logs (last 20 lines):');
    try {
        execSync('pm2 logs healthscribe --lines 20', { stdio: 'inherit' });
    } catch (e) {
        console.log('Could not retrieve PM2 logs');
    }
    
    // Check Nginx configuration
    console.log('\n🌐 Checking Nginx configuration:');
    try {
        execSync('nginx -t', { stdio: 'inherit' });
    } catch (e) {
        console.log('Nginx configuration has errors');
    }
    
    // Check Nginx error logs
    console.log('\n📋 Nginx Error Logs (last 10 lines):');
    try {
        execSync('tail -10 /var/log/nginx/error.log', { stdio: 'inherit' });
    } catch (e) {
        console.log('Could not retrieve Nginx error logs');
    }
    
    // Check if the application is responding locally
    console.log('\n🧪 Testing local application:');
    try {
        execSync('curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000', { stdio: 'inherit' });
    } catch (e) {
        console.log('Application not responding on localhost:3000');
    }
    
    // Check Nginx sites
    console.log('\n📁 Nginx sites:');
    try {
        execSync('ls -la /etc/nginx/sites-enabled/', { stdio: 'inherit' });
    } catch (e) {
        console.log('Could not list Nginx sites');
    }
    
    // Check if there are any conflicting processes
    console.log('\n🔍 Checking for conflicting processes:');
    try {
        execSync('ps aux | grep -E "(nginx|node|pm2)" | grep -v grep', { stdio: 'inherit' });
    } catch (e) {
        console.log('Could not check processes');
    }
    
    console.log('\n🎯 Diagnosis completed!');
    console.log('Check the output above for any errors or issues.');
    
} catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
}




