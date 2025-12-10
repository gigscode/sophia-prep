#!/usr/bin/env node
/**
 * Associate Existing Questions with Mathematics Subject
 * 
 * This script associates all existing questions (which currently have null subject_id)
 * with the Mathematics subject. This is a temporary fix to make questions visible
 * in the quiz interface.
 * 
 * IMPORTANT: This assumes all existing questions are Mathematics questions.
 * If you have questions from other subjects, you'll need to manually categorize them.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🔄 Associate Questions with Mathematics Subject\n');

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

async function main() {
  try {
    // Step 1: Get the Mathematics subject
    console.log('🔍 Finding Mathematics subject...');
    const { data: mathSubject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name, slug')
      .eq('slug', 'mathematics')
      .single();

    if (subjectError || !mathSubject) {
      console.error('❌ Mathematics subject not found:', subjectError);
      process.exit(1);
    }

    console.log(`✅ Found Mathematics subject: ${mathSubject.name} (${mathSubject.id})\n`);

    // Step 2: Count questions without subject_id
    const { data: questionsToUpdate, error: countError } = await supabase
      .from('questions')
      .select('id')
      .is('subject_id', null);

    if (countError) {
      console.error('❌ Error counting questions:', countError);
      process.exit(1);
    }

    const nullCount = questionsToUpdate?.length || 0;
    console.log(`📊 Found ${nullCount} questions without subject_id\n`);

    if (nullCount === 0) {
      console.log('✅ All questions already have subject_id assigned!');
      return;
    }

    // Step 3: Update all questions without subject_id to Mathematics
    console.log('🔨 Updating questions...');
    const { data: updatedQuestions, error: updateError } = await supabase
      .from('questions')
      .update({ subject_id: mathSubject.id })
      .is('subject_id', null)
      .select('id');

    if (updateError) {
      console.error('❌ Error updating questions:', updateError);
      process.exit(1);
    }

    console.log(`✅ Successfully updated ${updatedQuestions?.length || 0} questions\n`);

    // Step 4: Verify the update
    console.log('🔍 Verifying update...');
    const { data: remainingNullData } = await supabase
      .from('questions')
      .select('id')
      .is('subject_id', null);

    const { data: mathData } = await supabase
      .from('questions')
      .select('id')
      .eq('subject_id', mathSubject.id);

    const remainingNull = remainingNullData?.length || 0;
    const mathCount = mathData?.length || 0;

    console.log(`📊 Verification Results:`);
    console.log(`   Questions with null subject_id: ${remainingNull}`);
    console.log(`   Questions assigned to Mathematics: ${mathCount}\n`);

    if (remainingNull === 0) {
      console.log('✅ SUCCESS! All questions now have subject_id assigned.');
      console.log('✅ Questions should now be visible in the quiz interface.');
    } else {
      console.log('⚠️  Some questions still have null subject_id.');
      console.log('   You may need to run this script again or manually assign them.');
    }

  } catch (err) {
    console.error('\n❌ Fatal Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();

