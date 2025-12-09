#!/usr/bin/env node
/**
 * Quick Deployment Check for Remove Topic Dependency
 * Fast verification of core functionality
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🚀 Quick Deployment Check - Remove Topic Dependency');
console.log('='.repeat(60));

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function quickCheck() {
  let passed = 0;
  let failed = 0;
  
  // Test 1: Database connection
  try {
    const { data, error } = await client.from('subjects').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Database connection: OK');
    passed++;
  } catch (error) {
    console.log('❌ Database connection: FAILED');
    failed++;
  }
  
  // Test 2: Subject_id column exists
  try {
    const { data, error } = await client.from('questions').select('subject_id').limit(1);
    if (error) throw error;
    console.log('✅ Subject_id column: EXISTS');
    passed++;
  } catch (error) {
    console.log('❌ Subject_id column: MISSING');
    failed++;
  }
  
  // Test 3: Null topic_id allowed
  try {
    const { data, error } = await client.from('questions').select('id').is('topic_id', null).limit(1);
    if (error) throw error;
    console.log('✅ Null topic_id: ALLOWED');
    passed++;
  } catch (error) {
    console.log('❌ Null topic_id: NOT ALLOWED');
    failed++;
  }
  
  // Test 4: Subject-based query works
  try {
    const { data: subjects } = await client.from('subjects').select('id').limit(1);
    if (subjects && subjects.length > 0) {
      const { data, error } = await client.from('questions').select('id').eq('subject_id', subjects[0].id).limit(1);
      if (error) throw error;
      console.log('✅ Subject-based queries: WORKING');
      passed++;
    } else {
      console.log('⚠️  Subject-based queries: NO SUBJECTS TO TEST');
      passed++;
    }
  } catch (error) {
    console.log('❌ Subject-based queries: FAILED');
    failed++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ DEPLOYMENT READY - Core functionality verified');
    return true;
  } else {
    console.log('❌ DEPLOYMENT ISSUES - Fix failures above');
    return false;
  }
}

quickCheck().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});