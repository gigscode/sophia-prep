#!/usr/bin/env node
/**
 * Execute Migration Directly
 * 
 * This script attempts to execute the migration by making direct API calls
 * to Supabase's PostgREST API and using available query methods.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🚀 Attempting Direct Migration Execution\n');

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

/**
 * Execute raw SQL using Supabase RPC
 * Note: This requires a custom RPC function to be created in Supabase
 */
async function executeRawSql(sql) {
  try {
    // Try to use the rpc method if available
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        return { 
          success: false, 
          needsManualExecution: true,
          error: 'RPC function not available - requires manual execution'
        };
      }
      throw error;
    }
    
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('⚠️  IMPORTANT: Supabase JavaScript client does not support direct SQL execution.\n');
  console.log('The migration MUST be executed manually via Supabase Dashboard.\n');
  console.log('Please follow these steps:\n');
  console.log('='.repeat(70));
  console.log('STEP-BY-STEP INSTRUCTIONS:');
  console.log('='.repeat(70));
  console.log('\n1. Open your browser and go to: https://app.supabase.com\n');
  console.log('2. Sign in to your Supabase account\n');
  console.log('3. Select your project: rnxkkmdnmwhxdaofwtrf\n');
  console.log('4. In the left sidebar, click on: "SQL Editor"\n');
  console.log('5. Click the "+ New Query" button\n');
  console.log('6. In your code editor, open the file:');
  console.log('   supabase/migrations/20251208_add_subject_id_to_questions.sql\n');
  console.log('7. Select ALL the contents of that file (Ctrl+A) and copy (Ctrl+C)\n');
  console.log('8. Go back to Supabase Dashboard and paste (Ctrl+V) into the SQL Editor\n');
  console.log('9. Click the "Run" button (or press Ctrl+Enter)\n');
  console.log('10. Wait for the query to complete (should take a few seconds)\n');
  console.log('11. Check the output panel at the bottom for any errors\n');
  console.log('12. If successful, you should see "Success. No rows returned"\n');
  console.log('='.repeat(70));
  console.log('\nAfter executing the migration in Supabase Dashboard, return here and run:\n');
  console.log('  node scripts/check-migration-status.js\n');
  console.log('This will verify that the migration was applied successfully.\n');
  console.log('Then run:\n');
  console.log('  node scripts/backfill-question-subject-ids.js\n');
  console.log('This will populate the subject_id for all existing questions.\n');
  console.log('='.repeat(70));
  console.log('\n📋 Quick Reference:');
  console.log('   Dashboard: https://app.supabase.com');
  console.log('   Project ID: rnxkkmdnmwhxdaofwtrf');
  console.log('   Migration File: supabase/migrations/20251208_add_subject_id_to_questions.sql');
  console.log('   Verify: node scripts/check-migration-status.js');
  console.log('   Backfill: node scripts/backfill-question-subject-ids.js\n');
}

main();
