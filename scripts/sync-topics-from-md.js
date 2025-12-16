#!/usr/bin/env node

/**
 * Sync topics from topics.md to the database
 * This script reads topics.md and ensures all topics exist in the database
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client - use the URL that matches the JWT ref
const supabaseUrl = 'https://rnxkkmdnmwhxdaofwtrf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJueGtrbWRubXdoeGRhb2Z3dHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDM3MzIsImV4cCI6MjA3OTA3OTczMn0.8RzSpFbTjxBVUK8Uj84SmAUlzhdGU6izb2dC1P5UXFA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Subject mapping from topics.md to database slugs
const subjectMapping = {
  'MATHEMATICS': 'mathematics',
  'PHYSICS': 'physics',
  'USE OF ENGLISH': 'english',
  'CHRISTIAN RELIGIOUS STUDIES': 'crs',
  'ECONOMICS': 'economics',
  'GEOGRAPHY': 'geography',
  'COMMERCE': 'commerce'
};

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseTopicsMd() {
  const filePath = join(__dirname, '..', 'topics.md');
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const topicsBySubject = {};
  let currentSubject = null;
  let orderIndex = 0;

  for (let line of lines) {
    line = line.trim();

    // Skip empty lines
    if (!line) {
      continue;
    }

    // Check if this is a subject header
    const subjectMatch = line.match(/^([A-Z\s]+)\s*[–-]\s*(TOPICS|JAMB SYLLABUS)/i);
    if (subjectMatch) {
      const subjectName = subjectMatch[1].trim();
      currentSubject = subjectMapping[subjectName];
      if (currentSubject) {
        topicsBySubject[currentSubject] = [];
        orderIndex = 0;
      }
      continue;
    }

    // If we have a current subject and this line looks like a topic
    if (currentSubject && line && !line.match(/^(TOPICS|JAMB SYLLABUS)/i)) {
      // Skip lines that are just the subject name repeated
      if (line.toLowerCase() === currentSubject.toLowerCase()) {
        continue;
      }

      // Clean up the topic name
      let topicName = line.trim();

      // Skip very short lines (likely formatting artifacts)
      if (topicName.length < 2) {
        continue;
      }

      // Fix known typos
      if (topicName === 'Representation of Dat') {
        topicName = 'Representation of Data';
      }
      if (topicName === 'Pressur') {
        topicName = 'Pressure';
      }
      if (topicName === 'G') {
        continue; // Skip this artifact
      }

      topicsBySubject[currentSubject].push({
        name: topicName,
        slug: slugify(topicName),
        order_index: orderIndex++
      });
    }
  }

  return topicsBySubject;
}

async function syncTopics() {
  console.log('🔄 Starting topics sync from topics.md...\n');

  // Parse topics from topics.md
  const topicsBySubject = parseTopicsMd();

  console.log('📋 Parsed topics from topics.md:');
  for (const [subjectSlug, topics] of Object.entries(topicsBySubject)) {
    console.log(`  - ${subjectSlug}: ${topics.length} topics`);
  }
  console.log('');

  // Fetch all subjects from database
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name, slug')
    .in('slug', Object.keys(topicsBySubject));

  if (subjectsError) {
    console.error('❌ Error fetching subjects:', subjectsError.message);
    return;
  }

  if (!subjects || subjects.length === 0) {
    console.error('❌ No subjects found in database');
    return;
  }

  console.log('✅ Found subjects in database:');
  subjects.forEach(s => console.log(`  - ${s.name} (${s.slug})`));
  console.log('');

  // Create a map of subject slug to ID
  const subjectIdMap = {};
  subjects.forEach(s => {
    subjectIdMap[s.slug] = s.id;
  });

  // Sync topics for each subject
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const [subjectSlug, topics] of Object.entries(topicsBySubject)) {
    const subjectId = subjectIdMap[subjectSlug];

    if (!subjectId) {
      console.warn(`⚠️  Subject ${subjectSlug} not found in database, skipping`);
      continue;
    }

    console.log(`\n📚 Syncing topics for ${subjectSlug}...`);

    for (const topic of topics) {
      // Check if topic already exists
      const { data: existingTopic } = await supabase
        .from('topics')
        .select('id')
        .eq('subject_id', subjectId)
        .eq('slug', topic.slug)
        .maybeSingle();

      if (existingTopic) {
        totalSkipped++;
        continue;
      }

      // Insert new topic
      const { error: insertError } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          name: topic.name,
          slug: topic.slug,
          order_index: topic.order_index,
          is_active: true
        });

      if (insertError) {
        console.error(`  ❌ Error creating topic "${topic.name}":`, insertError.message);
      } else {
        console.log(`  ✅ Created: ${topic.name}`);
        totalCreated++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Sync Summary:');
  console.log(`  ✅ Created: ${totalCreated} topics`);
  console.log(`  ⏭️  Skipped (already exist): ${totalSkipped} topics`);
  console.log('='.repeat(60));
}

syncTopics().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
