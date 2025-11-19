import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');

console.log('🔍 Verifying PWA Setup...\n');

// Check for required files
const requiredFiles = [
  'public/manifest.json',
  'public/register-sw.js',
  'public/sw.js',
  'public/favicon.png',
  'public/apple-touch-icon.png',
  'public/icons/icon-16x16.png',
  'public/icons/icon-32x32.png',
  'public/icons/icon-48x48.png',
  'public/icons/icon-72x72.png',
  'public/icons/icon-96x96.png',
  'public/icons/icon-192x192.png',
  'public/icons/icon-512x512.png',
  'public/icons/apple-touch-icon.png',
  'public/icons/favicon-16x16.png',
  'public/icons/favicon-32x32.png',
];

let allFilesExist = true;

console.log('📁 Checking required files:\n');

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file}`);
  
  if (!exists) {
    allFilesExist = false;
  }
}

console.log('\n📋 Checking manifest.json configuration:\n');

try {
  const manifestPath = path.join(publicDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  console.log(`✅ Name: ${manifest.name}`);
  console.log(`✅ Short Name: ${manifest.short_name}`);
  console.log(`✅ Theme Color: ${manifest.theme_color}`);
  console.log(`✅ Background Color: ${manifest.background_color}`);
  console.log(`✅ Display: ${manifest.display}`);
  console.log(`✅ Icons: ${manifest.icons.length} configured`);
  console.log(`✅ Shortcuts: ${manifest.shortcuts.length} configured`);
  
  // Verify all icon files referenced in manifest exist
  console.log('\n🖼️  Verifying manifest icon references:\n');
  let allIconsExist = true;
  
  for (const icon of manifest.icons) {
    const iconPath = path.join(publicDir, icon.src);
    const exists = fs.existsSync(iconPath);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${icon.src} (${icon.sizes})`);
    
    if (!exists) {
      allIconsExist = false;
    }
  }
  
  if (!allIconsExist) {
    console.log('\n⚠️  Some icons referenced in manifest.json are missing!');
    allFilesExist = false;
  }
  
} catch (error) {
  console.error('❌ Error reading manifest.json:', error.message);
  allFilesExist = false;
}

console.log('\n📄 Checking index.html configuration:\n');

try {
  const indexPath = path.join(__dirname, '..', 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  const checks = [
    { pattern: /favicon.*\.png/, name: 'Favicon PNG reference' },
    { pattern: /apple-touch-icon/, name: 'Apple touch icon' },
    { pattern: /manifest\.json/, name: 'Manifest link' },
    { pattern: /register-sw\.js/, name: 'Service worker registration' },
    { pattern: /theme-color/, name: 'Theme color meta tag' },
  ];
  
  for (const check of checks) {
    const found = check.pattern.test(indexContent);
    const status = found ? '✅' : '❌';
    console.log(`${status} ${check.name}`);
    
    if (!found) {
      allFilesExist = false;
    }
  }
  
} catch (error) {
  console.error('❌ Error reading index.html:', error.message);
  allFilesExist = false;
}

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
  console.log('\n✅ PWA setup is complete and all files are in place!');
  console.log('\n📱 Next steps:');
  console.log('   1. Build the project: npm run build');
  console.log('   2. Preview the build: npm run preview');
  console.log('   3. Test PWA installation in Chrome DevTools');
  console.log('   4. Verify offline functionality');
  process.exit(0);
} else {
  console.log('\n❌ PWA setup is incomplete. Please fix the issues above.');
  process.exit(1);
}

