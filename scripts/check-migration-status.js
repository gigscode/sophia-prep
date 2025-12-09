#!/usr/bin/env node
/**
 * Check Migration Status Script
 * 
 * Checks if the subject_id migration has been applied to the questions table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🔍 Checking Migration Status\n');

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

async function checkMigrationStatus() {
  try {
    console.log('📊 Checking questions table schema...\n');
    
    // Try to query a question with subject_id column
    const { data, error } = await supabase
      .from('questions')
      .select('id, subject_id, topic_id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('column "subject_id" does not exist')) {
        console.log('❌ Migration NOT applied: subject_id column does not exist');
        console.log('   Action needed: Run the migration SQL file');
        return false;
      }
      throw error;
    }
    
    console.log('✅ Migration appears to be applied: subject_id column exists');
    
    // Check if topic_id is nullable
    const { data: sampleData } = await supabase
      .from('questions')
      .select('id, subject_id, topic_id')
      .limit(5);
    
    console.log(`\n📊 Sample questions (${sampleData.length}):`);
    sampleData.forEach((q, i) => {
      console.log(`   ${i + 1}. ID: ${q.id.substring(0, 8)}...`);
      console.log(`      subject_id: ${q.subject_id ? q.subject_id.substring(0, 8) + '...' : 'NULL'}`);
      console.log(`      topic_id: ${q.topic_id ? q.topic_id.substring(0, 8) + '...' : 'NULL'}`);
    });
    
    // Check statistics
    const { count: totalCount } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true });
    
    const { count: withSubjectId } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .not('subject_id', 'is', null);
    
    const { count: withTopicId } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .not('topic_id', 'is', null);
    
    const { count: withBothNull } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .is('subject_id', null)
      .is('topic_id', null);
    
    console.log(`\n📊 Statistics:`);
    console.log(`   Total questions: ${totalCount}`);
    console.log(`   With subject_id: ${withSubjectId} (${Math.round(withSubjectId/totalCount*100)}%)`);
    console.log(`   With topic_id: ${withTopicId} (${Math.round(withTopicId/totalCount*100)}%)`);
    console.log(`   With both NULL: ${withBothNull}`);
    
    if (withSubjectId === 0 && withTopicId > 0) {
      console.log('\n⚠️  Migration applied but backfill NOT run');
      console.log('   Action needed: Run the backfill script');
      return 'needs_backfill';
    } else if (withBothNull > 0) {
      console.log('\n⚠️  Some questions have both subject_id and topic_id as NULL');
      console.log('   Action needed: Manual review required');
      return 'needs_review';
    } else if (withSubjectId > 0) {
      console.log('\n✅ Migration and backfill appear complete');
      return 'complete';
    }
    
    return true;
    
  } catch (err) {
    console.error('\n❌ Error checking migration status:', err.message);
    throw err;
  }
}

checkMigrationStatus()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
