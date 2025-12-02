#!/usr/bin/env node
/**
 * Verify User Profiles
 * Confirms all auth users have corresponding user_profiles records
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🔍 User Profile Verification\n');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  try {
    // Get all auth users
    console.log('📊 Fetching auth users...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to list auth users: ${authError.message}`);
    }
    
    const authUsers = authData.users;
    console.log(`   ✅ Found ${authUsers.length} users in auth.users\n`);
    
    // Get all user profiles
    console.log('📊 Fetching user profiles...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, subscription_plan, is_active');
    
    if (profileError) {
      throw new Error(`Failed to fetch user profiles: ${profileError.message}`);
    }
    
    console.log(`   ✅ Found ${profiles.length} user profiles\n`);
    
    // Create a set of profile IDs for quick lookup
    const profileIds = new Set(profiles.map(p => p.id));
    
    // Check for missing profiles
    const missingProfiles = authUsers.filter(user => !profileIds.has(user.id));
    
    console.log('='.repeat(70));
    console.log('📋 VERIFICATION RESULTS');
    console.log('='.repeat(70));
    console.log(`\nTotal auth users:     ${authUsers.length}`);
    console.log(`Total user profiles:  ${profiles.length}`);
    console.log(`Missing profiles:     ${missingProfiles.length}\n`);
    
    if (missingProfiles.length === 0) {
      console.log('✅ SUCCESS: All users have profiles!');
      console.log('✅ Database is in a consistent state.\n');
      
      // Show sample profiles
      console.log('📝 Sample profiles:');
      profiles.slice(0, 5).forEach(profile => {
        console.log(`   - ${profile.email} (${profile.subscription_plan}, active: ${profile.is_active})`);
      });
      if (profiles.length > 5) {
        console.log(`   ... and ${profiles.length - 5} more`);
      }
    } else {
      console.log('❌ WARNING: Some users are missing profiles!\n');
      console.log('Missing profiles for:');
      missingProfiles.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
      console.log('\n💡 Run: node scripts/sync-user-profiles.js');
    }
    
    console.log('');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

main();
