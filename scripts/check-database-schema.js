#!/usr/bin/env node
/**
 * Check Database Schema
 * 
 * Inspects the database to find the correct table names and structure
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🔍 Checking Database Schema\n');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSchema() {
  console.log('📊 Checking for tables...\n');
  
  // Check for questions table
  try {
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('*')
      .limit(1);
    
    if (qError) {
      console.log('❌ questions table:', qError.message);
    } else {
      console.log('✅ questions table exists');
      if (questions && questions.length > 0) {
        console.log('   Columns:', Object.keys(questions[0]).join(', '));
      }
    }
  } catch (err) {
    console.log('❌ questions table error:', err.message);
  }
  
  // Check for subjects table (might be named differently)
  const possibleNames = ['subjects', 'subject', 'exam_subjects', 'quiz_subjects'];
  
  for (const tableName of possibleNames) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`✅ ${tableName} table exists`);
        if (data && data.length > 0) {
          console.log(`   Columns:`, Object.keys(data[0]).join(', '));
        }
      }
    } catch (err) {
      // Table doesn't exist, continue
    }
  }
  
  // Check for topics table
  try {
    const { data: topics, error: tError } = await supabase
      .from('topics')
      .select('*')
      .limit(1);
    
    if (tError) {
      console.log('❌ topics table:', tError.message);
    } else {
      console.log('✅ topics table exists');
      if (topics && topics.length > 0) {
        console.log('   Columns:', Object.keys(topics[0]).join(', '));
      }
    }
  } catch (err) {
    console.log('❌ topics table error:', err.message);
  }
  
  console.log('\n📊 Checking relationships...\n');
  
  // Check if topics has subject_id
  try {
    const { data: topics } = await supabase
      .from('topics')
      .select('id, subject_id, name')
      .limit(1);
    
    if (topics && topics.length > 0) {
      console.log('✅ topics.subject_id exists');
      console.log('   Sample topic:', topics[0]);
    }
  } catch (err) {
    console.log('⚠️  Could not check topics.subject_id');
  }
}

checkSchema()
  .then(() => {
    console.log('\n✅ Schema check complete\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  });
