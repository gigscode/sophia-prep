#!/usr/bin/env node
/**
 * Database Setup Script
 * 
 * This script:
 * 1. Reads schema.sql and seed.sql files
 * 2. Executes them against Supabase database
 * 3. Verifies tables and data were created
 * 
 * Usage: node scripts/setup-database.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
console.log(`📍 URL: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function executeSQLFile(filePath, description) {
  console.log(`\n📄 Reading ${description}...`);
  
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`);
    return false;
  }

  const sql = fs.readFileSync(fullPath, 'utf-8');
  console.log(`✅ Loaded ${description} (${sql.length} characters)`);
  
  console.log(`🚀 Executing ${description}...`);
  
  try {
    // Execute SQL using Supabase RPC or direct query
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async (err) => {
      // If RPC doesn't exist, try direct query
      console.log('⚠️  RPC method not available, trying direct query...');
      return await supabase.from('_sql').select('*').limit(0); // This won't work, we need another approach
    });

    if (error) {
      console.error(`❌ Error executing ${description}:`, error.message);
      return false;
    }

    console.log(`✅ Successfully executed ${description}`);
    return true;
  } catch (err) {
    console.error(`❌ Exception executing ${description}:`, err.message);
    return false;
  }
}

async function verifySetup() {
  console.log('\n🔍 Verifying database setup...\n');

  // Check tables
  console.log('📊 Checking tables...');
  const { data: tables, error: tablesError } = await supabase
    .from('subjects')
    .select('count', { count: 'exact', head: true });

  if (tablesError) {
    console.error('❌ Error checking tables:', tablesError.message);
    return false;
  }

  // Check subjects count
  const { count: subjectsCount, error: subjectsError } = await supabase
    .from('subjects')
    .select('*', { count: 'exact', head: true });

  if (!subjectsError) {
    console.log(`✅ Subjects table: ${subjectsCount} records`);
  }

  // Check subscription plans count
  const { count: plansCount, error: plansError } = await supabase
    .from('subscription_plans')
    .select('*', { count: 'exact', head: true });

  if (!plansError) {
    console.log(`✅ Subscription plans table: ${plansCount} records`);
  }

  // Check coupon codes count
  const { count: couponsCount, error: couponsError } = await supabase
    .from('coupon_codes')
    .select('*', { count: 'exact', head: true });

  if (!couponsError) {
    console.log(`✅ Coupon codes table: ${couponsCount} records`);
  }

  console.log('\n✅ Database verification complete!');
  return true;
}

async function main() {
  console.log('🎯 Starting database setup...\n');

  // Note: Supabase client library doesn't support executing raw SQL directly
  // We need to use the Supabase Dashboard SQL Editor or CLI
  console.log('⚠️  IMPORTANT: This script cannot execute raw SQL files directly.');
  console.log('📝 Please follow these steps:\n');
  console.log('1. Open Supabase Dashboard: https://app.supabase.com');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste contents of: supabase/schema.sql');
  console.log('4. Execute the schema');
  console.log('5. Copy and paste contents of: supabase/seed.sql');
  console.log('6. Execute the seed data\n');
  console.log('After completing these steps, run this script again to verify.\n');

  // Check if tables already exist
  console.log('🔍 Checking if database is already set up...\n');
  
  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('count', { count: 'exact', head: true });

  if (!error) {
    console.log('✅ Database appears to be set up! Running verification...');
    await verifySetup();
  } else {
    console.log('❌ Database not set up yet. Please follow the steps above.');
    console.log(`Error: ${error.message}`);
  }
}

main().catch(console.error);

