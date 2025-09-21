#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Environment Configuration');
console.log('=====================================');

try {
    // Check .env.local
    const envLocalPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
        console.log('📄 .env.local content:');
        const envContent = fs.readFileSync(envLocalPath, 'utf8');
        console.log(envContent);
        
        // Check for HTTPS vs HTTP
        if (envContent.includes('https://supabase.healthscribe.pro')) {
            console.log('❌ Still using HTTPS for Supabase URL');
        } else if (envContent.includes('http://supabase.healthscribe.pro')) {
            console.log('✅ Using HTTP for Supabase URL');
        } else {
            console.log('❓ Supabase URL not found in .env.local');
        }
    } else {
        console.log('❌ .env.local not found');
    }
    
    // Check .env
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        console.log('📄 .env content:');
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log(envContent);
    } else {
        console.log('ℹ️ .env not found (this is normal)');
    }
    
    // Check if there are any other env files
    const files = fs.readdirSync(process.cwd());
    const envFiles = files.filter(f => f.startsWith('.env'));
    console.log(`📁 Found environment files: ${envFiles.join(', ')}`);
    
} catch (error) {
    console.error('❌ Error checking environment:', error.message);
}




