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

async function verifyFix() {
  try {
    console.log('🔍 VERIFYING DATABASE FIX\n');

    // Get Mathematics subject
    const { data: mathSubject, error: subjectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('slug', 'mathematics')
      .single();

    if (subjectError) {
      console.error('❌ Error fetching Mathematics subject:', subjectError);
      return;
    }

    // Check current count of Mathematics questions for 2022
    const { count: math2022Count, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', mathSubject.id)
      .eq('exam_year', 2022);

    if (countError) {
      console.error('❌ Error counting questions:', countError);
      return;
    }

    console.log(`📊 Current Mathematics 2022 questions: ${math2022Count}`);

    // Get actual questions
    const { data: mathQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_text, exam_type')
      .eq('subject_id', mathSubject.id)
      .eq('exam_year', 2022)
      .limit(20);

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
      return;
    }

    console.log('\n📝 Current Mathematics 2022 questions:');
    (mathQuestions || []).forEach((q, i) => {
      console.log(`   ${i + 1}. ${q.question_text?.substring(0, 100)}... (${q.exam_type})`);
    });

    // Check English Language questions count
    const { data: englishSubject, error: englishSubjectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('slug', 'english-language')
      .single();

    if (!englishSubjectError && englishSubject) {
      const { count: english2022Count, error: englishCountError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', englishSubject.id)
        .eq('exam_year', 2022);

      if (!englishCountError) {
        console.log(`\n📚 English Language 2022 questions: ${english2022Count}`);
      }
    }

    // Check if the fix worked by testing the frontend query
    console.log('\n🧪 TESTING FRONTEND QUERY:');
    const { data: frontendResult, error: frontendError } = await supabase
      .from('questions')
      .select('*')
      .eq('subject_id', mathSubject.id)
      .eq('exam_year', 2022)
      .eq('exam_type', 'JAMB')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(60);

    if (frontendError) {
      console.error('❌ Frontend query error:', frontendError);
    } else {
      console.log(`✅ Frontend query would return: ${frontendResult?.length || 0} questions`);
      
      if (frontendResult && frontendResult.length > 0) {
        console.log('\n📝 Sample questions that would load:');
        frontendResult.slice(0, 3).forEach((q, i) => {
          console.log(`   ${i + 1}. ${q.question_text?.substring(0, 100)}...`);
        });
      }
    }

  } catch (error) {
    console.error('💥 Verification failed:', error);
  }
}

verifyFix();