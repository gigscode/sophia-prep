import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugMathematics2022() {
  try {
    console.log('🔍 DEBUGGING MATHEMATICS 2022 QUESTIONS\n');

    // First, get the Mathematics subject
    const { data: mathSubject, error: subjectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('slug', 'mathematics')
      .eq('is_active', true)
      .single();

    if (subjectError) {
      console.error('❌ Error fetching Mathematics subject:', subjectError);
      return;
    }

    if (!mathSubject) {
      console.error('❌ Mathematics subject not found');
      return;
    }

    console.log('✅ Mathematics subject found:');
    console.log(`   ID: ${mathSubject.id}`);
    console.log(`   Name: ${mathSubject.name}`);
    console.log(`   Slug: ${mathSubject.slug}`);
    console.log(`   Exam Type: ${mathSubject.exam_type}`);

    // Check all questions for Mathematics
    const { data: allMathQuestions, error: allQuestionsError } = await supabase
      .from('questions')
      .select('id, exam_year, exam_type, is_active, question_text')
      .eq('subject_id', mathSubject.id)
      .eq('is_active', true)
      .order('exam_year', { ascending: false });

    if (allQuestionsError) {
      console.error('❌ Error fetching all Mathematics questions:', allQuestionsError);
      return;
    }

    console.log(`\n📊 ALL MATHEMATICS QUESTIONS: ${allMathQuestions?.length || 0}`);
    
    // Group by year and exam type
    const questionsByYear = {};
    (allMathQuestions || []).forEach(q => {
      const year = q.exam_year || 'No Year';
      const examType = q.exam_type || 'No Type';
      
      if (!questionsByYear[year]) {
        questionsByYear[year] = {};
      }
      if (!questionsByYear[year][examType]) {
        questionsByYear[year][examType] = 0;
      }
      questionsByYear[year][examType]++;
    });

    console.log('\n📅 QUESTIONS BY YEAR AND EXAM TYPE:');
    Object.keys(questionsByYear)
      .sort((a, b) => {
        if (a === 'No Year') return 1;
        if (b === 'No Year') return -1;
        return Number(b) - Number(a);
      })
      .forEach(year => {
        console.log(`\n   ${year}:`);
        Object.entries(questionsByYear[year]).forEach(([examType, count]) => {
          console.log(`     ${examType}: ${count} questions`);
        });
      });

    // Specifically check for 2022 questions
    const { data: math2022Questions, error: math2022Error } = await supabase
      .from('questions')
      .select('id, exam_type, question_text, option_a, option_b, option_c, option_d, correct_answer')
      .eq('subject_id', mathSubject.id)
      .eq('exam_year', 2022)
      .eq('is_active', true);

    if (math2022Error) {
      console.error('❌ Error fetching Mathematics 2022 questions:', math2022Error);
      return;
    }

    console.log(`\n🎯 MATHEMATICS 2022 QUESTIONS: ${math2022Questions?.length || 0}`);
    
    if (math2022Questions && math2022Questions.length > 0) {
      console.log('\n📝 Sample 2022 questions:');
      math2022Questions.slice(0, 3).forEach((q, i) => {
        console.log(`\n   ${i + 1}. ${q.question_text?.substring(0, 100)}...`);
        console.log(`      Exam Type: ${q.exam_type}`);
        console.log(`      Options: A) ${q.option_a?.substring(0, 30)}...`);
        console.log(`      Correct: ${q.correct_answer}`);
      });
    } else {
      console.log('❌ No Mathematics questions found for 2022');
    }

    // Test the exact query that the frontend would make
    console.log('\n🧪 TESTING FRONTEND QUERY SIMULATION:');
    
    // Simulate getQuestionsBySubjectSlug with 2022 filter
    const { data: frontendSimulation, error: frontendError } = await supabase
      .from('questions')
      .select('*')
      .eq('subject_id', mathSubject.id)
      .eq('exam_year', 2022)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (frontendError) {
      console.error('❌ Frontend simulation error:', frontendError);
    } else {
      console.log(`✅ Frontend simulation returned: ${frontendSimulation?.length || 0} questions`);
    }

    // Check if there are any questions without exam_year set
    const { data: questionsWithoutYear, error: noYearError } = await supabase
      .from('questions')
      .select('id, exam_type, question_text')
      .eq('subject_id', mathSubject.id)
      .is('exam_year', null)
      .eq('is_active', true)
      .limit(5);

    if (!noYearError && questionsWithoutYear && questionsWithoutYear.length > 0) {
      console.log(`\n⚠️  Found ${questionsWithoutYear.length} Mathematics questions without exam_year:`);
      questionsWithoutYear.forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.question_text?.substring(0, 80)}... (${q.exam_type || 'No Type'})`);
      });
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugMathematics2022();