#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking and Fixing Package.json');
console.log('===================================');

try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        console.log('❌ package.json not found');
        process.exit(1);
    }
    
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log('📄 Current package.json:');
    console.log(JSON.stringify(packageJson, null, 2));
    
    // Check if scripts exist
    if (!packageJson.scripts) {
        console.log('❌ No scripts section found');
        packageJson.scripts = {};
    }
    
    // Add the correct scripts
    packageJson.scripts = {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint"
    };
    
    // Write back to package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('✅ Fixed package.json with correct scripts:');
    console.log(JSON.stringify(packageJson.scripts, null, 2));
    
    // Verify the file was written correctly
    const verifyPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('✅ Verification - package.json now contains:');
    console.log(JSON.stringify(verifyPackageJson.scripts, null, 2));
    
} catch (error) {
    console.error('❌ Error fixing package.json:', error.message);
    process.exit(1);
}




