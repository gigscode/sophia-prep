#!/usr/bin/env node
/**
 * List all subjects in database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('📚 Fetching subjects from database...\n');

  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('name, slug, subject_category, exam_type')
    .order('sort_order');

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`Found ${subjects.length} subjects:\n`);
  
  subjects.forEach((subject, index) => {
    console.log(`${index + 1}. ${subject.name}`);
    console.log(`   Slug: ${subject.slug}`);
    console.log(`   Category: ${subject.subject_category}`);
    console.log(`   Exam Type: ${subject.exam_type}`);
    console.log('');
  });

  console.log('\n📝 Subject Slug Mapping for import script:\n');
  console.log('const subjectSlugs = {');
  
  const commonMappings = {
    'English Language': 'english',
    'Mathematics': 'mathematics',
    'Physics': 'physics',
    'Chemistry': 'chemistry',
    'Biology': 'biology',
    'Economics': 'economics',
    'Commerce': 'commerce',
    'Accounting': 'accounting',
    'Literature in English': 'literature',
    'Government': 'government',
    'Geography': 'geography',
    'Agricultural Science': 'agricultural-science',
    'History': 'history',
    'Christian Religious Studies': 'crs',
    'Islamic Religious Studies': 'irs'
  };

  subjects.forEach(subject => {
    const key = commonMappings[subject.name] || subject.slug;
    console.log(`  '${key}': '${subject.slug}',`);
  });
  
  console.log('};');
}

main().catch(console.error);

