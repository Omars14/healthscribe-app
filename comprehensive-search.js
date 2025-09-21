#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Comprehensive Search for Your Application Files');
console.log('=================================================');

try {
    // Search from root directory for Next.js files
    console.log('🔍 Searching from root directory for Next.js files...');
    
    // Search for package.json files (from root)
    console.log('\n📄 Looking for package.json files (from root):');
    try {
        const packageJsonResults = execSync('find / -name "package.json" -type f 2>/dev/null | head -20', { encoding: 'utf8' });
        if (packageJsonResults.trim()) {
            packageJsonResults.split('\n').forEach(file => {
                if (file.trim()) {
                    console.log(`  📄 ${file}`);
                    // Check if it's a Next.js project
                    try {
                        const content = fs.readFileSync(file, 'utf8');
                        if (content.includes('"next"') || content.includes('next.js') || content.includes('react')) {
                            console.log(`    ✅ This looks like a Next.js/React project!`);
                            // Show the directory
                            const dir = path.dirname(file);
                            console.log(`    📁 Directory: ${dir}`);
                        }
                    } catch (e) {
                        // Ignore read errors
                    }
                }
            });
        } else {
            console.log('  ❌ No package.json files found');
        }
    } catch (e) {
        console.log('  ❌ Error searching for package.json files');
    }
    
    // Search for src directories (from root)
    console.log('\n📁 Looking for src directories (from root):');
    try {
        const srcResults = execSync('find / -name "src" -type d 2>/dev/null | head -10', { encoding: 'utf8' });
        if (srcResults.trim()) {
            srcResults.split('\n').forEach(dir => {
                if (dir.trim()) {
                    console.log(`  📁 ${dir}`);
                }
            });
        } else {
            console.log('  ❌ No src directories found');
        }
    } catch (e) {
        console.log('  ❌ Error searching for src directories');
    }
    
    // Search for app or pages directories (from root)
    console.log('\n📁 Looking for app or pages directories (from root):');
    try {
        const appResults = execSync('find / -name "app" -o -name "pages" -type d 2>/dev/null | head -10', { encoding: 'utf8' });
        if (appResults.trim()) {
            appResults.split('\n').forEach(dir => {
                if (dir.trim()) {
                    console.log(`  📁 ${dir}`);
                }
            });
        } else {
            console.log('  ❌ No app or pages directories found');
        }
    } catch (e) {
        console.log('  ❌ Error searching for app/pages directories');
    }
    
    // Search for next.config files (from root)
    console.log('\n⚙️ Looking for Next.js config files (from root):');
    try {
        const configResults = execSync('find / -name "next.config.*" -type f 2>/dev/null', { encoding: 'utf8' });
        if (configResults.trim()) {
            configResults.split('\n').forEach(file => {
                if (file.trim()) {
                    console.log(`  ⚙️ ${file}`);
                }
            });
        } else {
            console.log('  ❌ No next.config files found');
        }
    } catch (e) {
        console.log('  ❌ Error searching for config files');
    }
    
    // Check common web application locations
    console.log('\n📂 Checking common web application locations:');
    const commonPaths = [
        '/var/www',
        '/var/www/html',
        '/home',
        '/root',
        '/opt',
        '/usr/local',
        '/srv',
        '/home/ubuntu',
        '/home/user',
        '/home/admin'
    ];
    
    commonPaths.forEach(basePath => {
        if (fs.existsSync(basePath)) {
            console.log(`\n📁 ${basePath}:`);
            try {
                const items = fs.readdirSync(basePath);
                items.forEach(item => {
                    const itemPath = path.join(basePath, item);
                    try {
                        const stats = fs.statSync(itemPath);
                        const type = stats.isDirectory() ? '📁' : '📄';
                        console.log(`  ${type} ${item}`);
                    } catch (e) {
                        console.log(`  ❌ ${item} (cannot access)`);
                    }
                });
            } catch (e) {
                console.log(`  ❌ Cannot read ${basePath}`);
            }
        }
    });
    
    // Search for any directory containing "healthscribe" or "dashboard"
    console.log('\n🔍 Looking for directories containing "healthscribe" or "dashboard":');
    try {
        const healthscribeResults = execSync('find / -type d -name "*healthscribe*" 2>/dev/null | head -10', { encoding: 'utf8' });
        if (healthscribeResults.trim()) {
            healthscribeResults.split('\n').forEach(dir => {
                if (dir.trim()) {
                    console.log(`  📁 ${dir}`);
                }
            });
        } else {
            console.log('  ❌ No directories containing "healthscribe" found');
        }
        
        const dashboardResults = execSync('find / -type d -name "*dashboard*" 2>/dev/null | head -10', { encoding: 'utf8' });
        if (dashboardResults.trim()) {
            dashboardResults.split('\n').forEach(dir => {
                if (dir.trim()) {
                    console.log(`  📁 ${dir}`);
                }
            });
        } else {
            console.log('  ❌ No directories containing "dashboard" found');
        }
    } catch (e) {
        console.log('  ❌ Error searching for specific directories');
    }
    
    console.log('\n🎯 Comprehensive search completed!');
    console.log('Look for directories that contain Next.js files and let me know what you find.');
    
} catch (error) {
    console.error('❌ Error during comprehensive search:', error.message);
}




