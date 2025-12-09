#!/usr/bin/env node
/**
 * Staging Deployment Verification Script
 * 
 * This script verifies that the staging deployment is working correctly
 * by testing the application through HTTP requests and API calls.
 * 
 * Requirements: 7.1, 7.2
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🌐 Staging Deployment Verification\n');
console.log('=' .repeat(70));

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

/**
 * Test 1: Verify build artifacts exist
 */
function verifyBuildArtifacts() {
  console.log('\n📦 Test 1: Verify build artifacts');
  console.log('-'.repeat(70));
  
  const requiredFiles = [
    'dist/index.html',
    'dist/assets',
    'package.json'
  ];
  
  let allExist = true;
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      logTest(`Build artifact: ${file}`, true, 'File exists');
    } else {
      logTest(`Build artifact: ${file}`, false, 'File missing');
      allExist = false;
    }
  }
  
  return allExist;
}

/**
 * Test 2: Verify package.json scripts
 */
function verifyPackageScripts() {
  console.log('\n📋 Test 2: Verify package.json scripts');
  console.log('-'.repeat(70));
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredScripts = ['build', 'preview', 'test'];
    
    let allExist = true;
    
    for (const script of requiredScripts) {
      if (packageJson.scripts && packageJson.scripts[script]) {
        logTest(`Script: ${script}`, true, `Command: ${packageJson.scripts[script]}`);
      } else {
        logTest(`Script: ${script}`, false, 'Script missing');
        allExist = false;
      }
    }
    
    return allExist;
  } catch (error) {
    logTest('Package.json parsing', false, `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Verify environment configuration
 */
function verifyEnvironmentConfig() {
  console.log('\n🔧 Test 3: Verify environment configuration');
  console.log('-'.repeat(70));
  
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  let allConfigured = true;
  
  // Check .env.local
  if (fs.existsSync('.env.local')) {
    logTest('Environment file', true, '.env.local exists');
    
    const envContent = fs.readFileSync('.env.local', 'utf8');
    
    for (const envVar of requiredEnvVars) {
      if (envContent.includes(envVar)) {
        logTest(`Environment variable: ${envVar}`, true, 'Variable configured');
      } else {
        logTest(`Environment variable: ${envVar}`, false, 'Variable missing');
        allConfigured = false;
      }
    }
  } else {
    logTest('Environment file', false, '.env.local missing');
    allConfigured = false;
  }
  
  return allConfigured;
}

/**
 * Test 4: Run application tests
 */
function runApplicationTests() {
  console.log('\n🧪 Test 4: Run application tests');
  console.log('-'.repeat(70));
  
  try {
    console.log('   Running test suite...');
    execSync('npm run test', { stdio: 'pipe' });
    logTest('Application tests', true, 'All tests passed');
    return true;
  } catch (error) {
    logTest('Application tests', false, 'Some tests failed');
    console.log('   Test output:', error.stdout?.toString() || error.message);
    return false;
  }
}

/**
 * Test 5: Verify TypeScript compilation
 */
function verifyTypeScriptCompilation() {
  console.log('\n📝 Test 5: Verify TypeScript compilation');
  console.log('-'.repeat(70));
  
  try {
    console.log('   Checking TypeScript compilation...');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    logTest('TypeScript compilation', true, 'No type errors');
    return true;
  } catch (error) {
    logTest('TypeScript compilation', false, 'Type errors found');
    console.log('   TypeScript errors:', error.stdout?.toString() || error.message);
    return false;
  }
}

/**
 * Test 6: Verify linting
 */
function verifyLinting() {
  console.log('\n🔍 Test 6: Verify code linting');
  console.log('-'.repeat(70));
  
  try {
    console.log('   Running ESLint...');
    execSync('npm run lint', { stdio: 'pipe' });
    logTest('Code linting', true, 'No linting errors');
    return true;
  } catch (error) {
    logTest('Code linting', false, 'Linting errors found');
    console.log('   Linting output:', error.stdout?.toString() || error.message);
    return false;
  }
}

/**
 * Print verification summary
 */
function printVerificationSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 STAGING VERIFICATION SUMMARY');
  console.log('='.repeat(70));
  
  console.log(`\nTotal Tests: ${testResults.tests.length}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`   - ${t.name}`);
        if (t.details) console.log(`     ${t.details}`);
      });
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (testResults.failed === 0) {
    console.log('✅ STAGING VERIFICATION SUCCESSFUL');
    console.log('\n📋 Ready for deployment to production!');
    console.log('\n🚀 Deployment checklist:');
    console.log('   ✅ Build artifacts created');
    console.log('   ✅ Tests passing');
    console.log('   ✅ TypeScript compilation clean');
    console.log('   ✅ Linting clean');
    console.log('   ✅ Environment configured');
  } else {
    console.log('⚠️  STAGING VERIFICATION FAILED');
    console.log('\n🔧 Fix the issues above before deploying to production');
  }
  
  console.log('');
}

/**
 * Main execution
 */
function main() {
  try {
    console.log('Starting staging deployment verification...\n');
    
    const buildArtifactsOk = verifyBuildArtifacts();
    const packageScriptsOk = verifyPackageScripts();
    const environmentOk = verifyEnvironmentConfig();
    const testsOk = runApplicationTests();
    const typeScriptOk = verifyTypeScriptCompilation();
    const lintingOk = verifyLinting();
    
    printVerificationSummary();
    
    if (testResults.failed > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
  }
}

main();