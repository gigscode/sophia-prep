const fs = require('fs');
const path = require('path');

/**
 * Generate version.json file for app update detection
 * This script runs during build to create a version manifest
 */

try {
    // Read package.json to get version
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Generate version manifest
    const versionManifest = {
        version: packageJson.version,
        buildTime: new Date().toISOString(),
        buildId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        cacheName: `sophia-prep-v${packageJson.version.replace(/\./g, '-')}`
    };

    // Write to public directory
    const outputPath = path.join(__dirname, '..', 'public', 'version.json');
    fs.writeFileSync(outputPath, JSON.stringify(versionManifest, null, 2), 'utf8');

    console.log('✅ Generated version.json:', versionManifest);
} catch (error) {
    console.error('❌ Error generating version.json:', error);
    process.exit(1);
}
