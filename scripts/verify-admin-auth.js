/**
 * Admin Authentication Verification Script
 * 
 * This script verifies that the admin authentication fix is properly configured:
 * - Checks if admin user exists in auth.users
 * - Verifies user_profiles record exists
 * - Validates admin configuration
 * - Tests email normalization
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  console.error('\nPlease ensure these are set in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Admin email to verify
const ADMIN_EMAIL = 'reubensunday1220@gmail.com';

/**
 * Normalize email for consistent comparison
 */
function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

/**
 * Redact email for safe logging
 */
function redactEmail(email) {
  const parts = email.split('@');
  if (parts.length !== 2) return '[invalid email]';
  const localPart = parts[0];
  const domain = parts[1];
  return localPart.length > 3 
    ? `${localPart.substring(0, 3)}***@${domain}`
    : `***@${domain}`;
}

/**
 * Check if admin user exists in auth.users table
 */
async function checkAuthUser() {
  console.log('\n📋 Checking auth.users table...');
  
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return null;
    }
    
    const normalizedAdminEmail = normalizeEmail(ADMIN_EMAIL);
    const adminUser = data.users.find(
      user => normalizeEmail(user.email || '') === normalizedAdminEmail
    );
    
    if (adminUser) {
      console.log(`✅ Admin user found in auth.users`);
      console.log(`   Email: ${redactEmail(adminUser.email)}`);
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Created: ${new Date(adminUser.created_at).toLocaleString()}`);
      console.log(`   Last Sign In: ${adminUser.last_sign_in_at ? new Date(adminUser.last_sign_in_at).toLocaleString() : 'Never'}`);
      return adminUser;
    } else {
      console.error(`❌ Admin user ${redactEmail(ADMIN_EMAIL)} not found in auth.users`);
      console.log('   Please create this user in Supabase Auth dashboard');
      return null;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return null;
  }
}

/**
 * Check if user profile exists in user_profiles table
 */
async function checkUserProfile(userId) {
  console.log('\n📋 Checking user_profiles table...');
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.error('❌ User profile not found in user_profiles table');
        console.log('   Run: node scripts/ensure-admin-profiles.js');
        return null;
      }
      console.error('❌ Error fetching profile:', error.message);
      return null;
    }
    
    if (data) {
      console.log('✅ User profile found');
      console.log(`   Email: ${redactEmail(data.email)}`);
      console.log(`   Full Name: ${data.full_name || 'Not set'}`);
      console.log(`   Is Active: ${data.is_active}`);
      console.log(`   Subscription: ${data.subscription_plan}`);
      console.log(`   Last Login: ${data.last_login ? new Date(data.last_login).toLocaleString() : 'Never'}`);
      console.log(`   Created: ${new Date(data.created_at).toLocaleString()}`);
      return data;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return null;
  }
}

/**
 * Test email normalization
 */
function testEmailNormalization() {
  console.log('\n📋 Testing email normalization...');
  
  const testCases = [
    { input: 'reubensunday1220@gmail.com', expected: 'reubensunday1220@gmail.com' },
    { input: 'REUBENSUNDAY1220@GMAIL.COM', expected: 'reubensunday1220@gmail.com' },
    { input: 'ReubenSunday1220@Gmail.Com', expected: 'reubensunday1220@gmail.com' },
    { input: '  reubensunday1220@gmail.com', expected: 'reubensunday1220@gmail.com' },
    { input: 'reubensunday1220@gmail.com  ', expected: 'reubensunday1220@gmail.com' },
    { input: '  reubensunday1220@gmail.com  ', expected: 'reubensunday1220@gmail.com' },
  ];
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    const result = normalizeEmail(testCase.input);
    const passed = result === testCase.expected;
    
    if (passed) {
      console.log(`✅ "${testCase.input}" → "${result}"`);
    } else {
      console.log(`❌ "${testCase.input}" → "${result}" (expected: "${testCase.expected}")`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

/**
 * Check admin configuration
 */
function checkAdminConfig() {
  console.log('\n📋 Checking admin configuration...');
  
  const envAdminEmails = process.env.VITE_ADMIN_EMAILS;
  
  if (envAdminEmails) {
    console.log('✅ VITE_ADMIN_EMAILS environment variable is set');
    const emails = envAdminEmails.split(',').map(e => e.trim());
    console.log(`   Configured admin emails: ${emails.length}`);
    emails.forEach(email => {
      console.log(`   - ${redactEmail(email)}`);
    });
    
    const normalizedAdminEmail = normalizeEmail(ADMIN_EMAIL);
    const isConfigured = emails.some(email => normalizeEmail(email) === normalizedAdminEmail);
    
    if (isConfigured) {
      console.log(`✅ ${redactEmail(ADMIN_EMAIL)} is in admin configuration`);
    } else {
      console.error(`❌ ${redactEmail(ADMIN_EMAIL)} is NOT in admin configuration`);
      console.log('   Add it to VITE_ADMIN_EMAILS in .env.local');
    }
    
    return isConfigured;
  } else {
    console.log('⚠️  VITE_ADMIN_EMAILS not set, using default configuration');
    console.log(`   Default admin: ${redactEmail(ADMIN_EMAIL)}`);
    return true;
  }
}

/**
 * Main verification function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Admin Authentication Verification');
  console.log('='.repeat(60));
  
  // Test email normalization
  const normalizationPassed = testEmailNormalization();
  
  // Check admin configuration
  const configPassed = checkAdminConfig();
  
  // Check auth user
  const authUser = await checkAuthUser();
  
  // Check user profile
  let profileExists = false;
  if (authUser) {
    const profile = await checkUserProfile(authUser.id);
    profileExists = profile !== null;
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Verification Summary');
  console.log('='.repeat(60));
  
  const results = [
    { name: 'Email Normalization', passed: normalizationPassed },
    { name: 'Admin Configuration', passed: configPassed },
    { name: 'Auth User Exists', passed: authUser !== null },
    { name: 'User Profile Exists', passed: profileExists },
  ];
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });
  
  const allPassed = results.every(r => r.passed);
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ All checks passed! Admin authentication is properly configured.');
    console.log('\nYou can now proceed with manual testing:');
    console.log('1. Start the dev server: npm run dev');
    console.log('2. Navigate to: http://localhost:7351/login');
    console.log(`3. Log in as: ${ADMIN_EMAIL}`);
    console.log('4. Follow the manual testing guide in scripts/manual-testing-guide.md');
  } else {
    console.log('❌ Some checks failed. Please address the issues above.');
    console.log('\nCommon fixes:');
    console.log('- Create admin user in Supabase Auth dashboard');
    console.log('- Run: node scripts/ensure-admin-profiles.js');
    console.log('- Add VITE_ADMIN_EMAILS to .env.local');
  }
  console.log('='.repeat(60));
  
  process.exit(allPassed ? 0 : 1);
}

// Run verification
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
