#!/usr/bin/env node
/**
 * Diagnose Migration Error
 * 
 * Checks why the migration might be failing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🔍 Diagnosing Migration Error\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnose() {
  console.log('1. Checking if subjects table exists...\n');
  
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing subjects table:', error.message);
      console.log('   Error code:', error.code);
      console.log('   Error details:', JSON.stringify(error.details, null, 2));
    } else {
      console.log('✅ subjects table exists and is accessible');
      console.log('   Sample data:', data);
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
  
  console.log('\n2. Checking questions table structure...\n');
  
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else if (data && data.length > 0) {
      console.log('✅ questions table exists');
      console.log('   Current columns:', Object.keys(data[0]).join(', '));
      console.log('   Has subject_id?', 'subject_id' in data[0]);
      console.log('   Has topic_id?', 'topic_id' in data[0]);
    } else {
      console.log('✅ questions table exists but is empty');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
  
  console.log('\n3. Checking topics table and subject_id relationship...\n');
  
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('id, subject_id, name')
      .limit(3);
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ topics table exists');
      console.log('   Sample topics:');
      data.forEach(topic => {
        console.log(`   - ${topic.name} (subject_id: ${topic.subject_id})`);
      });
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
  
  console.log('\n4. Checking if we can query subjects by ID...\n');
  
  try {
    // Get a subject_id from topics
    const { data: topics } = await supabase
      .from('topics')
      .select('subject_id')
      .limit(1);
    
    if (topics && topics.length > 0) {
      const subjectId = topics[0].subject_id;
      console.log(`   Testing with subject_id: ${subjectId}`);
      
      const { data: subject, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .single();
      
      if (error) {
        console.log('❌ Error querying subject:', error.message);
      } else {
        console.log('✅ Can query subjects by ID');
        console.log('   Subject:', subject.name);
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
  
  console.log('\n5. Possible issues and solutions:\n');
  console.log('If the migration failed with "relation subjects does not exist":');
  console.log('');
  console.log('POSSIBLE CAUSE 1: Schema/Search Path Issue');
  console.log('  - The migration might be running in a different schema');
  console.log('  - Solution: Ensure all table references use public. prefix');
  console.log('');
  console.log('POSSIBLE CAUSE 2: RLS Policies');
  console.log('  - Row Level Security might be blocking the migration');
  console.log('  - Solution: Run migration as service_role or disable RLS temporarily');
  console.log('');
  console.log('POSSIBLE CAUSE 3: Migration Context');
  console.log('  - The SQL Editor might be running in a restricted context');
  console.log('  - Solution: Try running via Supabase CLI or psql');
  console.log('');
  console.log('RECOMMENDED FIX:');
  console.log('  Try running the migration in smaller steps:');
  console.log('  1. Just add the column first');
  console.log('  2. Then create the index');
  console.log('  3. Then run backfill');
  console.log('  4. Then modify constraints');
  console.log('');
}

diagnose()
  .then(() => {
    console.log('✅ Diagnosis complete\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  });
