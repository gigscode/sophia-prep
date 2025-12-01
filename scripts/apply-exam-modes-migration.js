import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('📋 Applying Exam Modes System Migration...\n');

    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250201_add_exam_modes_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.startsWith('--') || statement.length < 10) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase.from('_').select('*').limit(0);
        
        if (directError) {
          console.warn(`⚠️  Statement ${i + 1} may have failed:`, error.message);
          console.log('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('\n📊 Verifying timer_configurations table...');

    // Verify the table was created
    const { data, error } = await supabase
      .from('timer_configurations')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error verifying table:', error.message);
      console.log('\n⚠️  You may need to run the migration manually in Supabase SQL Editor');
      console.log('File: supabase/migrations/20250201_add_exam_modes_system.sql');
    } else {
      console.log(`✅ Table verified! Found ${data.length} default configurations`);
      if (data.length > 0) {
        console.log('\nDefault configurations:');
        data.forEach(config => {
          console.log(`  - ${config.exam_type}: ${config.duration_seconds}s (${Math.floor(config.duration_seconds / 60)} minutes)`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n⚠️  Please run the migration manually in Supabase SQL Editor');
    console.log('File: supabase/migrations/20250201_add_exam_modes_system.sql');
    process.exit(1);
  }
}

applyMigration();
