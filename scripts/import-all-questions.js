#!/usr/bin/env node
/**
 * Import All Questions Script
 * 
 * Imports questions from both:
 * - data/jamb-waec-questions.json
 * - data/extra-quizzes.json
 * 
 * Creates topics automatically and links questions properly
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Subject name to slug mapping
const subjectSlugs = {
  mathematics: 'mathematics',
  english: 'english-language',
  physics: 'physics',
  chemistry: 'chemistry',
  biology: 'biology',
  economics: 'economics',
  commerce: 'commerce',
  accounting: 'accounting',
  literature: 'literature-in-english',
  government: 'government',
  geography: 'geography',
  agriculture: 'agriculture',
  history: 'history',
  'civic education': 'civic-education'
};

async function getSubjectBySlug(slug) {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name, subject_category')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error(`❌ Error fetching subject ${slug}:`, error.message);
    return null;
  }

  return data;
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getOrCreateTopic(subjectId, topicName) {
  // Try to find existing topic
  const { data: existing } = await supabase
    .from('topics')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('name', topicName)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  // Create new topic with slug
  const slug = generateSlug(topicName);
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
    console.error(`❌ Error creating topic ${topicName}:`, error.message);
    return null;
  }

  console.log(`  ✅ Created topic: ${topicName}`);
  return newTopic.id;
}

async function importJambWaecQuestions() {
  console.log('\n📚 Importing JAMB/WAEC Questions...\n');

  const filePath = join(__dirname, '..', 'data', 'jamb-waec-questions.json');
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));

  let imported = 0;
  let failed = 0;

  for (const [subjectName, questions] of Object.entries(data)) {
    console.log(`\n📖 Processing ${subjectName.toUpperCase()}...`);

    const slug = subjectSlugs[subjectName.toLowerCase()];
    if (!slug) {
      console.error(`  ❌ No slug mapping for: ${subjectName}`);
      continue;
    }

    const subject = await getSubjectBySlug(slug);
    if (!subject) {
      console.error(`  ❌ Subject not found: ${slug}`);
      continue;
    }

    for (const q of questions) {
      try {
        const topicId = await getOrCreateTopic(subject.id, q.topic);
        if (!topicId) {
          failed++;
          continue;
        }

        const { error } = await supabase
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
            difficulty_level: q.difficulty_level || 'MEDIUM',
            exam_year: q.exam_year || null,
            exam_type: q.exam_type || null,
            is_active: true
          });

        if (error) {
          console.error(`  ❌ Error:`, error.message);
          failed++;
        } else {
          imported++;
          process.stdout.write('.');
        }
      } catch (err) {
        console.error(`  ❌ Exception:`, err.message);
        failed++;
      }
    }

    console.log(`\n  ✅ ${subjectName}: Done`);
  }

  return { imported, failed };
}

async function importExtraQuizzes() {
  console.log('\n📚 Importing Extra Quizzes...\n');

  const filePath = join(__dirname, '..', 'data', 'extra-quizzes.json');
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));

  let imported = 0;
  let failed = 0;

  for (const q of data) {
    try {
      const subjectName = q.subject.toLowerCase();
      const slug = subjectSlugs[subjectName];

      if (!slug) {
        console.error(`  ❌ No slug mapping for: ${q.subject}`);
        failed++;
        continue;
      }

      const subject = await getSubjectBySlug(slug);
      if (!subject) {
        console.error(`  ❌ Subject not found: ${slug}`);
        failed++;
        continue;
      }

      const topicId = await getOrCreateTopic(subject.id, q.topic);
      if (!topicId) {
        failed++;
        continue;
      }

      // Convert choices array to option_a, option_b, option_c, option_d
      const options = q.choices || [];
      if (options.length < 4) {
        console.error(`  ❌ Question ${q.id} has less than 4 options`);
        failed++;
        continue;
      }

      // Find correct answer index
      const correctIndex = options.indexOf(q.answer);
      const correctAnswer = correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : 'A'; // A, B, C, D

      const { error } = await supabase
        .from('questions')
        .insert({
          topic_id: topicId,
          question_text: q.question,
          option_a: options[0],
          option_b: options[1],
          option_c: options[2],
          option_d: options[3],
          correct_answer: correctAnswer,
          explanation: q.explanation,
          difficulty_level: 'MEDIUM',
          is_active: true
        });

      if (error) {
        console.error(`  ❌ Error importing ${q.id}:`, error.message);
        failed++;
      } else {
        imported++;
        console.log(`  ✅ Imported: ${q.subject} - ${q.topic}`);
      }
    } catch (err) {
      console.error(`  ❌ Exception:`, err.message);
      failed++;
    }
  }

  return { imported, failed };
}

async function verifyImport() {
  console.log('\n🔍 Verifying import...\n');

  // Count questions
  const { count: questionCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Total questions in database: ${questionCount}`);

  // Count topics
  const { count: topicCount } = await supabase
    .from('topics')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Total topics in database: ${topicCount}`);

  // Questions by subject
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, slug');

  console.log('\n📊 Questions by subject:\n');

  for (const subject of subjects) {
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', supabase.rpc('get_topics_for_subject', { subject_id: subject.id }));

    // Alternative: Join through topics
    const { data: topics } = await supabase
      .from('topics')
      .select('id')
      .eq('subject_id', subject.id);

    if (topics && topics.length > 0) {
      const topicIds = topics.map(t => t.id);
      const { count: qCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .in('topic_id', topicIds);

      if (qCount > 0) {
        console.log(`  ${subject.name}: ${qCount} questions`);
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting Question Import...\n');
  console.log('📍 Supabase URL:', supabaseUrl);
  console.log('');

  // Import JAMB/WAEC questions
  const jambResult = await importJambWaecQuestions();

  // Import extra quizzes
  const extraResult = await importExtraQuizzes();

  // Summary
  console.log('\n\n📊 IMPORT SUMMARY\n');
  console.log('JAMB/WAEC Questions:');
  console.log(`  ✅ Imported: ${jambResult.imported}`);
  console.log(`  ❌ Failed: ${jambResult.failed}`);
  console.log('');
  console.log('Extra Quizzes:');
  console.log(`  ✅ Imported: ${extraResult.imported}`);
  console.log(`  ❌ Failed: ${extraResult.failed}`);
  console.log('');
  console.log('TOTAL:');
  console.log(`  ✅ Imported: ${jambResult.imported + extraResult.imported}`);
  console.log(`  ❌ Failed: ${jambResult.failed + extraResult.failed}`);

  // Verify
  await verifyImport();

  console.log('\n🎉 Import complete!\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});

