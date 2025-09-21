#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Finding Your Application Files');
console.log('=================================');

try {
    // Search for common Next.js files and directories
    console.log('🔍 Searching for Next.js application files...');
    
    // Search for package.json files
    console.log('\n📄 Looking for package.json files:');
    try {
        const packageJsonResults = execSync('find /opt -name "package.json" -type f 2>/dev/null', { encoding: 'utf8' });
        if (packageJsonResults.trim()) {
            packageJsonResults.split('\n').forEach(file => {
                if (file.trim()) {
                    console.log(`  📄 ${file}`);
                    // Check if it's a Next.js project
                    try {
                        const content = fs.readFileSync(file, 'utf8');
                        if (content.includes('"next"') || content.includes('next.js')) {
                            console.log(`    ✅ This looks like a Next.js project!`);
                        }
                    } catch (e) {
                        // Ignore read errors
                    }
                }
            });
        } else {
            console.log('  ❌ No package.json files found in /opt');
        }
    } catch (e) {
        console.log('  ❌ Error searching for package.json files');
    }
    
    // Search for src directories
    console.log('\n📁 Looking for src directories:');
    try {
        const srcResults = execSync('find /opt -name "src" -type d 2>/dev/null', { encoding: 'utf8' });
        if (srcResults.trim()) {
            srcResults.split('\n').forEach(dir => {
                if (dir.trim()) {
                    console.log(`  📁 ${dir}`);
                }
            });
        } else {
            console.log('  ❌ No src directories found in /opt');
        }
    } catch (e) {
        console.log('  ❌ Error searching for src directories');
    }
    
    // Search for app or pages directories
    console.log('\n📁 Looking for app or pages directories:');
    try {
        const appResults = execSync('find /opt -name "app" -o -name "pages" -type d 2>/dev/null', { encoding: 'utf8' });
        if (appResults.trim()) {
            appResults.split('\n').forEach(dir => {
                if (dir.trim()) {
                    console.log(`  📁 ${dir}`);
                }
            });
        } else {
            console.log('  ❌ No app or pages directories found in /opt');
        }
    } catch (e) {
        console.log('  ❌ Error searching for app/pages directories');
    }
    
    // Search for next.config files
    console.log('\n⚙️ Looking for Next.js config files:');
    try {
        const configResults = execSync('find /opt -name "next.config.*" -type f 2>/dev/null', { encoding: 'utf8' });
        if (configResults.trim()) {
            configResults.split('\n').forEach(file => {
                if (file.trim()) {
                    console.log(`  ⚙️ ${file}`);
                }
            });
        } else {
            console.log('  ❌ No next.config files found in /opt');
        }
    } catch (e) {
        console.log('  ❌ Error searching for config files');
    }
    
    // Check common locations
    console.log('\n📂 Checking common application locations:');
    const commonPaths = [
        '/opt/healthscribe',
        '/opt/app',
        '/opt/nextjs',
        '/opt/dashboard',
        '/var/www',
        '/home/ubuntu',
        '/root'
    ];
    
    commonPaths.forEach(basePath => {
        if (fs.existsSync(basePath)) {
            console.log(`\n📁 ${basePath}:`);
            try {
                const items = fs.readdirSync(basePath);
                items.forEach(item => {
                    const itemPath = path.join(basePath, item);
                    const stats = fs.statSync(itemPath);
                    const type = stats.isDirectory() ? '📁' : '📄';
                    console.log(`  ${type} ${item}`);
                });
            } catch (e) {
                console.log(`  ❌ Cannot read ${basePath}`);
            }
        }
    });
    
    console.log('\n🎯 Search completed! Look for directories that contain Next.js files.');
    
} catch (error) {
    console.error('❌ Error searching for application files:', error.message);
}




