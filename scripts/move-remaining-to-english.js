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

async function moveRemainingToEnglish() {
  try {
    console.log('🔍 MOVING REMAINING QUESTIONS TO ENGLISH\n');

    // Get subjects
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true);

    if (subjectsError) {
      console.error('❌ Error fetching subjects:', subjectsError);
      return;
    }

    const mathSubject = subjects.find(s => s.slug === 'mathematics');
    const englishSubject = subjects.find(s => s.slug === 'english-language');

    if (!mathSubject || !englishSubject) {
      console.error('❌ Required subjects not found');
      return;
    }

    // Get all remaining questions assigned to Mathematics for 2022
    const { data: remainingQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_text')
      .eq('subject_id', mathSubject.id)
      .eq('exam_year', 2022);

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
      return;
    }

    console.log(`📊 Found ${remainingQuestions?.length || 0} questions still assigned to Mathematics for 2022`);

    if (!remainingQuestions || remainingQuestions.length === 0) {
      console.log('✅ No more questions to move!');
      return;
    }

    // Check if any are actually mathematics
    const mathKeywords = ['solve', 'calculate', 'equation', 'formula', 'find the value', 'x =', 'y =', '+', '-', '*', '/', '=', 'algebra', 'geometry', 'trigonometry'];
    const actualMathQuestions = remainingQuestions.filter(q => {
      const text = (q.question_text || '').toLowerCase();
      return mathKeywords.some(keyword => text.includes(keyword));
    });

    const nonMathQuestions = remainingQuestions.filter(q => {
      const text = (q.question_text || '').toLowerCase();
      return !mathKeywords.some(keyword => text.includes(keyword));
    });

    console.log(`📈 FINAL ANALYSIS:`);
    console.log(`   Actual Mathematics questions: ${actualMathQuestions.length}`);
    console.log(`   Non-Mathematics questions: ${nonMathQuestions.length}`);

    if (actualMathQuestions.length > 0) {
      console.log('\n✅ Keeping these Mathematics questions:');
      actualMathQuestions.slice(0, 5).forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.question_text?.substring(0, 80)}...`);
      });
    }

    if (nonMathQuestions.length > 0) {
      console.log('\n📝 Moving these to English Language:');
      nonMathQuestions.slice(0, 5).forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.question_text?.substring(0, 80)}...`);
      });

      if (process.argv.includes('--fix')) {
        console.log('\n🔧 MOVING NON-MATH QUESTIONS TO ENGLISH...');
        
        const nonMathIds = nonMathQuestions.map(q => q.id);
        const { error } = await supabase
          .from('questions')
          .update({ subject_id: englishSubject.id })
          .in('id', nonMathIds);
          
        if (error) {
          console.error('❌ Error moving questions:', error);
        } else {
          console.log(`✅ Moved ${nonMathIds.length} questions to English Language`);
          console.log(`🎉 Mathematics now has only ${actualMathQuestions.length} actual math questions for 2022`);
        }
      } else {
        console.log('\n⚠️  Run with --fix flag to move these questions');
      }
    }

  } catch (error) {
    console.error('💥 Move failed:', error);
  }
}

moveRemainingToEnglish();