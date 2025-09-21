#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Installing Missing Dependencies');
console.log('===================================');

try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    // Read current package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log('📄 Current package.json:');
    console.log(JSON.stringify(packageJson, null, 2));
    
    // Create a complete package.json with all necessary dependencies
    const completePackageJson = {
        "name": "healthscribe",
        "version": "1.0.0",
        "private": true,
        "scripts": {
            "dev": "next dev",
            "build": "next build",
            "start": "next start",
            "lint": "next lint"
        },
        "dependencies": {
            "next": "^15.4.6",
            "react": "^18.0.0",
            "react-dom": "^18.0.0",
            "@supabase/supabase-js": "^2.57.4",
            "dotenv": "^17.2.2",
            "pg": "^8.16.3"
        },
        "devDependencies": {
            "@types/node": "^20.0.0",
            "@types/react": "^18.0.0",
            "@types/react-dom": "^18.0.0",
            "eslint": "^8.0.0",
            "eslint-config-next": "^15.4.6",
            "typescript": "^5.0.0"
        }
    };
    
    // Write the complete package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(completePackageJson, null, 2));
    
    console.log('✅ Updated package.json with all dependencies');
    
    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('✅ Dependencies installed successfully');
    
    // Build the application
    console.log('🔨 Building the application...');
    execSync('npm run build', { stdio: 'inherit' });
    
    console.log('✅ Application built successfully');
    
} catch (error) {
    console.error('❌ Error installing dependencies:', error.message);
    process.exit(1);
}




