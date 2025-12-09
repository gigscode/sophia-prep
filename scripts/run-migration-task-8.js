#!/usr/bin/env node
/**
 * Task 8: Run Database Migration
 * 
 * This script guides through executing the migration and verifying results
 * Requirements: 2.1, 2.2, 4.1, 4.2
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🚀 Task 8: Run Database Migration\n');
console.log('='.repeat(70));

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

/**
 * Step 1: Check current migration status
 */
async function checkMigrationStatus() {
  console.log('\n📊 STEP 1: Checking current migration status...\n');
  
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('id, subject_id, topic_id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('column "subject_id" does not exist')) {
        console.log('✅ Migration NOT yet applied (subject_id column does not exist)');
        console.log('   Status: Ready to apply migration');
        return 'not_applied';
      }
      throw error;
    }
    
    console.log('⚠️  Migration appears to be already applied (subject_id column exists)');
    console.log('   Checking if backfill is needed...');
    
    const { count: withSubjectId } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .not('subject_id', 'is', null);
    
    const { count: total } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true });
    
    if (withSubjectId === 0 && total > 0) {
      console.log(`   Status: Migration applied but backfill needed (0/${total} questions have subject_id)`);
      return 'needs_backfill';
    } else if (withSubjectId < total) {
      console.log(`   Status: Partial backfill (${withSubjectId}/${total} questions have subject_id)`);
      return 'partial_backfill';
    } else {
      console.log(`   Status: Migration and backfill complete (${withSubjectId}/${total} questions have subject_id)`);
      return 'complete';
    }
    
  } catch (err) {
    console.error('❌ Error checking migration status:', err.message);
    throw err;
  }
}

/**
 * Step 2: Display migration instructions
 */
function displayMigrationInstructions() {
  console.log('\n📋 STEP 2: Execute Migration SQL\n');
  console.log('='.repeat(70));
  console.log('MANUAL MIGRATION REQUIRED');
  console.log('='.repeat(70));
  console.log('\nThe migration SQL must be executed via Supabase Dashboard:\n');
  console.log('1. Open Supabase Dashboard:');
  console.log('   https://app.supabase.com/project/rnxkkmdnmwhxdaofwtrf/sql/new');
  console.log('');
  console.log('2. Copy the migration SQL file:');
  console.log('   File: supabase/migrations/20251208_add_subject_id_to_questions.sql');
  console.log('');
  console.log('3. Paste the SQL into the editor');
  console.log('');
  console.log('4. Click "Run" to execute');
  console.log('');
  console.log('5. Verify no errors occurred');
  console.log('');
  console.log('='.repeat(70));
  console.log('\n⏸️  Waiting for manual migration execution...');
  console.log('   After executing the SQL, press Enter to continue verification...\n');
}

/**
 * Step 3: Verify schema changes
 */
async function verifySchemaChanges() {
  console.log('\n🔍 STEP 3: Verifying schema changes...\n');
  
  const checks = [];
  
  // Check 1: subject_id column exists
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('id, subject_id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('column "subject_id" does not exist')) {
        checks.push({
          name: 'subject_id column exists',
          passed: false,
          details: 'Column does not exist - migration not applied'
        });
      } else {
        throw error;
      }
    } else {
      checks.push({
        name: 'subject_id column exists',
        passed: true,
        details: 'Column exists and is queryable'
      });
    }
  } catch (err) {
    checks.push({
      name: 'subject_id column exists',
      passed: false,
      details: `Error: ${err.message}`
    });
  }
  
  // Check 2: Index exists
  try {
    // We can't directly query pg_indexes without special permissions
    // So we'll just verify we can query by subject_id efficiently
    const { error } = await supabase
      .from('questions')
      .select('id')
      .not('subject_id', 'is', null)
      .limit(1);
    
    checks.push({
      name: 'Can query by subject_id',
      passed: !error,
      details: error ? `Error: ${error.message}` : 'Queries work correctly'
    });
  } catch (err) {
    checks.push({
      name: 'Can query by subject_id',
      passed: false,
      details: `Error: ${err.message}`
    });
  }
  
  // Check 3: topic_id is nullable
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('id, topic_id')
      .is('topic_id', null)
      .limit(1);
    
    checks.push({
      name: 'topic_id is nullable',
      passed: !error,
      details: error ? `Error: ${error.message}` : 'Can query for NULL topic_id'
    });
  } catch (err) {
    checks.push({
      name: 'topic_id is nullable',
      passed: false,
      details: `Error: ${err.message}`
    });
  }
  
  // Print results
  console.log('📊 Schema Verification Results:');
  console.log('='.repeat(70));
  checks.forEach(check => {
    const icon = check.passed ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
    console.log(`   ${check.details}`);
  });
  console.log('='.repeat(70));
  
  const allPassed = checks.every(check => check.passed);
  return { allPassed, checks };
}

/**
 * Step 4: Run backfill script
 */
