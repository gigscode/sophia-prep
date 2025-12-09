#!/usr/bin/env node
/**
 * Interactive Migration Script
 * 
 * Guides the user through the migration process step by step
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function checkMigrationStatus() {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('id, subject_id')
      .limit(1);
    
    if (error && error.message.includes('column "subject_id" does not exist')) {
      return { applied: false };
    } else if (error) {
      throw error;
    }
    
    return { applied: true };
  } catch (err) {
    return { applied: false, error: err.message };
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 INTERACTIVE DATABASE MIGRATION GUIDE');
  console.log('='.repeat(70));
  console.log('\nThis script will guide you through executing the database migration.');
  console.log('The migration adds a subject_id column to the questions table.\n');
  
  // Step 1: Check current status
  console.log('📊 Step 1: Checking current migration status...\n');
  const status = await checkMigrationStatus();
  
  if (status.applied) {
    console.log('✅ Migration already applied! subject_id column exists.\n');
    console.log('You can now run the backfill script:');
    console.log('  node scripts/backfill-question-subject-ids.js\n');
    rl.close();
    return;
  }
  
  console.log('❌ Migration NOT applied yet. subject_id column does not exist.\n');
  
  // Step 2: Provide instructions
  console.log('📋 Step 2: Execute Migration in Supabase Dashboard\n');
  console.log('Please follow these steps:\n');
  console.log('1. Open your browser and go to: https://app.supabase.com');
  console.log('2. Sign in and select project: rnxkkmdnmwhxdaofwtrf');
  console.log('3. Click "SQL Editor" in the left sidebar');
  console.log('4. Click "+ New Query"');
  console.log('5. Open this file in your editor:');
  console.log('   supabase/migrations/20251208_add_subject_id_to_questions.sql');
  console.log('6. Copy ALL contents (Ctrl+A, Ctrl+C)');
  console.log('7. Paste into Supabase SQL Editor (Ctrl+V)');
  console.log('8. Click "Run" button (or press Ctrl+Enter)');
  console.log('9. Wait for completion and check for success message\n');
  console.log('='.repeat(70));
  
  // Step 3: Wait for user confirmation
  const answer = await question('\nHave you executed the migration? (yes/no): ');
  
  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('\n⏸️  Migration not executed. Please run this script again after executing.\n');
    rl.close();
    return;
  }
  
  // Step 4: Verify migration was applied
  console.log('\n🔍 Verifying migration was applied...\n');
  const verifyStatus = await checkMigrationStatus();
  
  if (!verifyStatus.applied) {
    console.log('❌ Migration verification failed. subject_id column still does not exist.\n');
    console.log('Please check:');
    console.log('  - Did the SQL execute without errors?');
    console.log('  - Did you copy the entire migration file?');
    console.log('  - Are you connected to the correct database?\n');
    console.log('Try running the migration again, or check the Supabase logs.\n');
    rl.close();
    return;
  }
  
  console.log('✅ Migration verified! subject_id column exists.\n');
  
  // Step 5: Run backfill
  console.log('📊 Step 3: Running backfill script...\n');
  console.log('The backfill script will populate subject_id for existing questions.\n');
  
  const runBackfill = await question('Run backfill script now? (yes/no): ');
  
  if (runBackfill.toLowerCase() === 'yes' || runBackfill.toLowerCase() === 'y') {
    console.log('\n🔄 Running backfill...\n');
    console.log('Please run: node scripts/backfill-question-subject-ids.js\n');
  } else {
    console.log('\n⏸️  Backfill skipped. Run it manually later:');
    console.log('  node scripts/backfill-question-subject-ids.js\n');
  }
  
  console.log('='.repeat(70));
  console.log('✅ MIGRATION COMPLETE!');
  console.log('='.repeat(70));
  console.log('\nNext steps:');
  console.log('  1. Run backfill: node scripts/backfill-question-subject-ids.js');
  console.log('  2. Verify: node scripts/check-migration-status.js');
  console.log('  3. Mark task 8 as complete');
  console.log('  4. Proceed to task 9: Checkpoint\n');
  
  rl.close();
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  rl.close();
  process.exit(1);
});
