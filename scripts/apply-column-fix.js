#!/usr/bin/env node

/**
 * Apply Column Fix Migration
 * 
 * This script applies the missing column fixes to the database.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Make sure you have VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('📋 Reading migration file...');
    const migrationSQL = readFileSync('supabase/migrations/20251215_fix_missing_columns.sql', 'utf8');
    
    console.log('🚀 Applying migration...');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return false;
    }
    
    console.log('✅ Migration applied successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    return false;
  }
}

async function main() {
  console.log('🔧 Applying database column fixes...\n');
  
  const success = await applyMigration();
  
  if (success) {
    console.log('\n🎉 Database fixes applied successfully!');
    console.log('The console errors should now be resolved.');
    console.log('\nYou can now:');
    console.log('1. Refresh your app');
    console.log('2. Try logging in again');
    console.log('3. The subscription and questions queries should work properly');
  } else {
    console.log('\n❌ Migration failed. Please:');
    console.log('1. Check your Supabase credentials');
    console.log('2. Ensure you have the service role key');
    console.log('3. Or manually run the SQL in Supabase Dashboard > SQL Editor');
  }
}

main().catch(console.error);