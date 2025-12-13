/**
 * Sophia Prep - Subject Seeding Verification Script
 * 
 * This script verifies that all JAMB subjects have been seeded
 * into the database.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Expected subjects data
const expectedSubjects = [
  { name: 'English Language', slug: 'english-language', exam_type: 'BOTH', subject_category: 'GENERAL', is_mandatory: true },
  { name: 'Mathematics', slug: 'mathematics', exam_type: 'BOTH', subject_category: 'GENERAL', is_mandatory: false },
  { name: 'Physics', slug: 'physics', exam_type: 'BOTH', subject_category: 'SCIENCE', is_mandatory: false },
  { name: 'Chemistry', slug: 'chemistry', exam_type: 'BOTH', subject_category: 'SCIENCE', is_mandatory: false },
  { name: 'Biology', slug: 'biology', exam_type: 'BOTH', subject_category: 'SCIENCE', is_mandatory: false },
  { name: 'Further Mathematics', slug: 'further-mathematics', exam_type: 'BOTH', subject_category: 'SCIENCE', is_mandatory: false },
  { name: 'Geography', slug: 'geography', exam_type: 'BOTH', subject_category: 'GENERAL', is_mandatory: false },

  { name: 'Commerce', slug: 'commerce', exam_type: 'BOTH', subject_category: 'COMMERCIAL', is_mandatory: false },
  { name: 'Accounting', slug: 'accounting', exam_type: 'BOTH', subject_category: 'COMMERCIAL', is_mandatory: false },
  { name: 'Economics', slug: 'economics', exam_type: 'BOTH', subject_category: 'COMMERCIAL', is_mandatory: false },

  { name: 'Literature in English', slug: 'literature-in-english', exam_type: 'BOTH', subject_category: 'ARTS', is_mandatory: false },
  { name: 'Government', slug: 'government', exam_type: 'BOTH', subject_category: 'ARTS', is_mandatory: false },
  { name: 'CRS/IRS', slug: 'crs-irs', exam_type: 'BOTH', subject_category: 'ARTS', is_mandatory: false },

  { name: 'Yoruba', slug: 'yoruba', exam_type: 'BOTH', subject_category: 'LANGUAGE', is_mandatory: false },
  { name: 'Hausa', slug: 'hausa', exam_type: 'BOTH', subject_category: 'LANGUAGE', is_mandatory: false },
  { name: 'Igbo', slug: 'igbo', exam_type: 'BOTH', subject_category: 'LANGUAGE', is_mandatory: false },
];

async function verifySubjects() {
  console.log('🔍 Verifying JAMB subjects seeding...\n');

  try {
    // Query all subjects
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('name, slug, exam_type, subject_category, is_mandatory, is_active, sort_order')
      .order('sort_order');

    if (error) {
      console.error('❌ Error querying subjects:', error.message);
      return false;
    }

    if (!subjects || subjects.length === 0) {
      console.error('❌ No subjects found in database');
      console.log('\n📋 Please run the complete_setup.sql script in Supabase SQL Editor:');
      console.log('   File: supabase/migrations/complete_setup.sql');
      console.log('   URL: https://rnxkkmdnmwhxdaofwtrf.supabase.co');
      return false;
    }

    console.log(`✅ Found ${subjects.length} subjects in database\n`);

    // Verify count
    if (subjects.length !== 16) {
      console.warn(`⚠️  Warning: Expected 16 subjects, found ${subjects.length}`);
    }

    // Verify each subject category
    const categoryCounts = {
      GENERAL: 0,
      SCIENCE: 0,
      COMMERCIAL: 0,
      ARTS: 0,
      LANGUAGE: 0,
    };

    const examTypeCounts = {
      JAMB: 0,
      BOTH: 0,
    };

    subjects.forEach(subject => {
      categoryCounts[subject.subject_category]++;
      examTypeCounts[subject.exam_type]++;
    });

    console.log('📊 Subject Categories:');
    console.log(`   GENERAL: ${categoryCounts.GENERAL} subjects`);
    console.log(`   SCIENCE: ${categoryCounts.SCIENCE} subjects`);
    console.log(`   COMMERCIAL: ${categoryCounts.COMMERCIAL} subjects`);
    console.log(`   ARTS: ${categoryCounts.ARTS} subjects`);
    console.log(`   LANGUAGE: ${categoryCounts.LANGUAGE} subjects`);

    console.log('\n📊 Exam Types:');
    console.log(`   JAMB: ${examTypeCounts.JAMB} subjects`);
    console.log(`   BOTH (JAMB compatible): ${examTypeCounts.BOTH} subjects`);

    // Verify mandatory subject
    const mandatorySubjects = subjects.filter(s => s.is_mandatory);
    console.log(`\n✅ Mandatory subjects: ${mandatorySubjects.length}`);
    mandatorySubjects.forEach(s => {
      console.log(`   - ${s.name}`);
    });

    // Check for missing subjects
    const missingSubjects = expectedSubjects.filter(
      expected => !subjects.find(s => s.slug === expected.slug)
    );

    if (missingSubjects.length > 0) {
      console.log('\n⚠️  Missing subjects:');
      missingSubjects.forEach(s => {
        console.log(`   - ${s.name} (${s.slug})`);
      });
      return false;
    }

    // Display all subjects
    console.log('\n📚 All Subjects:');
    subjects.forEach((subject, index) => {
      const mandatoryFlag = subject.is_mandatory ? '⭐' : '  ';
      console.log(`   ${mandatoryFlag} ${index + 1}. ${subject.name} (${subject.exam_type}, ${subject.subject_category})`);
    });

    console.log('\n✅ All JAMB subjects have been successfully seeded!');
    console.log('✅ Task 1.6 Complete: Seed JAMB subjects data');
    
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run verification
verifySubjects()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
