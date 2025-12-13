#!/usr/bin/env node
/**
 * Import Expanded Questions to Supabase
 * 
 * Imports all expanded question sets (Mathematics, English, Sciences)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Subject slug mapping
const subjectSlugs = {
  mathematics: 'mathematics',
  english: 'english-language',
  physics: 'physics',
  chemistry: 'chemistry',
  biology: 'biology'
};

function generateSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function getOrCreateTopic(subjectId, topicName) {
  const slug = generateSlug(topicName);
  
  // Check if topic exists
  const { data: existing } = await supabase
    .from('topics')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('slug', slug)
    .single();
  
  if (existing) {
    return existing.id;
  }
  
  // Create new topic
  const { data: newTopic, error } = await supabase
    .from('topics')
    .insert({
      subject_id: subjectId,
      name: topicName,
      slug: slug,
      description: `${topicName} questions`,
      is_active: true
    })
    .select('id')
    .single();
  
  if (error) {
    console.error(`❌ Error creating topic ${topicName}:`, error);
    return null;
  }
  
  console.log(`  ✅ Created topic: ${topicName}`);
  return newTopic.id;
}

async function importQuestions(subjectKey, questions) {
  console.log(`\n📚 Importing ${subjectKey} questions...`);
  
  const subjectSlug = subjectSlugs[subjectKey];
  
  // Get subject ID
  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('id')
    .eq('slug', subjectSlug)
    .single();
  
  if (subjectError || !subject) {
    console.error(`❌ Subject not found: ${subjectSlug}`);
    return { success: 0, failed: 0 };
  }
  
  let successCount = 0;
  let failedCount = 0;
  
  for (const q of questions) {
    try {
      // Get or create topic
      const topicId = await getOrCreateTopic(subject.id, q.topic);
      
      if (!topicId) {
        console.error(`  ❌ Failed to get/create topic for: ${q.question_text.substring(0, 50)}...`);
        failedCount++;
        continue;
      }
      
      // Insert question
      const { error: insertError } = await supabase
        .from('questions')
        .insert({
          topic_id: topicId,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_answer: q.correct_answer,
          explanation: q.explanation,

          exam_year: q.exam_year,
          exam_type: q.exam_type,
          is_active: true
        });
      
      if (insertError) {
        console.error(`  ❌ Error inserting question:`, insertError.message);
        failedCount++;
      } else {
        successCount++;
        process.stdout.write(`  ✓ Imported ${successCount}/${questions.length}\r`);
      }
    } catch (err) {
      console.error(`  ❌ Unexpected error:`, err);
      failedCount++;
    }
  }
  
  console.log(`\n  ✅ Successfully imported: ${successCount}`);
  console.log(`  ❌ Failed: ${failedCount}`);
  
  return { success: successCount, failed: failedCount };
}

async function main() {
  console.log('🚀 Starting expanded questions import...\n');
  
  const files = [
    'data/expanded-mathematics-questions.json',
    'data/expanded-english-questions.json',
    'data/expanded-science-questions.json'
  ];
  
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const file of files) {
    try {
      const filePath = join(process.cwd(), file);
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      for (const [subjectKey, questions] of Object.entries(data)) {
        const result = await importQuestions(subjectKey, questions);
        totalSuccess += result.success;
        totalFailed += result.failed;
      }
    } catch (err) {
      console.error(`❌ Error reading file ${file}:`, err.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Total successful: ${totalSuccess}`);
  console.log(`❌ Total failed: ${totalFailed}`);
  console.log(`📈 Success rate: ${((totalSuccess / (totalSuccess + totalFailed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));
}

main().catch(console.error);

