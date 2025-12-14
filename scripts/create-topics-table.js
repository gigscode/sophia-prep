#!/usr/bin/env node

/**
 * Create Topics Table and Add Sample Data
 * This script creates the topics table and populates it with sample data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Sample topics for different subjects
const sampleTopics = {
  'Mathematics': [
    'Algebra', 'Geometry', 'Trigonometry', 'Calculus', 
    'Statistics', 'Number Theory', 'Coordinate Geometry', 'Mensuration'
  ],
  'English Language': [
    'Comprehension', 'Grammar', 'Vocabulary', 'Essay Writing',
    'Literature', 'Oral English', 'Summary Writing'
  ],
  'Physics': [
    'Mechanics', 'Thermodynamics', 'Electricity', 'Magnetism',
    'Optics', 'Modern Physics', 'Waves and Sound'
  ],
  'Chemistry': [
    'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry',
    'Analytical Chemistry', 'Biochemistry', 'Environmental Chemistry'
  ],
  'Biology': [
    'Cell Biology', 'Genetics', 'Evolution', 'Ecology',
    'Human Anatomy', 'Plant Biology', 'Animal Biology'
  ],
  'Economics': [
    'Microeconomics', 'Macroeconomics', 'Development Economics', 'International Trade'
  ],
  'Government': [
    'Political Theory', 'Comparative Politics', 'Public Administration', 'International Relations'
  ],
  'Geography': [
    'Physical Geography', 'Human Geography', 'Economic Geography', 'Environmental Geography'
  ],
  'History': [
    'Ancient History', 'Medieval History', 'Modern History', 'African History'
  ],
  'Literature in English': [
    'Poetry', 'Drama', 'Prose', 'Literary Criticism'
  ]
};

async function createTopicsAndData() {
  try {
    console.log('🚀 Creating topics table and adding sample data...');

    // First, let's check if topics table exists by trying to query it
    console.log('🔍 Checking if topics table exists...');
    
    const { data: existingTopics, error: checkError } = await supabase
      .from('topics')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === 'PGRST116') {
      console.log('❌ Topics table does not exist. Please create it manually first.');
      console.log('\n📝 Run this SQL in your Supabase Dashboard > SQL Editor:');
      console.log('=' .repeat(80));
      console.log(`
-- Create topics table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_active ON topics(is_active);
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(order_index);
CREATE UNIQUE INDEX IF NOT EXISTS idx_topics_subject_slug ON topics(subject_id, slug);

-- Enable RLS
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Topics are viewable by everyone"
  ON topics FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage topics"
  ON topics FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'gigsdev007@gmail.com'));

-- Add topic_id column to questions if it doesn't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
      `);
      console.log('=' .repeat(80));
      console.log('\n🎯 After running the SQL above, run this script again with: npm run create:topics');
      return;
    }

    if (existingTopics !== null) {
      console.log('✅ Topics table exists!');
      
      // Check if we already have topics
      const { count } = await supabase
        .from('topics')
        .select('*', { count: 'exact', head: true });

      if (count > 0) {
        console.log(`📊 Found ${count} existing topics. Skipping creation.`);
        console.log('🎯 Topics feature is ready to use!');
        return;
      }
    }

    // Get all subjects
    console.log('📚 Loading subjects...');
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('is_active', true);

    if (subjectsError) throw subjectsError;

    console.log(`Found ${subjects.length} active subjects`);

    // Add topics for each subject
    let totalTopicsAdded = 0;

    for (const subject of subjects) {
      const topicsForSubject = sampleTopics[subject.name];
      
      if (topicsForSubject) {
        console.log(`📝 Adding topics for ${subject.name}...`);
        
        const topicsToInsert = topicsForSubject.map((topicName, index) => ({
          subject_id: subject.id,
          name: topicName,
          slug: topicName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          order_index: index + 1,
          is_active: true
        }));

        const { data: insertedTopics, error: insertError } = await supabase
          .from('topics')
          .insert(topicsToInsert)
          .select();

        if (insertError) {
          console.error(`❌ Error adding topics for ${subject.name}:`, insertError);
        } else {
          console.log(`✅ Added ${insertedTopics.length} topics for ${subject.name}`);
          totalTopicsAdded += insertedTopics.length;
        }
      } else {
        // Add a generic topic for subjects without specific topics
        console.log(`📝 Adding generic topic for ${subject.name}...`);
        
        const { error: insertError } = await supabase
          .from('topics')
          .insert({
            subject_id: subject.id,
            name: 'General Topics',
            slug: 'general-topics',
            order_index: 1,
            is_active: true
          });

        if (insertError) {
          console.error(`❌ Error adding generic topic for ${subject.name}:`, insertError);
        } else {
          console.log(`✅ Added generic topic for ${subject.name}`);
          totalTopicsAdded += 1;
        }
      }
    }

    console.log(`\n🎉 Successfully added ${totalTopicsAdded} topics!`);

    // Now link existing questions to topics
    console.log('\n🔗 Linking existing questions to topics...');
    
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, subject_id, topic_id')
      .is('topic_id', null)
      .not('subject_id', 'is', null);

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
    } else if (questions && questions.length > 0) {
      console.log(`📝 Found ${questions.length} questions without topics`);

      // Group questions by subject
      const questionsBySubject = questions.reduce((acc, q) => {
        if (!acc[q.subject_id]) acc[q.subject_id] = [];
        acc[q.subject_id].push(q);
        return acc;
      }, {});

      for (const [subjectId, subjectQuestions] of Object.entries(questionsBySubject)) {
        // Get topics for this subject
        const { data: subjectTopics } = await supabase
          .from('topics')
          .select('id')
          .eq('subject_id', subjectId)
          .eq('is_active', true);

        if (subjectTopics && subjectTopics.length > 0) {
          // Randomly assign questions to topics
          const updates = subjectQuestions.map(question => {
            const randomTopic = subjectTopics[Math.floor(Math.random() * subjectTopics.length)];
            return {
              id: question.id,
              topic_id: randomTopic.id
            };
          });

          // Update in batches
          const batchSize = 100;
          for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            
            const { error: updateError } = await supabase
              .from('questions')
              .upsert(batch);

            if (updateError) {
              console.error(`❌ Error updating question batch:`, updateError);
            } else {
              console.log(`✅ Updated ${batch.length} questions with topics`);
            }
          }
        }
      }
    }

    // Final summary
    console.log('\n📊 Final Summary:');
    const { data: finalStats } = await supabase
      .from('subjects')
      .select(`
        name,
        topics:topics(count)
      `)
      .eq('is_active', true);

    if (finalStats) {
      finalStats.forEach(subject => {
        const topicCount = subject.topics?.[0]?.count || 0;
        console.log(`  📚 ${subject.name}: ${topicCount} topics`);
      });
    }

    console.log('\n🎉 Topics feature is now ready!');
    console.log('🚀 Users can now select specific topics in Practice Mode!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTopicsAndData();