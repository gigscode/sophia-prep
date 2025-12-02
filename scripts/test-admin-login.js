/**
 * Interactive Admin Login Test Script
 * 
 * This script helps test the admin login functionality by:
 * - Testing email normalization
 * - Verifying admin status checking
 * - Checking profile operations
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  if (!email) return '[no email]';
  const parts = email.split('@');
  if (parts.length !== 2) return '[invalid email]';
  const localPart = parts[0];
  const domain = parts[1];
  return localPart.length > 3 
    ? `${localPart.substring(0, 3)}***@${domain}`
    : `***@${domain}`;
}

/**
 * Check if email is admin
 */
function isAdmin(email) {
  const adminEmails = process.env.VITE_ADMIN_EMAILS 
    ? process.env.VITE_ADMIN_EMAILS.split(',').map(e => normalizeEmail(e.trim()))
    : ['reubensunday1220@gmail.com'];
  
  const normalized = normalizeEmail(email);
  return adminEmails.includes(normalized);
}

/**
 * Test login with various email formats
 */
async function testLogin(email, password) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing login with: "${email}"`);
  console.log(`${'='.repeat(60)}`);
  
  // Show normalization
  const normalized = normalizeEmail(email);
  console.log(`📧 Original email: "${email}"`);
  console.log(`📧 Normalized email: "${normalized}"`);
  console.log(`📧 Redacted email: "${redactEmail(email)}"`);
  
  // Check admin status
  const adminStatus = isAdmin(email);
  console.log(`👤 Admin status: ${adminStatus ? '✅ Yes' : '❌ No'}`);
  
  // Attempt login
  console.log('\n🔐 Attempting authentication...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });
    
    if (error) {
      console.error(`❌ Authentication failed: ${error.message}`);
      return false;
    }
    
    if (data.user) {
      console.log('✅ Authentication successful!');
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${redactEmail(data.user.email)}`);
      console.log(`   Created: ${new Date(data.user.created_at).toLocaleString()}`);
      
      // Check profile
      console.log('\n📋 Checking user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.error(`❌ Profile check failed: ${profileError.message}`);
      } else if (profile) {
        console.log('✅ Profile found');
        console.log(`   Email: ${redactEmail(profile.email)}`);
        console.log(`   Active: ${profile.is_active}`);
        console.log(`   Subscription: ${profile.subscription_plan}`);
        console.log(`   Last Login: ${profile.last_login ? new Date(profile.last_login).toLocaleString() : 'Never'}`);
      }
      
      // Sign out
      await supabase.auth.signOut();
      console.log('\n✅ Signed out successfully');
      
      return true;
    }
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    return false;
  }
  
  return false;
}

/**
 * Interactive prompt
 */
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Interactive Admin Login Test');
  console.log('='.repeat(60));
  console.log('\nThis script will test the admin login functionality');
  console.log('with various email formats to verify case-insensitive');
  console.log('matching and whitespace trimming.\n');
  
  // Get credentials
  const email = await prompt('Enter admin email (reubensunday1220@gmail.com): ');
  const password = await prompt('Enter password: ');
  
  if (!email || !password) {
    console.error('\n❌ Email and password are required');
    process.exit(1);
  }
  
  // Test variations
  const variations = [
    email,
    email.toLowerCase(),
    email.toUpperCase(),
    `  ${email}`,
    `${email}  `,
    `  ${email}  `,
  ];
  
  console.log(`\n📋 Testing ${variations.length} email variations...\n`);
  
  let successCount = 0;
  
  for (const variation of variations) {
    const success = await testLogin(variation, password);
    if (success) successCount++;
    
    // Wait a bit between attempts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successful logins: ${successCount}/${variations.length}`);
  console.log(`❌ Failed logins: ${variations.length - successCount}/${variations.length}`);
  
  if (successCount === variations.length) {
    console.log('\n✅ All tests passed! Email normalization is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Check the errors above.');
  }
  
  console.log('='.repeat(60));
}

// Run tests
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
