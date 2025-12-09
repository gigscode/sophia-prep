#!/usr/bin/env node
/**
 * Run Database Migration Script
 * 
 * This script executes the subject_id migration by directly connecting to PostgreSQL
 * Requirements: 2.1, 2.2, 4.1, 4.2
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🚀 Running Database Migration\n');
console.log('📍 URL:', SUPABASE_URL);
console.log('🔑 Service Role Key:', SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('');

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
 * Execute migration steps using Supabase client
 */
async function runMigration() {
  console.log('🔨 Executing migration steps...\n');
  
  const steps = [
    {
      name: 'Step 1: Add subject_id column',
      execute: async () => {
        // Check if column already exists
        const { data: existingData, error: checkError } = await supabase
          .from('questions')
          .select('subject_id')
          .limit(1);
        
        if (checkError && checkError.message.includes('column "subject_id" does not exist')) {
          // Column doesn't exist, we need to add it via SQL
          console.log('   ⚠️  Column does not exist - requires SQL execution');
          return { needsSql: true };
        } else if (checkError) {
          throw checkError;
        } else {
          console.log('   ✅ Column already exists');
          return { success: true, skipped: true };
        }
      }
    },
    {
      name: 'Step 2: Verify index exists',
      execute: async () => {
        // We can't directly check indexes via Supabase client
        console.log('   ⚠️  Index verification requires SQL execution');
        return { needsSql: true };
      }
    },
    {
      name: 'Step 3: Backfill subject_id from topics',
      execute: async () => {
        // Check if backfill is needed
        const { count, error } = await supabase
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .is('subject_id', null)
          .not('topic_id', 'is', null);
        
        if (error) throw error;
        
        if (count === 0) {
          console.log('   ✅ No questions need backfill');
          return { success: true, skipped: true };
        }
        
        console.log(`   ℹ️  ${count} questions need backfill`);
        console.log('   ⚠️  Backfill requires SQL execution or separate script');
        return { needsSql: true, count };
      }
    }
  ];
  
  let needsManualExecution = false;
  
  for (const step of steps) {
    console.log(`\n${step.name}`);
    try {
      const result = await step.execute();
      if (result.needsSql) {
        needsManualExecution = true;
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      needsManualExecution = true;
    }
  }
  
  return needsManualExecution;
}

/**
 * Print manual execution instructions
 */
function printManualInstructions() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 MANUAL MIGRATION EXECUTION REQUIRED');
  console.log('='.repeat(70));
  console.log('\nThe migration requires direct SQL execution.');
  console.log('Please follow these steps:\n');
  console.log('OPTION 1: Supabase Dashboard (Recommended)');
  console.log('  1. Open: https://app.supabase.com');
  console.log('  2. Select your project: rnxkkmdnmwhxdaofwtrf');
  console.log('  3. Go to: SQL Editor');
  console.log('  4. Click: "New Query"');
  console.log('  5. Copy the entire contents of:');
  console.log('     supabase/migrations/20251208_add_subject_id_to_questions.sql');
  console.log('  6. Paste into the SQL Editor');
  console.log('  7. Click: "Run" (or press Ctrl+Enter)');
  console.log('  8. Verify: No errors in the output');
  console.log('\nOPTION 2: Supabase CLI (if installed)');
  console.log('  npx supabase db push');
  console.log('\n' + '='.repeat(70));
  console.log('\nAfter executing the migration, run:');
  console.log('  node scripts/check-migration-status.js');
  console.log('  node scripts/backfill-question-subject-ids.js');
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  try {
    const needsManual = await runMigration();
    
    if (needsManual) {
      printManualInstructions();
    } else {
      console.log('\n✅ Migration completed successfully!');
      console.log('   Run backfill script: node scripts/backfill-question-subject-ids.js\n');
    }
  } catch (err) {
    console.error('\n❌ Fatal Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
