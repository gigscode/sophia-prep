#!/usr/bin/env node
/**
 * User Profile Sync Migration Script
 * 
 * This script identifies all auth.users without corresponding user_profiles records
 * and creates missing profiles. It's designed to be idempotent and can be run
 * multiple times safely.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🔄 User Profile Sync Migration Script\n');
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
  return email ? email.toLowerCase().trim() : '';
};

/**
 * Get all users from auth.users
 */
async function getAllAuthUsers() {
  try {
    console.log('🔍 Fetching all users from auth.users...');
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`);
    }
    
    console.log(`   ✅ Found ${data.users.length} users in auth.users`);
    return data.users;
  } catch (err) {
    console.error(`   ❌ Error fetching auth users: ${err.message}`);
    throw err;
  }
}

/**
 * Get all existing user profiles
 */
async function getAllUserProfiles() {
  try {
    console.log('🔍 Fetching all user profiles...');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id');
    
    if (error) {
      throw new Error(`Failed to fetch user profiles: ${error.message}`);
    }
    
    console.log(`   ✅ Found ${data.length} existing profiles`);
    return new Set(data.map(profile => profile.id));
  } catch (err) {
    console.error(`   ❌ Error fetching user profiles: ${err.message}`);
    throw err;
  }
}

/**
 * Identify users without profiles (LEFT JOIN WHERE user_profiles.id IS NULL)
 */
async function identifyMissingProfiles(authUsers, existingProfileIds) {
  console.log('\n🔍 Identifying users without profiles...');
  
  const missingUsers = authUsers.filter(user => !existingProfileIds.has(user.id));
  
  console.log(`   ✅ Found ${missingUsers.length} users without profiles`);
  
  if (missingUsers.length > 0) {
    console.log('\n   Missing profiles for:');
    missingUsers.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id})`);
    });
  }
  
  return missingUsers;
}

/**
 * Create a user_profiles record for a user
 */
async function createUserProfile(user) {
  try {
    const profileData = {
      id: user.id,
      email: normalizeEmail(user.email),
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      phone_number: user.user_metadata?.phone_number || null,
      exam_type: user.user_metadata?.exam_type || null,
      target_exam_date: user.user_metadata?.target_exam_date || null,
      preferred_subjects: user.user_metadata?.preferred_subjects || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      bio: user.user_metadata?.bio || null,
      is_active: true,
      last_login: user.last_sign_in_at || user.created_at || new Date().toISOString(),
      subscription_plan: 'Free',
      created_at: user.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (error) {
      // Check if it's a duplicate key error (profile already exists)
      if (error.code === '23505') {
        console.log(`   ⚠️  Profile already exists for ${user.email} (skipped)`);
        return { success: true, skipped: true };
      }
      throw new Error(error.message);
    }
    
    console.log(`   ✅ Created profile for ${user.email}`);
    return { success: true, skipped: false };
  } catch (err) {
    console.error(`   ❌ Failed to create profile for ${user.email}: ${err.message}`);
    return { success: false, error: err.message, userId: user.id, email: user.email };
  }
}

/**
 * Process all missing profiles
 */
async function processMissingProfiles(missingUsers) {
  if (missingUsers.length === 0) {
    console.log('\n✅ No missing profiles to create!');
    return { created: 0, skipped: 0, errors: [] };
  }
  
  console.log(`\n🔨 Creating ${missingUsers.length} missing profiles...\n`);
  
  let created = 0;
  let skipped = 0;
  const errors = [];
  
  for (const user of missingUsers) {
    const result = await createUserProfile(user);
    
    if (result.success) {
      if (result.skipped) {
        skipped++;
      } else {
        created++;
      }
    } else {
      errors.push({
        userId: result.userId,
        email: result.email,
        error: result.error
      });
    }
  }
  
  return { created, skipped, errors };
}

/**
 * Print summary report
 */
function printSummary(totalUsers, existingProfiles, missingCount, created, skipped, errors) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 MIGRATION SUMMARY REPORT');
  console.log('='.repeat(70));
  console.log(`\n📈 Statistics:`);
  console.log(`   Total users in auth.users:        ${totalUsers}`);
  console.log(`   Existing profiles (before):       ${existingProfiles}`);
  console.log(`   Missing profiles (identified):    ${missingCount}`);
  console.log(`   Profiles created:                 ${created}`);
  console.log(`   Profiles skipped (already exist): ${skipped}`);
  console.log(`   Errors encountered:               ${errors.length}`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors:`);
    errors.forEach(err => {
      console.log(`   - User: ${err.email} (${err.userId})`);
      console.log(`     Error: ${err.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (errors.length === 0 && created + skipped === missingCount) {
    console.log('✅ Migration completed successfully!');
    console.log('✅ All users now have profiles.');
  } else if (errors.length > 0) {
    console.log('⚠️  Migration completed with errors.');
    console.log(`   ${created} profiles created, but ${errors.length} failed.`);
    console.log('   Review errors above and retry if needed.');
  } else {
    console.log('✅ Migration completed!');
  }
  
  console.log('');
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Step 1: Get all auth users
    const authUsers = await getAllAuthUsers();
    
    // Step 2: Get all existing profiles
    const existingProfileIds = await getAllUserProfiles();
    
    // Step 3: Identify missing profiles (LEFT JOIN WHERE user_profiles.id IS NULL)
    const missingUsers = await identifyMissingProfiles(authUsers, existingProfileIds);
    
    // Step 4: Create missing profiles with error handling
    const { created, skipped, errors } = await processMissingProfiles(missingUsers);
    
    // Step 5: Print summary report
    printSummary(
      authUsers.length,
      existingProfileIds.size,
      missingUsers.length,
      created,
      skipped,
      errors
    );
    
    // Exit with error code if there were failures
    if (errors.length > 0) {
      process.exit(1);
    }
    
  } catch (err) {
    console.error('\n❌ Fatal Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run the migration
main();