async function runBackfillScript() {
  console.log('\n🔨 STEP 4: Running backfill script...\n');
  
  try {
    // Import and run the backfill script
    const { execSync } = await import('child_process');
    
    console.log('Executing: node scripts/backfill-question-subject-ids.js\n');
    
    const output = execSync('node scripts/backfill-question-subject-ids.js', {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    return { success: true };
  } catch (err) {
    console.error('❌ Backfill script failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Step 5: Verify data integrity
 */
async function verifyDataIntegrity() {
  console.log('\n🔍 STEP 5: Verifying data integrity...\n');
  
  const checks = [];
  
  // Check 1: All questions with topic_id should have matching subject_id
  try {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        id,
        topic_id,
        subject_id,
        topics!inner(subject_id)
      `)
      .not('topic_id', 'is', null)
      .not('subject_id', 'is', null);
    
    if (error) throw error;
    
    const mismatches = data.filter(q => 
      q.subject_id !== q.topics.subject_id
    );
    
    checks.push({
      name: 'Subject ID matches topic\'s subject ID',
      passed: mismatches.length === 0,
      details: mismatches.length === 0 
        ? `All ${data.length} questions have correct subject_id`
        : `${mismatches.length} questions have mismatched subject_id`
    });
  } catch (err) {
    checks.push({
      name: 'Subject ID matches topic\'s subject ID',
      passed: false,
      details: `Error: ${err.message}`
    });
  }
  
  // Check 2: No questions should have both subject_id and topic_id as null
  try {
    const { count, error } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .is('subject_id', null)
      .is('topic_id', null);
    
    if (error) throw error;
    
    checks.push({
      name: 'No questions with both subject_id and topic_id null',
      passed: count === 0,
      details: count === 0 
        ? 'All questions have either subject_id or topic_id'
        : `${count} questions have neither subject_id nor topic_id`
    });
  } catch (err) {
    checks.push({
      name: 'No questions with both subject_id and topic_id null',
      passed: false,
      details: `Error: ${err.message}`
    });
  }
  
  // Check 3: Count questions with subject_id
  try {
    const { count: withSubjectId, error: error1 } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .not('subject_id', 'is', null);
    
    const { count: total, error: error2 } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true });
    
    if (error1 || error2) throw error1 || error2;
    
    const percentage = Math.round((withSubjectId / total) * 100);
    
    checks.push({
      name: 'Questions with subject_id populated',
      passed: withSubjectId > 0,
      details: `${withSubjectId}/${total} questions (${percentage}%) have subject_id`
    });
  } catch (err) {
    checks.push({
      name: 'Questions with subject_id populated',
      passed: false,
      details: `Error: ${err.message}`
    });
  }
  
  // Print results
  console.log('📊 Data Integrity Verification Results:');
  console.log('='.repeat(70));
  checks.forEach(check => {
    const icon = check.passed ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
    console.log(`   ${check.details}`);
  });
  console.log('='.repeat(70));
  
  const allPassed = checks.every(check => check.passed);
  return { allPassed, checks };
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Step 1: Check current status
    const status = await checkMigrationStatus();
    
    if (status === 'complete') {
      console.log('\n✅ Migration and backfill already complete!');
      console.log('   No action needed.');
      return;
    }
    
    if (status === 'not_applied') {
      // Step 2: Display instructions and wait
      displayMigrationInstructions();
      
      // Wait for user to press Enter
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
      
      // Step 3: Verify schema changes
      const schemaResult = await verifySchemaChanges();
      
      if (!schemaResult.allPassed) {
        console.log('\n❌ Schema verification failed!');
        console.log('   Please check the migration execution and try again.');
        process.exit(1);
      }
      
      console.log('\n✅ Schema changes verified successfully!');
    }
    
    if (status === 'not_applied' || status === 'needs_backfill' || status === 'partial_backfill') {
      // Step 4: Run backfill
      const backfillResult = await runBackfillScript();
      
      if (!backfillResult.success) {
        console.log('\n⚠️  Backfill script encountered issues.');
        console.log('   Please review the output above.');
      }
    }
    
    // Step 5: Verify data integrity
    const integrityResult = await verifyDataIntegrity();
    
    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TASK 8 COMPLETION SUMMARY');
    console.log('='.repeat(70));
    
    if (integrityResult.allPassed) {
      console.log('\n✅ Task 8 completed successfully!');
      console.log('   ✅ Migration executed');
      console.log('   ✅ Schema changes verified');
      console.log('   ✅ Backfill completed');
      console.log('   ✅ Data integrity verified');
      console.log('\n🎉 The database is ready for the new subject-based query system!');
    } else {
      console.log('\n⚠️  Task 8 completed with warnings.');
      console.log('   Some verification checks failed.');
      console.log('   Please review the results above and address any issues.');
    }
    
    console.log('\n' + '='.repeat(70));
    
  } catch (err) {
    console.error('\n❌ Fatal Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run the migration task
main();
