import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');

// For now, we'll just copy the logo to different sizes
// A proper implementation would use sharp or canvas to resize
async function generateIcons() {
  console.log('🎨 Starting icon generation...\n');

  // Create icons directory if it doesn't exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('✅ Created icons directory');
  }

  // Use sophialogo1.png as the source
  const sourceLogo = path.join(publicDir, 'sophialogo1.png');

  if (!fs.existsSync(sourceLogo)) {
    console.error('❌ Source logo not found:', sourceLogo);
    process.exit(1);
  }

  console.log('📁 Source logo:', sourceLogo);
  console.log('📁 Output directory:', iconsDir);
  console.log('');

  try {
    // For now, just copy the logo to the required locations
    // In production, you'd want to properly resize these
    const iconFiles = [
      'icon-192x192.png',
      'icon-512x512.png',
      'apple-touch-icon.png',
      'icon-96x96.png',
      'icon-72x72.png',
      'icon-48x48.png',
      'favicon-32x32.png',
      'favicon-16x16.png',
    ];

    for (const filename of iconFiles) {
      const outputPath = path.join(iconsDir, filename);
      fs.copyFileSync(sourceLogo, outputPath);
      console.log(`✅ Created ${filename}`);
    }

    // Copy to public root for easy access
    const faviconPath = path.join(publicDir, 'favicon.png');
    fs.copyFileSync(sourceLogo, faviconPath);
    console.log('✅ Created favicon.png');

    const appleTouchIconPath = path.join(publicDir, 'apple-touch-icon.png');
    fs.copyFileSync(sourceLogo, appleTouchIconPath);
    console.log('✅ Created apple-touch-icon.png');

    console.log('\n🎉 Icon generation complete!');
    console.log(`\n📊 Generated ${iconFiles.length} icon files`);
    console.log('📁 Icons saved to:', iconsDir);
    console.log('\n⚠️  Note: Icons are copies of the source. For production, consider using sharp or canvas to properly resize.');

  } catch (error) {
    console.error('❌ Error generating icons:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
generateIcons().catch(console.error);

