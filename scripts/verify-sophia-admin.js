/**
 * Verify Sophia Admin Configuration
 * 
 * This script verifies that sophiareignsacademy@gmail.com is properly configured as admin
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SOPHIA_EMAIL = 'sophiareignsacademy@gmail.com';

function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

function redactEmail(email) {
  const parts = email.split('@');
  if (parts.length !== 2) return '[invalid]';
  const localPart = parts[0];
  const domain = parts[1];
  return localPart.length > 3 
    ? `${localPart.substring(0, 3)}***@${domain}`
    : `***@${domain}`;
}

async function verifyAdmin() {
  console.log('='.repeat(60));
  console.log('Sophia Admin Verification');
  console.log('='.repeat(60));
  console.log('');

  // Check environment variable
  console.log('📋 Checking admin configuration...');
  const envAdminEmails = process.env.VITE_ADMIN_EMAILS;
  
  if (envAdminEmails) {
    const emails = envAdminEmails.split(',').map(e => e.trim());
    const normalized = normalizeEmail(SOPHIA_EMAIL);
    const isConfigured = emails.some(email => normalizeEmail(email) === normalized);
    
    if (isConfigured) {
      console.log(`✅ ${redactEmail(SOPHIA_EMAIL)} is configured as admin`);
      console.log(`   Total admins: ${emails.length}`);
      emails.forEach(email => {
        console.log(`   - ${redactEmail(email)}`);
      });
    } else {
      console.error(`❌ ${redactEmail(SOPHIA_EMAIL)} is NOT in admin configuration`);
      console.log('   Current admins:');
      emails.forEach(email => {
        console.log(`   - ${redactEmail(email)}`);
      });
      return false;
    }
  } else {
    console.error('❌ VITE_ADMIN_EMAILS not set');
    return false;
  }

  console.log('');

  // Check if user exists in auth
  console.log('📋 Checking auth.users table...');
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Error fetching users:', error.message);
    return false;
  }
  
  const normalized = normalizeEmail(SOPHIA_EMAIL);
  const user = data.users.find(u => normalizeEmail(u.email || '') === normalized);
  
  if (user) {
    console.log(`✅ User found in auth.users`);
    console.log(`   Email: ${redactEmail(user.email)}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
    console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
    console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
  } else {
    console.error(`❌ User not found in auth.users`);
    return false;
  }

  console.log('');

  // Check user profile
  console.log('📋 Checking user_profiles table...');
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (profileError) {
    console.error('❌ Profile not found:', profileError.message);
    return false;
  }
  
  if (profile) {
    console.log('✅ User profile found');
    console.log(`   Email: ${redactEmail(profile.email)}`);
    console.log(`   Full Name: ${profile.full_name || 'Not set'}`);
    console.log(`   Is Active: ${profile.is_active}`);
    console.log(`   Subscription: ${profile.subscription_plan}`);
    console.log(`   Last Login: ${profile.last_login ? new Date(profile.last_login).toLocaleString() : 'Never'}`);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('✅ All checks passed!');
  console.log(`${redactEmail(SOPHIA_EMAIL)} is properly configured as Super Admin`);
  console.log('='.repeat(60));
  
  return true;
}

verifyAdmin()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
