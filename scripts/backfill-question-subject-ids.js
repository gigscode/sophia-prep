#!/usr/bin/env node
/**
 * Question Subject ID Backfill Script
 * 
 * This script populates the subject_id column for existing questions by
 * looking up the subject_id from their associated topics. It handles:
 * - Questions with valid topic_id references
 * - Orphaned questions (invalid topic_id references)
 * - Logging questions that need manual review
 * - Verification of backfill correctness
 * 
 * Requirements: 4.2
 * Design Property: Property 5 - Subject_id backfill correctness
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🔄 Question Subject ID Backfill Script\n');
console.log('📍 URL:', SUPABASE_URL);
console.log('🔑 Service Role Key:', SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Get all questions that need subject_id backfill
 */
async function getQuestionsNeedingBackfill() {
  try {
    console.log('🔍 Fetching questions that need subject_id backfill...');
    const { data, error } = await supabase
      .from('questions')
      .select('id, topic_id, subject_id, question_text')
      .is('subject_id', null);
    
    if (error) {
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }
    
    console.log(`   ✅ Found ${data.length} questions without subject_id`);
    return data;
  } catch (err) {
    console.error(`   ❌ Error fetching questions: ${err.message}`);
    throw err;
  }
}

/**
 * Get all topics with their subject_id mappings
 */
async function getTopicSubjectMappings() {
  try {
    console.log('🔍 Fetching topic-to-subject mappings...');
    const { data, error } = await supabase
      .from('topics')
      .select('id, subject_id, name');
    
    if (error) {
      throw new Error(`Failed to fetch topics: ${error.message}`);
    }
    
    console.log(`   ✅ Found ${data.length} topics`);
    
    // Create a Map for O(1) lookup
    const mappings = new Map();
    data.forEach(topic => {
      mappings.set(topic.id, {
        subject_id: topic.subject_id,
        topic_name: topic.name
      });
    });
    
    return mappings;
  } catch (err) {
    console.error(`   ❌ Error fetching topics: ${err.message}`);
    throw err;
  }
}

/**
 * Categorize questions into valid and orphaned
 */
function categorizeQuestions(questions, topicMappings) {
  console.log('\n🔍 Categorizing questions...');
  
  const validQuestions = [];
  const orphanedQuestions = [];
  
  for (const question of questions) {
    if (!question.topic_id) {
      // Question has no topic_id at all
      orphanedQuestions.push({
        ...question,
        reason: 'No topic_id assigned'
      });
    } else if (!topicMappings.has(question.topic_id)) {
      // Question has topic_id but it doesn't exist in topics table
      orphanedQuestions.push({
        ...question,
        reason: 'Invalid topic_id reference (topic does not exist)'
      });
    } else {
      // Valid question with existing topic
      const topicInfo = topicMappings.get(question.topic_id);
      validQuestions.push({
        ...question,
        target_subject_id: topicInfo.subject_id,
        topic_name: topicInfo.topic_name
      });
    }
  }
  
  console.log(`   ✅ Valid questions: ${validQuestions.length}`);
  console.log(`   ⚠️  Orphaned questions: ${orphanedQuestions.length}`);
  
  return { validQuestions, orphanedQuestions };
}

/**
 * Update a single question's subject_id
 */
