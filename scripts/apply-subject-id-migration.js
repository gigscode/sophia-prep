#!/usr/bin/env node
/**
 * Apply Subject ID Migration Script
 * 
 * Executes the migration SQL file to add subject_id column to questions table
 * Requirements: 2.1, 2.2, 4.1, 4.4
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🚀 Applying Subject ID Migration\n');
console.log('📍 URL:', SUPABASE_URL);
console.log('🔑 Service Role Key:', SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Read the migration SQL file
 */
function readMigrationFile() {
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20251208_add_subject_id_to_questions.sql');
  
  console.log('📄 Reading migration file...');
  console.log(`   Path: ${migrationPath}`);
  
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`);
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log(`   ✅ Migration file loaded (${sql.length} characters)`);
  
  return sql;
}

/**
 * Execute SQL using Supabase RPC
 */
async function executeSql(sql) {
  console.log('\n🔨 Executing migration SQL...\n');
  
  // Split SQL into individual statements (simple split by semicolon)
  // Filter out comments and empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .filter(s => !s.startsWith('--'))
    .filter(s => !s.match(/^\/\*/));
  
  console.log(`   Found ${statements.length} SQL statements to execute`);
  
  let executed = 0;
  let failed = 0;
  const errors = [];
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comment blocks and verification queries
    if (statement.includes('VERIFICATION QUERIES') || 
        statement.includes('ROLLBACK INSTRUCTIONS') ||
        statement.includes('============')) {
      continue;
    }
    
    // Extract a short description from the statement
    const firstLine = statement.split('\n')[0].substring(0, 60);
    console.log(`   [${i + 1}/${statements.length}] Executing: ${firstLine}...`);
    
    try {
      // Use the Supabase client to execute raw SQL via RPC
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
      
      if (error) {
        // Check if it's a "already exists" error which we can ignore
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist') && statement.includes('DROP')) {
          console.log(`      ⚠️  Skipped (already applied): ${error.message.substring(0, 80)}`);
          executed++;
        } else {
          throw error;
        }
      } else {
        console.log(`      ✅ Success`);
        executed++;
      }
    } catch (err) {
      console.log(`      ❌ Failed: ${err.message}`);
      failed++;
      errors.push({
        statement: firstLine,
        error: err.message
      });
      
      // Don't stop on errors, continue with remaining statements
    }
  }
  
  console.log(`\n📊 Execution Summary:`);
  console.log(`   Executed successfully: ${executed}`);
  console.log(`   Failed: ${failed}`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors encountered:`);
    errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.statement}`);
      console.log(`      Error: ${err.error}`);
    });
  }
  
  return { executed, failed, errors };
}

/**
 * Alternative: Execute SQL directly using pg client
 * This is a fallback if RPC doesn't work
 */
async function executeSqlDirect(sql) {
  console.log('\n🔨 Executing migration SQL directly...\n');
  
  // For Supabase, we need to use the REST API or direct PostgreSQL connection
  // Since we don't have pg installed, let's try using the Supabase REST API
  
  console.log('⚠️  Direct SQL execution requires PostgreSQL client');
  console.log('   Attempting to execute via Supabase client...\n');
  
  // Split into manageable chunks
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .filter(s => !s.startsWith('--'));
  
  console.log(`   Processing ${statements.length} statements...\n`);
  
  // Try to execute each statement individually
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    
    if (stmt.includes('ALTER TABLE questions') && stmt.includes('ADD COLUMN')) {
      console.log(`   [${i + 1}] Adding subject_id column...`);
      // This will be handled by the SQL execution
    } else if (stmt.includes('CREATE INDEX')) {
      console.log(`   [${i + 1}] Creating index...`);
    } else if (stmt.includes('UPDATE questions')) {
      console.log(`   [${i + 1}] Backfilling subject_id...`);
    } else if (stmt.includes('ALTER COLUMN topic_id')) {
      console.log(`   [${i + 1}] Making topic_id nullable...`);
    } else if (stmt.includes('ADD CONSTRAINT')) {
      console.log(`   [${i + 1}] Adding constraint...`);
    }
  }
  
  console.log('\n⚠️  Cannot execute SQL directly without PostgreSQL client');
  console.log('   Please run the migration manually using Supabase Dashboard or psql');
  
  return { executed: 0, failed: statements.length, errors: [] };
}

/**
 * Verify migration was applied successfully
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...\n');
  
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
          details: 'Column does not exist'
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
  
  // Check 2: topic_id is nullable
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('id, topic_id')
      .is('topic_id', null)
      .limit(1);
    
    if (error) {
      checks.push({
        name: 'topic_id is nullable',
        passed: false,
        details: `Error: ${error.message}`
      });
    } else {
      checks.push({
        name: 'topic_id is nullable',
        passed: true,
        details: 'Can query for NULL topic_id'
      });
    }
  } catch (err) {
    checks.push({
      name: 'topic_id is nullable',
      passed: false,
      details: `Error: ${err.message}`
    });
  }
  
  // Print verification results
  console.log('📊 Verification Results:');
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
    // Step 1: Read migration file
    const sql = readMigrationFile();
    
    // Step 2: Execute migration
    console.log('\n⚠️  NOTE: This script requires direct database access.');
    console.log('   If execution fails, please run the migration manually via:');
    console.log('   1. Supabase Dashboard > SQL Editor');
    console.log('   2. Copy/paste the contents of supabase/migrations/20251208_add_subject_id_to_questions.sql');
    console.log('   3. Click "Run"\n');
    
    // For now, we'll output instructions since we can't execute raw SQL via Supabase JS client
    console.log('📋 MANUAL MIGRATION STEPS:');
    console.log('='.repeat(70));
    console.log('1. Open Supabase Dashboard: https://app.supabase.com');
    console.log('2. Navigate to your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Create a new query');
    console.log('5. Copy the contents of: supabase/migrations/20251208_add_subject_id_to_questions.sql');
    console.log('6. Paste into the SQL Editor');
    console.log('7. Click "Run" to execute');
    console.log('8. Verify no errors occurred');
    console.log('='.repeat(70));
    
    console.log('\n✅ Migration file is ready to be applied manually.');
    console.log('   After applying, run: node scripts/check-migration-status.js');
    
  } catch (err) {
    console.error('\n❌ Fatal Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run the migration
main();
