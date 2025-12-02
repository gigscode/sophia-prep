#!/usr/bin/env node
/**
 * Admin Profile Verification Script
 * 
 * This script ensures that all admin users have corresponding user_profiles records.
 * It checks auth.users for admin accounts and creates missing profiles if needed.
 * 
 * Requirements: 5.1, 5.4
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const VITE_ADMIN_EMAILS = process.env.VITE_ADMIN_EMAILS;

console.log('🔧 Admin Profile Verification Script\n');
console.log('📍 URL:', SUPABASE_URL);
console.log('🔑 Service Role Key:', SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Normalizes an email address for consistent comparison
 */
const normalizeEmail = (email) => {
  return email.toLowerCase().trim();
};

/**
 * Load admin emails from environment or use defaults
 */
const loadAdminEmails = () => {
  const defaultAdmins = ['reubensunday1220@gmail.com'];
  
  if (VITE_ADMIN_EMAILS && typeof VITE_ADMIN_EMAILS === 'string') {
    const emails = VITE_ADMIN_EMAILS
      .split(',')
      .map(email => normalizeEmail(email.trim()))
      .filter(email => email.length > 0);
    
    return emails.length > 0 ? emails : defaultAdmins.map(normalizeEmail);
  }
  
  return defaultAdmins.map(normalizeEmail);
};

/**
 * Check if a user exists in auth.users by email
 */
async function checkAuthUser(email) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error(`   ❌ Error listing users: ${error.message}`);
      return null;
    }
    
    const normalizedEmail = normalizeEmail(email);
    const user = data.users.find(u => normalizeEmail(u.email || '') === normalizedEmail);
    
    return user || null;
  } catch (err) {
    console.error(`   ❌ Exception checking auth user: ${err.message}`);
    return null;
  }
}

/**
 * Check if a user_profiles record exists for a user ID
 */
async function checkUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error(`   ❌ Error checking profile: ${error.message}`);
      return null;
    }
    
    return data || null;
  } catch (err) {
    console.error(`   ❌ Exception checking profile: ${err.message}`);
    return null;
  }
}

/**
 * Create a user_profiles record for an admin user
 */
async function createUserProfile(user) {
  try {
    const profileData = {
      id: user.id,
      email: normalizeEmail(user.email),
      full_name: user.user_metadata?.full_name || null,
      phone_number: user.user_metadata?.phone_number || null,
      exam_type: null,
      target_exam_date: null,
      preferred_subjects: null,
      avatar_url: user.user_metadata?.avatar_url || null,
      bio: null,
      is_active: true,
      last_login: new Date().toISOString(),
      subscription_plan: 'Free',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (error) {
      console.error(`   ❌ Error creating profile: ${error.message}`);
      return false;
    }
    
    console.log(`   ✅ Profile created successfully`);
    return true;
  } catch (err) {
    console.error(`   ❌ Exception creating profile: ${err.message}`);
    return false;
  }
}

/**
 * Process a single admin email
 */
async function processAdminEmail(email) {
  console.log(`\n📧 Processing: ${email}`);
  
  // Step 1: Check if user exists in auth.users
  console.log('   🔍 Checking auth.users...');
  const authUser = await checkAuthUser(email);
  
  if (!authUser) {
    console.log('   ⚠️  User not found in auth.users');
    console.log('   💡 This user needs to sign up first');
    return { email, status: 'not_registered', authUser: null, profile: null };
  }
  
  console.log(`   ✅ Found in auth.users (ID: ${authUser.id})`);
  
  // Step 2: Check if user_profiles record exists
  console.log('   🔍 Checking user_profiles...');
  const profile = await checkUserProfile(authUser.id);
  
  if (profile) {
    console.log('   ✅ Profile exists');
    return { email, status: 'complete', authUser, profile };
  }
  
  console.log('   ⚠️  Profile missing');
  
  // Step 3: Create missing profile
  console.log('   🔨 Creating profile...');
  const created = await createUserProfile(authUser);
  
  if (created) {
    return { email, status: 'created', authUser, profile: null };
  } else {
    return { email, status: 'failed', authUser, profile: null };
  }
}

/**
 * Main execution function
 */
async function main() {
  const adminEmails = loadAdminEmails();
  
  console.log('👥 Admin emails to verify:');
  adminEmails.forEach(email => console.log(`   - ${email}`));
  
  const results = [];
  
  for (const email of adminEmails) {
    const result = await processAdminEmail(email);
    results.push(result);
  }
  
  // Summary report
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY REPORT');
  console.log('='.repeat(60));
  
  const complete = results.filter(r => r.status === 'complete');
  const created = results.filter(r => r.status === 'created');
  const notRegistered = results.filter(r => r.status === 'not_registered');
  const failed = results.filter(r => r.status === 'failed');
  
  console.log(`\n✅ Complete (profile exists):     ${complete.length}`);
  complete.forEach(r => console.log(`   - ${r.email}`));
  
  console.log(`\n🔨 Created (profile was missing): ${created.length}`);
  created.forEach(r => console.log(`   - ${r.email}`));
  
  console.log(`\n⚠️  Not Registered (no auth):     ${notRegistered.length}`);
  notRegistered.forEach(r => console.log(`   - ${r.email}`));
  
  console.log(`\n❌ Failed (error occurred):       ${failed.length}`);
  failed.forEach(r => console.log(`   - ${r.email}`));
  
  console.log('\n' + '='.repeat(60));
  
  if (notRegistered.length > 0) {
    console.log('\n💡 Action Required:');
    console.log('   Users marked as "Not Registered" need to sign up through the app first.');
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️  Warning:');
    console.log('   Some profiles could not be created. Check error messages above.');
    process.exit(1);
  }
  
  if (complete.length + created.length === adminEmails.length) {
    console.log('\n🎉 All admin profiles are ready!');
  }
}

main().catch(err => {
  console.error('\n❌ Fatal Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