async function updateQuestionSubjectId(questionId, subjectId) {
  try {
    const { error } = await supabase
      .from('questions')
      .update({ subject_id: subjectId })
      .eq('id', questionId);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Process valid questions and update their subject_id
 */
async function processValidQuestions(validQuestions) {
  if (validQuestions.length === 0) {
    console.log('\n✅ No valid questions to process!');
    return { updated: 0, errors: [] };
  }
  
  console.log(`\n🔨 Processing ${validQuestions.length} valid questions...\n`);
  
  let updated = 0;
  const errors = [];
  
  // Process in batches for better performance
  const BATCH_SIZE = 50;
  for (let i = 0; i < validQuestions.length; i += BATCH_SIZE) {
    const batch = validQuestions.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(validQuestions.length / BATCH_SIZE);
    
    console.log(`   Processing batch ${batchNumber}/${totalBatches} (${batch.length} questions)...`);
    
    const batchPromises = batch.map(question => 
      updateQuestionSubjectId(question.id, question.target_subject_id)
        .then(result => ({ question, result }))
    );
    
    const results = await Promise.all(batchPromises);
    
    for (const { question, result } of results) {
      if (result.success) {
        updated++;
      } else {
        errors.push({
          questionId: question.id,
          topicId: question.topic_id,
          error: result.error
        });
      }
    }
  }
  
  console.log(`   ✅ Batch processing complete`);
  
  return { updated, errors };
}

/**
 * Log orphaned questions for manual review
 */
function logOrphanedQuestions(orphanedQuestions) {
  if (orphanedQuestions.length === 0) {
    console.log('\n✅ No orphaned questions found!');
    return;
  }
  
  console.log(`\n⚠️  ORPHANED QUESTIONS REQUIRING MANUAL REVIEW (${orphanedQuestions.length}):`);
  console.log('='.repeat(70));
  
  orphanedQuestions.forEach((question, index) => {
    console.log(`\n${index + 1}. Question ID: ${question.id}`);
    console.log(`   Topic ID: ${question.topic_id || 'NULL'}`);
    console.log(`   Reason: ${question.reason}`);
    console.log(`   Question Text: ${question.question_text.substring(0, 100)}...`);
  });
  
  console.log('\n' + '='.repeat(70));
  console.log('⚠️  These questions need manual subject assignment.');
  console.log('   You can update them using the admin interface or SQL:');
  console.log('   UPDATE questions SET subject_id = \'<subject-uuid>\' WHERE id = \'<question-uuid>\';');
}

/**
 * Verify backfill correctness
 */
async function verifyBackfillCorrectness() {
  console.log('\n🔍 Verifying backfill correctness...\n');
  
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
    const { count, error } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .not('subject_id', 'is', null);
    
    if (error) throw error;
    
    checks.push({
      name: 'Questions with subject_id populated',
      passed: true,
      details: `${count} questions now have subject_id`
    });
  } catch (err) {
    checks.push({
      name: 'Questions with subject_id populated',
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
 * Print summary report
 */
function printSummary(totalQuestions, updated, orphanedCount, errors, verificationPassed) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 BACKFILL SUMMARY REPORT');
  console.log('='.repeat(70));
  console.log(`\n📈 Statistics:`);
  console.log(`   Total questions needing backfill:  ${totalQuestions}`);
  console.log(`   Questions updated successfully:    ${updated}`);
  console.log(`   Orphaned questions (manual review): ${orphanedCount}`);
  console.log(`   Errors encountered:                ${errors.length}`);
  console.log(`   Verification passed:               ${verificationPassed ? 'YES' : 'NO'}`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors:`);
    errors.forEach(err => {
      console.log(`   - Question ID: ${err.questionId}`);
      console.log(`     Topic ID: ${err.topicId}`);
      console.log(`     Error: ${err.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (errors.length === 0 && orphanedCount === 0 && verificationPassed) {
    console.log('✅ Backfill completed successfully!');
    console.log('✅ All questions now have subject_id populated correctly.');
  } else if (orphanedCount > 0 && errors.length === 0 && verificationPassed) {
    console.log('⚠️  Backfill completed with orphaned questions.');
    console.log(`   ${updated} questions updated successfully.`);
    console.log(`   ${orphanedCount} questions need manual subject assignment.`);
  } else if (errors.length > 0) {
    console.log('⚠️  Backfill completed with errors.');
    console.log(`   ${updated} questions updated, but ${errors.length} failed.`);
    console.log('   Review errors above and retry if needed.');
  } else if (!verificationPassed) {
    console.log('⚠️  Backfill completed but verification failed.');
    console.log('   Review verification results above.');
  }
  
  console.log('');
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Step 1: Get all questions needing backfill
    const questions = await getQuestionsNeedingBackfill();
    
    if (questions.length === 0) {
      console.log('\n✅ No questions need backfill. All questions already have subject_id!');
      return;
    }
    
    // Step 2: Get topic-to-subject mappings
    const topicMappings = await getTopicSubjectMappings();
    
    // Step 3: Categorize questions into valid and orphaned
    const { validQuestions, orphanedQuestions } = categorizeQuestions(questions, topicMappings);
    
    // Step 4: Process valid questions
    const { updated, errors } = await processValidQuestions(validQuestions);
    
    // Step 5: Log orphaned questions for manual review
    logOrphanedQuestions(orphanedQuestions);
    
    // Step 6: Verify backfill correctness
    const { allPassed } = await verifyBackfillCorrectness();
    
    // Step 7: Print summary report
    printSummary(
      questions.length,
      updated,
      orphanedQuestions.length,
      errors,
      allPassed
    );
    
    // Exit with error code if there were failures
    if (errors.length > 0 || !allPassed) {
      process.exit(1);
    }
    
  } catch (err) {
    console.error('\n❌ Fatal Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run the backfill
main();
