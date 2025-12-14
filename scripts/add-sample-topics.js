#!/usr/bin/env node

/**
 * Add Sample Topics to Database
 * Run with: node scripts/add-sample-topics.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Sample topics for common subjects
const sampleTopics = {
  'Mathematics': [
    'Algebra',
    'Geometry', 
    'Trigonometry',
    'Calculus',
    'Statistics',
    'Number Theory',
    'Coordinate Geometry',
    'Mensuration'
  ],
  'English Language': [
    'Comprehension',
    'Grammar',
    'Vocabulary',
    'Essay Writing',
    'Literature',
    'Oral English',
    'Summary Writing'
  ],
  'Physics': [
    'Mechanics',
    'Thermodynamics',
    'Electricity',
    'Magnetism',
    'Optics',
    'Modern Physics',
    'Waves and Sound'
  ],
  'Chemistry': [
    'Organic Chemistry',
    'Inorganic Chemistry',
    'Physical Chemistry',
    'Analytical Chemistry',
    'Biochemistry',
    'Environmental Chemistry'
  ],
  'Biology': [
    'Cell Biology',
    'Genetics',
    'Evolution',
    'Ecology',
    'Human Anatomy',
    'Plant Biology',
    'Animal Biology'
  ]
};

async function addSampleTopics() {
  try {
    console.log('🚀 Adding sample topics...');

    // Get all subjects
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('is_active', true);

    if (subjectsError) throw subjectsError;

    for (const subject of subjects) {
      const topicsForSubject = sampleTopics[subject.name];
      
      if (topicsForSubject) {
        console.log(`📚 Adding topics for ${subject.name}...`);
        
        const topicsToInsert = topicsForSubject.map((topicName, index) => ({
          subject_id: subject.id,
          name: topicName,
          order_index: index + 1,
          is_active: true
        }));

        const { error: insertError } = await supabase
          .from('topics')
          .insert(topicsToInsert);

        if (insertError) {
          console.error(`❌ Error adding topics for ${subject.name}:`, insertError);
        } else {
          console.log(`✅ Added ${topicsToInsert.length} topics for ${subject.name}`);
        }
      }
    }

    console.log('🎉 Sample topics added successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addSampleTopics();