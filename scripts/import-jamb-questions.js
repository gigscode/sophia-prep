import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

if (supabaseKey === process.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Using ANON key. Inserts will fail due to RLS. Set SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Subject name to slug mapping (updated for fresh schema)
const subjectSlugs = {
  // Core subjects from jamb-waec-questions.json
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

  // Alternative mappings
  'english language': 'english-language',
  'literature in english': 'literature-in-english',
  'agricultural science': 'agriculture',
  'civic education': 'civic-education'
};

async function getSubjectDetails(subjectSlug) {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, subject_category')
    .eq('slug', subjectSlug)
    .single();

  if (error) {
    console.error(`❌ Error fetching subject ${subjectSlug}:`, error.message);
    return null;
  }

  return data || null;
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

    const subject = await getSubjectDetails(subjectSlug);
    if (!subject) {
      console.error(`❌ Subject not found: ${subjectName}`);
      continue;
    }

    for (const question of questions) {
      try {
        // Get or create topic
        const topicId = await getOrCreateTopic(subject.id, question.topic);
        if (!topicId) {
          console.error(`❌ Failed to get/create topic: ${question.topic}`);
          totalFailed++;
          continue;
        }

        const bloomLevel = 'Apply'; // Default bloom level
        const timeMinutes = 2; // Default time in minutes
        const markWeighting = 2; // Default mark weighting
        const relatedPast = (question.exam_year && question.exam_type)
          ? [{ year: question.exam_year, exam_type: question.exam_type, topic: question.topic }]
          : [];
        const applicableExamTypes = question.exam_type ? [question.exam_type] : ['JAMB','WAEC'];
        const refs = applicableExamTypes.map(t => ({
          title: t === 'JAMB' ? 'JAMB IBASS' : 'WAEC Syllabus',
          url: t === 'JAMB' ? 'https://www.jamb.gov.ng/' : 'https://waecsyllabus.com/download/ssce/GENERAL%20MATHEMATICS%20OR%20MATHEMATICS%20(CORE).pdf',
          section: question.topic
        }));
        const metadata = {
          subject_classification: subject.subject_category,
          topic_hierarchy: [question.topic],
          time_minutes: timeMinutes,
          mark_weighting: markWeighting,
          bloom_level: bloomLevel,
          related_past_questions: relatedPast,
          applicable_exam_types: applicableExamTypes,
          references: refs
        };

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

            exam_year: question.exam_year,
            exam_type: question.exam_type,
            metadata,
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

