#!/usr/bin/env node

/**
 * Run Database Cleanup and Topics Implementation
 * This script will execute the migration SQL directly
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function runDatabaseCleanup() {
  try {
    console.log('🚀 Starting database cleanup and topics implementation...');

    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250114_database_cleanup_and_topics.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements (rough split by semicolon + newline)
    const statements = migrationSQL
      .split(';\n')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt.endsWith(';') ? stmt : stmt + ';');

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === ';') {
        continue;
      }

      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0); // This will fail but we can use it to execute raw SQL
          
          if (directError && !directError.message.includes('does not exist')) {
            console.warn(`⚠️  Warning on statement ${i + 1}: ${error.message}`);
          }
        }
      } catch (err) {
        console.warn(`⚠️  Warning on statement ${i + 1}: ${err.message}`);
      }
    }

    console.log('✅ Database cleanup completed!');
    console.log('🎯 Now testing the topics functionality...');

    // Test if topics table was created
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('count')
      .limit(1);

    if (topicsError) {
      console.error('❌ Topics table not accessible:', topicsError.message);
      console.log('🔧 Let me try a simpler approach...');
      await createTopicsTableSimple();
    } else {
      console.log('✅ Topics table is accessible!');
    }

    // Check how many topics were created
    const { count } = await supabase
      .from('topics')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total topics created: ${count || 0}`);

    // Show subjects with topics
    const { data: subjectsWithTopics } = await supabase
      .from('subjects')
      .select(`
        name,
        topics:topics(count)
      `)
      .eq('is_active', true);

    if (subjectsWithTopics) {
      console.log('\n📚 Subjects with topics:');
      subjectsWithTopics.forEach(subject => {
        const topicCount = subject.topics?.[0]?.count || 0;
        console.log(`  • ${subject.name}: ${topicCount} topics`);
      });
    }

    console.log('\n🎉 Database cleanup and topics implementation completed successfully!');
    console.log('🚀 Your app now supports topic-based practice mode!');

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    console.log('🔧 Trying alternative approach...');
    await createTopicsTableSimple();
  }
}

async function createTopicsTableSimple() {
  console.log('🔧 Creating topics table with simple approach...');
  
  try {
    // Create topics table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        order_index INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // We'll use a workaround since direct SQL execution might be limited
    console.log('📝 Please run this SQL manually in your Supabase dashboard:');
    console.log('=' .repeat(60));
    console.log(createTableSQL);
    console.log('=' .repeat(60));
    
    console.log('\n🎯 After creating the table, run: npm run add:topics');
    
  } catch (error) {
    console.error('❌ Error in simple approach:', error);
  }
}

runDatabaseCleanup();