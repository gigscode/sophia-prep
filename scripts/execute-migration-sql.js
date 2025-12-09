#!/usr/bin/env node
/**
 * Execute Migration SQL via Supabase REST API
 * 
 * This script executes the migration SQL using Supabase's REST API
 * Requirements: 2.1, 2.2, 4.1, 4.4
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🚀 Executing Migration SQL\n');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

/**
 * Execute SQL via Supabase REST API
 */
async function executeSqlViaApi(sql) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const result = await response.json();
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Execute SQL statements one by one
 */
async function executeStatements() {
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20251208_add_subject_id_to_questions.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📄 Migration file loaded\n');
  
  // Split into individual statements
  const statements = [
    // Step 1: Add subject_id column
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;`,
    
    // Step 2: Create index
    `CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);`,
    
    // Step 3: Backfill subject_id
    `UPDATE questions q SET subject_id = t.subject_id FROM topics t WHERE q.topic_id = t.id AND q.subject_id IS NULL;`,
    
    // Step 4: Drop existing foreign key
    `ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_topic_id_fkey;`,
    
    // Step 5: Make topic_id nullable
    `ALTER TABLE questions ALTER COLUMN topic_id DROP NOT NULL;`,
    
    // Step 6: Re-add foreign key with ON DELETE SET NULL
    `ALTER TABLE questions ADD CONSTRAINT questions_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL;`,
    
    // Step 7: Add check constraint
    `ALTER TABLE questions ADD CONSTRAINT questions_subject_or_topic_check CHECK (subject_id IS NOT NULL OR topic_id IS NOT NULL);`
  ];
  
  const descriptions = [
    'Adding subject_id column',
    'Creating index on subject_id',
    'Backfilling subject_id from topics',
    'Dropping old topic_id foreign key',
    'Making topic_id nullable',
    'Re-adding topic_id foreign key with ON DELETE SET NULL',
    'Adding check constraint'
  ];
  
  console.log(`🔨 Executing ${statements.length} migration steps...\n`);
  
  let succeeded = 0;
  let failed = 0;
  const errors = [];
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const desc = descriptions[i];
    
    console.log(`[${i + 1}/${statements.length}] ${desc}...`);
    
    try {
      // Use fetch to execute SQL via Supabase's PostgREST
      // Note: This requires a custom RPC function or direct PostgreSQL access
      // For now, we'll use a workaround
      
      // Since Supabase doesn't expose a direct SQL execution endpoint,
      // we need to use the PostgreSQL connection string
      console.log(`   ⚠️  Cannot execute via REST API - requires direct PostgreSQL access`);
      
      // Mark as needing manual execution
      errors.push({
        step: i + 1,
        description: desc,
        statement: stmt.substring(0, 100) + '...'
      });
      
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      failed++;
      errors.push({
        step: i + 1,
        description: desc,
        error: err.message
      });
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('⚠️  MIGRATION REQUIRES MANUAL EXECUTION');
  console.log('='.repeat(70));
  console.log('\nThe Supabase JavaScript client does not support direct SQL execution.');
  console.log('Please execute the migration using one of these methods:\n');
  console.log('METHOD 1: Supabase Dashboard (Recommended)');
  console.log('  1. Go to: https://app.supabase.com');
  console.log('  2. Select your project');
  console.log('  3. Navigate to: SQL Editor');
  console.log('  4. Click "New Query"');
  console.log('  5. Copy/paste: supabase/migrations/20251208_add_subject_id_to_questions.sql');
  console.log('  6. Click "Run"');
  console.log('\nMETHOD 2: Supabase CLI');
  console.log('  npx supabase db push');
  console.log('\nMETHOD 3: psql (if you have PostgreSQL client)');
  console.log('  psql <connection-string> -f supabase/migrations/20251208_add_subject_id_to_questions.sql');
  console.log('\n' + '='.repeat(70));
  
  return { succeeded, failed, errors };
}

executeStatements()
  .then(() => {
    console.log('\n✅ Migration preparation complete');
    console.log('   After executing manually, run: node scripts/check-migration-status.js\n');
  })
  .catch(err => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  });
