#!/usr/bin/env node
/**
 * Count Questions by Subject
 * 
 * Shows the number of questions available for each subject
 */

import { createClient } from '@supabase/supabase-js';
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

async function countQuestions() {
  console.log('📊 Counting questions by subject...\n');
  
  // Get all subjects
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name, slug')
    .order('name');
  
  if (subjectsError) {
    console.error('❌ Error fetching subjects:', subjectsError);
    return;
  }
  
  let totalQuestions = 0;
  const subjectCounts = [];
  
  for (const subject of subjects) {
    // Get topics for this subject
    const { data: topics } = await supabase
      .from('topics')
      .select('id')
      .eq('subject_id', subject.id);
    
    if (!topics || topics.length === 0) {
      subjectCounts.push({ name: subject.name, count: 0, topics: 0 });
      continue;
    }
    
    const topicIds = topics.map(t => t.id);
    
    // Count questions for these topics
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .in('topic_id', topicIds)
      .eq('is_active', true);
    
    if (error) {
      console.error(`❌ Error counting questions for ${subject.name}:`, error);
      continue;
    }
    
    subjectCounts.push({ 
      name: subject.name, 
      count: count || 0,
      topics: topics.length
    });
    totalQuestions += count || 0;
  }
  
  // Sort by question count (descending)
  subjectCounts.sort((a, b) => b.count - a.count);
  
  console.log('=' .repeat(70));
  console.log('QUESTION COUNT BY SUBJECT');
  console.log('='.repeat(70));
  console.log(`${'Subject'.padEnd(30)} ${'Questions'.padEnd(15)} Topics`);
  console.log('-'.repeat(70));
  
  for (const { name, count, topics } of subjectCounts) {
    if (count > 0) {
      const status = count >= 100 ? '✅' : count >= 50 ? '⚠️' : '❌';
      console.log(`${status} ${name.padEnd(28)} ${String(count).padEnd(15)} ${topics}`);
    }
  }
  
  console.log('-'.repeat(70));
  console.log(`${'TOTAL'.padEnd(30)} ${String(totalQuestions).padEnd(15)}`);
  console.log('='.repeat(70));
  
  console.log('\n📈 Legend:');
  console.log('  ✅ 100+ questions (Target reached)');
  console.log('  ⚠️  50-99 questions (Needs more)');
  console.log('  ❌ <50 questions (Critical)');
  
  // Show subjects with no questions
  const emptySubjects = subjectCounts.filter(s => s.count === 0);
  if (emptySubjects.length > 0) {
    console.log('\n⚠️  Subjects with no questions:');
    emptySubjects.forEach(s => console.log(`  - ${s.name}`));
  }
}

countQuestions().catch(console.error);

