#!/usr/bin/env node
/**
 * Verify Supabase Connection
 * Tests connection and checks database state
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Connection Test\n');
console.log('📍 URL:', SUPABASE_URL);
console.log('🔑 Anon Key:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NOT SET');
console.log('');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTable(tableName, expectedCount = null) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
      return false;
    }

    const status = expectedCount !== null && count >= expectedCount ? '✅' : '⚠️';
    console.log(`${status} ${tableName}: ${count} records${expectedCount ? ` (expected: ${expectedCount})` : ''}`);
    return true;
  } catch (err) {
    console.log(`❌ ${tableName}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Checking database tables...\n');

  const tables = [
    { name: 'subjects', expected: 21 },
    { name: 'topics', expected: 0 },
    { name: 'questions', expected: 0 },
    { name: 'subscription_plans', expected: 6 },
    { name: 'coupon_codes', expected: 3 },
    { name: 'user_profiles', expected: 0 },
    { name: 'quiz_attempts', expected: 0 },
    { name: 'study_materials', expected: 0 },
    { name: 'user_progress', expected: 0 },
    { name: 'notifications', expected: 0 },
    { name: 'study_targets', expected: 0 },
    { name: 'mock_exam_sessions', expected: 0 },
    { name: 'user_subscriptions', expected: 0 },
    { name: 'payments', expected: 0 },
    { name: 'subject_combinations', expected: 0 }
  ];

  let allExist = true;
  for (const table of tables) {
    const exists = await checkTable(table.name, table.expected);
    if (!exists) allExist = false;
  }

  console.log('');
  if (allExist) {
    console.log('✅ All tables exist and are accessible!');
    console.log('✅ Database is ready for data import.');
  } else {
    console.log('❌ Some tables are missing or inaccessible.');
    console.log('📝 Please run schema.sql and seed.sql in Supabase Dashboard.');
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

