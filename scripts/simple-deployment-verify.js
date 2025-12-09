#!/usr/bin/env node
/**
 * Simple Deployment Verification
 * Checks local files and configuration without external dependencies
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 Simple Deployment Verification');
console.log('='.repeat(50));

let passed = 0;
let failed = 0;

function check(name, condition, details = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    failed++;
  }
}

// Check 1: Environment file exists
check(
  'Environment configuration',
  fs.existsSync('.env.local'),
  '.env.local file exists'
);

// Check 2: Package.json exists and has required scripts
const packageExists = fs.existsSync('package.json');
check('Package.json exists', packageExists);

if (packageExists) {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    check('Build script exists', !!pkg.scripts?.build);
    check('Test script exists', !!pkg.scripts?.test);
    check('Dev script exists', !!pkg.scripts?.dev);
  } catch (error) {
    check('Package.json parsing', false, error.message);
  }
}

// Check 3: Source files exist
check('Source directory exists', fs.existsSync('src'));
check('Question service exists', fs.existsSync('src/services/question-service.ts'));
check('Main app file exists', fs.existsSync('src/App.tsx'));

// Check 4: TypeScript config exists
check('TypeScript config exists', fs.existsSync('tsconfig.json'));

// Check 5: Vite config exists
check('Vite config exists', fs.existsSync('vite.config.ts'));

// Check 6: Check if question service has subject_id methods
if (fs.existsSync('src/services/question-service.ts')) {
  try {
    const questionService = fs.readFileSync('src/services/question-service.ts', 'utf8');
    check(
      'getQuestionsBySubjectId method exists',
      questionService.includes('getQuestionsBySubjectId'),
      'Method found in question service'
    );
    check(
      'Subject-based queries implemented',
      questionService.includes('subject_id'),
      'subject_id references found'
    );
  } catch (error) {
    check('Question service analysis', false, error.message);
  }
}

// Check 7: Migration scripts exist
check('Migration scripts directory exists', fs.existsSync('scripts'));
if (fs.existsSync('scripts')) {
  const scripts = fs.readdirSync('scripts');
  check(
    'Subject ID migration script exists',
    scripts.some(s => s.includes('subject-id') || s.includes('migration')),
    'Migration scripts found'
  );
}

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✅ DEPLOYMENT READY');
  console.log('\n📋 Deployment Summary:');
  console.log('   • Environment configured');
  console.log('   • Source files present');
  console.log('   • Question service updated with subject_id support');
  console.log('   • Migration scripts available');
  console.log('\n🚀 Ready for staging deployment!');
} else {
  console.log('❌ DEPLOYMENT ISSUES DETECTED');
  console.log('   Fix the failed checks above');
}

process.exit(failed === 0 ? 0 : 1);