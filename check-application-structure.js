#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Application Structure');
console.log('=================================');

try {
    const currentDir = process.cwd();
    console.log(`📁 Current directory: ${currentDir}`);
    
    // List all files and directories
    console.log('\n📂 Directory contents:');
    const items = fs.readdirSync(currentDir);
    items.forEach(item => {
        const itemPath = path.join(currentDir, item);
        const stats = fs.statSync(itemPath);
        const type = stats.isDirectory() ? '📁' : '📄';
        console.log(`  ${type} ${item}`);
    });
    
    // Check for common Next.js directories
    console.log('\n🔍 Checking for Next.js structure:');
    
    const nextDirs = ['src', 'pages', 'app', 'components', 'lib', 'public'];
    nextDirs.forEach(dir => {
        const dirPath = path.join(currentDir, dir);
        if (fs.existsSync(dirPath)) {
            const stats = fs.statSync(dirPath);
            if (stats.isDirectory()) {
                console.log(`  ✅ ${dir}/ directory exists`);
                // List contents of important directories
                if (['src', 'pages', 'app'].includes(dir)) {
                    const contents = fs.readdirSync(dirPath);
                    console.log(`     Contents: ${contents.join(', ')}`);
                }
            }
        } else {
            console.log(`  ❌ ${dir}/ directory missing`);
        }
    });
    
    // Check for important files
    console.log('\n🔍 Checking for important files:');
    const importantFiles = ['next.config.js', 'next.config.ts', 'tailwind.config.js', 'tsconfig.json'];
    importantFiles.forEach(file => {
        const filePath = path.join(currentDir, file);
        if (fs.existsSync(filePath)) {
            console.log(`  ✅ ${file} exists`);
        } else {
            console.log(`  ❌ ${file} missing`);
        }
    });
    
    // Check if there's a src directory with app or pages
    const srcPath = path.join(currentDir, 'src');
    if (fs.existsSync(srcPath)) {
        console.log('\n📁 Checking src/ directory:');
        const srcContents = fs.readdirSync(srcPath);
        srcContents.forEach(item => {
            const itemPath = path.join(srcPath, item);
            const stats = fs.statSync(itemPath);
            const type = stats.isDirectory() ? '📁' : '📄';
            console.log(`  ${type} src/${item}`);
        });
    }
    
} catch (error) {
    console.error('❌ Error checking application structure:', error.message);
}




