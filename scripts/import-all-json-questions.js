#!/usr/bin/env node

/**
 * Import all questions from JSON files into the database
 * This script imports questions from:
 * - data/jamb-questions.json
 * - data/expanded-mathematics-questions.json
 * - data/expanded-english-questions.json
 * - data/expanded-science-questions.json
 * - data/extra-quizzes.json
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = 'https://rnxkkmdnmwhxdaofwtrf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJueGtrbWRubXdoeGRhb2Z3dHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDM3MzIsImV4cCI6MjA3OTA3OTczMn0.8RzSpFbTjxBVUK8Uj84SmAUlzhdGU6izb2dC1P5UXFA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Subject slug mapping
const subjectSlugMap = {
  'mathematics': 'mathematics',
  'english': 'english',
  'physics': 'physics',
  'chemistry': 'chemistry',
  'biology': 'biology',
  'economics': 'economics',
  'geography': 'geography',
  'commerce': 'commerce',
  'crs': 'crs'
};

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getSubjectId(subjectSlug) {
  const { data, error } = await supabase
    .from('subjects')
    .select('id')
    .eq('slug', subjectSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    console.warn(`⚠️  Subject not found: ${subjectSlug}`);
    return null;
  }

  return data.id;
}

async function getTopicId(subjectId, topicName) {
  if (!topicName || !subjectId) return null;

  const topicSlug = slugify(topicName);

  const { data, error } = await supabase
    .from('topics')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('slug', topicSlug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.id;
}

async function importQuestion(question, subjectSlug) {
  const subjectId = await getSubjectId(subjectSlug);
  if (!subjectId) {
    return { success: false, error: `Subject not found: ${subjectSlug}` };
  }

  const topicId = await getTopicId(subjectId, question.topic);

  const questionData = {
    subject_id: subjectId,
    topic_id: topicId,
    question_text: question.question_text || question.question,
    option_a: question.option_a || question.choices?.[0],
    option_b: question.option_b || question.choices?.[1],
    option_c: question.option_c || question.choices?.[2],
    option_d: question.option_d || question.choices?.[3],
    correct_answer: question.correct_answer || question.answer,
    explanation: question.explanation,
    exam_year: question.exam_year,
    exam_type: question.exam_type,
    is_active: true
  };

  // Check if question already exists (by question_text)
  const { data: existing } = await supabase
    .from('questions')
    .select('id')
    .eq('question_text', questionData.question_text)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'Question already exists', skipped: true };
  }

  const { error } = await supabase
    .from('questions')
    .insert(questionData);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function importFromFile(filePath, fileType) {
  console.log(`\n📄 Importing from: ${filePath}`);

  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  let totalQuestions = 0;
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  if (fileType === 'jamb-questions' || fileType === 'expanded') {
    // Format: { "subject": [ questions ] }
    for (const [subjectKey, questions] of Object.entries(data)) {
      const subjectSlug = subjectSlugMap[subjectKey.toLowerCase()] || subjectKey.toLowerCase();
      console.log(`\n  📚 Processing ${subjectKey} (${questions.length} questions)...`);

      for (const question of questions) {
        totalQuestions++;
        const result = await importQuestion(question, subjectSlug);

        if (result.success) {
          imported++;
          process.stdout.write('.');
        } else if (result.skipped) {
          skipped++;
          process.stdout.write('s');
        } else {
          failed++;
          process.stdout.write('x');
        }
      }
    }
  } else if (fileType === 'extra-quizzes') {
    // Format: [ { subject, question, ... } ]
    console.log(`\n  📚 Processing ${data.length} questions...`);

    for (const question of data) {
      totalQuestions++;
      const subjectSlug = subjectSlugMap[question.subject?.toLowerCase()] || question.subject?.toLowerCase();

      if (!subjectSlug) {
        failed++;
        process.stdout.write('x');
        continue;
      }

      const result = await importQuestion(question, subjectSlug);

      if (result.success) {
        imported++;
        process.stdout.write('.');
      } else if (result.skipped) {
        skipped++;
        process.stdout.write('s');
      } else {
        failed++;
        process.stdout.write('x');
      }
    }
  }

  console.log(`\n  ✅ Imported: ${imported}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Failed: ${failed}`);

  return { totalQuestions, imported, skipped, failed };
}

async function main() {
  console.log('🚀 Starting question import from JSON files...\n');

  const files = [
    { path: join(__dirname, '..', 'data', 'jamb-questions.json'), type: 'jamb-questions' },
    { path: join(__dirname, '..', 'data', 'expanded-mathematics-questions.json'), type: 'expanded' },
    { path: join(__dirname, '..', 'data', 'expanded-english-questions.json'), type: 'expanded' },
    { path: join(__dirname, '..', 'data', 'expanded-science-questions.json'), type: 'expanded' },
    { path: join(__dirname, '..', 'data', 'extra-quizzes.json'), type: 'extra-quizzes' }
  ];

  let grandTotal = 0;
  let grandImported = 0;
  let grandSkipped = 0;
  let grandFailed = 0;

  for (const file of files) {
    try {
      const result = await importFromFile(file.path, file.type);
      grandTotal += result.totalQuestions;
      grandImported += result.imported;
      grandSkipped += result.skipped;
      grandFailed += result.failed;
    } catch (error) {
      console.error(`\n❌ Error processing ${file.path}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary:');
  console.log(`  Total Questions Processed: ${grandTotal}`);
  console.log(`  ✅ Successfully Imported: ${grandImported}`);
  console.log(`  ⏭️  Skipped (already exist): ${grandSkipped}`);
  console.log(`  ❌ Failed: ${grandFailed}`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

