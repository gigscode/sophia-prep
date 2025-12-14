#!/usr/bin/env node

/**
 * Link Existing Questions to Topics
 * Run with: node scripts/link-questions-to-topics.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function linkQuestionsToTopics() {
  try {
    console.log('🔗 Linking questions to topics...');

    // Get all subjects with their topics
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select(`
        id,
        name,
        topics:topics(id, name)
      `)
      .eq('is_active', true);

    if (subjectsError) throw subjectsError;

    for (const subject of subjects) {
      if (subject.topics && subject.topics.length > 0) {
        console.log(`📝 Processing ${subject.name}...`);

        // Get questions for this subject that don't have topic_id
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('id')
          .eq('subject_id', subject.id)
          .is('topic_id', null);

        if (questionsError) throw questionsError;

        if (questions && questions.length > 0) {
          // Randomly assign questions to topics for this subject
          const updates = questions.map(question => {
            const randomTopic = subject.topics[Math.floor(Math.random() * subject.topics.length)];
            return {
              id: question.id,
              topic_id: randomTopic.id
            };
          });

          // Update questions in batches
          const batchSize = 100;
          for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            
            const { error: updateError } = await supabase
              .from('questions')
              .upsert(batch);

            if (updateError) {
              console.error(`❌ Error updating batch for ${subject.name}:`, updateError);
            } else {
              console.log(`✅ Updated ${batch.length} questions for ${subject.name}`);
            }
          }
        }
      }
    }

    console.log('🎉 Questions linked to topics successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

linkQuestionsToTopics();