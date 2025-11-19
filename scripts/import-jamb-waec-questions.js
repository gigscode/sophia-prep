import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Subject name to slug mapping
const subjectSlugs = {
  mathematics: 'mathematics',
  english: 'english-language',
  physics: 'physics',
  chemistry: 'chemistry',
  biology: 'biology'
};

async function getSubjectId(subjectSlug) {
  const { data, error } = await supabase
    .from('subjects')
    .select('id')
    .eq('slug', subjectSlug)
    .single();

  if (error) {
    console.error(`❌ Error fetching subject ${subjectSlug}:`, error.message);
    return null;
  }

  return data?.id;
}

async function getOrCreateTopic(subjectId, topicName) {
  // First, try to find existing topic
  const { data: existingTopic } = await supabase
    .from('topics')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('name', topicName)
    .single();

  if (existingTopic) {
    return existingTopic.id;
  }

  // Create new topic if it doesn't exist
  const { data: newTopic, error } = await supabase
    .from('topics')
    .insert({
      subject_id: subjectId,
      name: topicName,
      description: `${topicName} questions`,
      order_index: 0,
      is_active: true
    })
    .select('id')
    .single();

  if (error) {
    console.error(`❌ Error creating topic ${topicName}:`, error.message);
    return null;
  }

  return newTopic.id;
}

async function importQuestions() {
  console.log('🚀 Starting JAMB/WAEC Questions Import...\n');

  // Read questions file
  const questionsPath = join(__dirname, '..', 'data', 'jamb-waec-questions.json');
  const questionsData = JSON.parse(readFileSync(questionsPath, 'utf-8'));

  let totalImported = 0;
  let totalFailed = 0;

  for (const [subjectName, questions] of Object.entries(questionsData)) {
    console.log(`\n📚 Processing ${subjectName.toUpperCase()}...`);

    const subjectSlug = subjectSlugs[subjectName];
    if (!subjectSlug) {
      console.error(`❌ No slug mapping for subject: ${subjectName}`);
      continue;
    }

    const subjectId = await getSubjectId(subjectSlug);
    if (!subjectId) {
      console.error(`❌ Subject not found: ${subjectName}`);
      continue;
    }

    for (const question of questions) {
      try {
        // Get or create topic
        const topicId = await getOrCreateTopic(subjectId, question.topic);
        if (!topicId) {
          console.error(`❌ Failed to get/create topic: ${question.topic}`);
          totalFailed++;
          continue;
        }

        // Insert question
        const { error } = await supabase
          .from('questions')
          .insert({
            topic_id: topicId,
            question_text: question.question_text,
            option_a: question.option_a,
            option_b: question.option_b,
            option_c: question.option_c,
            option_d: question.option_d,
            correct_answer: question.correct_answer,
            explanation: question.explanation,
            difficulty_level: question.difficulty_level,
            exam_year: question.exam_year,
            exam_type: question.exam_type,
            is_active: true
          });

        if (error) {
          console.error(`❌ Error inserting question:`, error.message);
          totalFailed++;
        } else {
          totalImported++;
          process.stdout.write('.');
        }
      } catch (err) {
        console.error(`❌ Unexpected error:`, err.message);
        totalFailed++;
      }
    }

    console.log(`\n✅ ${subjectName}: Completed`);
  }

  console.log(`\n\n📊 Import Summary:`);
  console.log(`✅ Successfully imported: ${totalImported} questions`);
  console.log(`❌ Failed: ${totalFailed} questions`);
  console.log(`\n🎉 Import complete!`);
}

importQuestions().catch(console.error);

