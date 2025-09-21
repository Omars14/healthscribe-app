#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🏗️ Creating Basic Next.js Structure');
console.log('===================================');

try {
    const currentDir = process.cwd();
    
    // Create src/app directory structure
    const appDir = path.join(currentDir, 'src', 'app');
    if (!fs.existsSync(appDir)) {
        console.log('📁 Creating src/app directory...');
        fs.mkdirSync(appDir, { recursive: true });
    }
    
    // Create basic layout.js
    const layoutPath = path.join(appDir, 'layout.js');
    if (!fs.existsSync(layoutPath)) {
        console.log('📄 Creating layout.js...');
        const layoutContent = `export const metadata = {
  title: 'HealthScribe',
  description: 'Medical Transcription Platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`;
        fs.writeFileSync(layoutPath, layoutContent);
    }
    
    // Create basic page.js
    const pagePath = path.join(appDir, 'page.js');
    if (!fs.existsSync(pagePath)) {
        console.log('📄 Creating page.js...');
        const pageContent = `export default function Home() {
  return (
    <main>
      <h1>HealthScribe</h1>
      <p>Medical Transcription Platform</p>
      <p>Application is running successfully!</p>
    </main>
  )
}`;
        fs.writeFileSync(pagePath, pageContent);
    }
    
    // Create components directory
    const componentsDir = path.join(currentDir, 'src', 'components');
    if (!fs.existsSync(componentsDir)) {
        console.log('📁 Creating src/components directory...');
        fs.mkdirSync(componentsDir, { recursive: true });
    }
    
    // Create lib directory
    const libDir = path.join(currentDir, 'src', 'lib');
    if (!fs.existsSync(libDir)) {
        console.log('📁 Creating src/lib directory...');
        fs.mkdirSync(libDir, { recursive: true });
    }
    
    // Create public directory
    const publicDir = path.join(currentDir, 'public');
    if (!fs.existsSync(publicDir)) {
        console.log('📁 Creating public directory...');
        fs.mkdirSync(publicDir, { recursive: true });
    }
    
    console.log('✅ Basic Next.js structure created successfully!');
    
    // Show the created structure
    console.log('\n📂 Created structure:');
    console.log('  src/');
    console.log('    app/');
    console.log('      layout.js');
    console.log('      page.js');
    console.log('    components/');
    console.log('    lib/');
    console.log('  public/');
    
} catch (error) {
    console.error('❌ Error creating Next.js structure:', error.message);
    process.exit(1);
}




