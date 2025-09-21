#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Package.json Scripts');
console.log('==============================');

try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        console.log('❌ package.json not found');
        process.exit(1);
    }
    
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log('📄 Current package.json scripts:');
    console.log(JSON.stringify(packageJson.scripts, null, 2));
    
    // Check if start script exists
    if (!packageJson.scripts || !packageJson.scripts.start) {
        console.log('❌ No "start" script found');
        
        // Add the start script
        if (!packageJson.scripts) {
            packageJson.scripts = {};
        }
        
        // Add common Next.js scripts
        packageJson.scripts.start = 'next start';
        packageJson.scripts.dev = 'next dev';
        packageJson.scripts.build = 'next build';
        
        // Write back to package.json
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        
        console.log('✅ Added missing scripts to package.json:');
        console.log('  - start: next start');
        console.log('  - dev: next dev');
        console.log('  - build: next build');
    } else {
        console.log('✅ "start" script already exists');
    }
    
    // Show final scripts
    console.log('\n📄 Final package.json scripts:');
    const finalPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log(JSON.stringify(finalPackageJson.scripts, null, 2));
    
    console.log('\n🎉 Package.json scripts fixed!');
    
} catch (error) {
    console.error('❌ Error fixing package.json:', error.message);
    process.exit(1);
}




