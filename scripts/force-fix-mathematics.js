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

async function forceFix() {
  try {
    console.log('🔧 FORCE FIXING MATHEMATICS QUESTIONS\n');

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

    console.log(`📚 Mathematics ID: ${mathSubject.id}`);
    console.log(`📝 English Language ID: ${englishSubject.id}`);

    // Get all Mathematics 2022 questions
    const { data: mathQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_text')
      .eq('subject_id', mathSubject.id)
      .eq('exam_year', 2022);

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
      return;
    }

    console.log(`📊 Found ${mathQuestions?.length || 0} questions in Mathematics 2022`);

    // Identify actual math questions
    const mathKeywords = ['solve', 'calculate', 'equation', 'find the value', 'x =', 'y =', 'factorize', 'formula', 'algebra', 'geometry'];
    
    const actualMathQuestions = [];
    const nonMathQuestions = [];

    (mathQuestions || []).forEach(q => {
      const text = (q.question_text || '').toLowerCase();
      const isMath = mathKeywords.some(keyword => text.includes(keyword));
      
      if (isMath) {
        actualMathQuestions.push(q);
      } else {
        nonMathQuestions.push(q);
      }
    });

    console.log(`✅ Actual Math questions: ${actualMathQuestions.length}`);
    console.log(`❌ Non-Math questions: ${nonMathQuestions.length}`);

    if (actualMathQuestions.length > 0) {
      console.log('\n📐 Keeping these Math questions:');
      actualMathQuestions.forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.question_text?.substring(0, 80)}...`);
      });
    }

    if (nonMathQuestions.length > 0 && process.argv.includes('--fix')) {
      console.log('\n🔧 Moving non-math questions to English Language...');
      
      // Move in batches to avoid timeout
      const batchSize = 10;
      let moved = 0;
      
      for (let i = 0; i < nonMathQuestions.length; i += batchSize) {
        const batch = nonMathQuestions.slice(i, i + batchSize);
        const batchIds = batch.map(q => q.id);
        
        console.log(`   Moving batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(nonMathQuestions.length/batchSize)} (${batchIds.length} questions)...`);
        
        const { error } = await supabase
          .from('questions')
          .update({ subject_id: englishSubject.id })
          .in('id', batchIds);
          
        if (error) {
          console.error(`❌ Error moving batch:`, error);
          break;
        } else {
          moved += batchIds.length;
          console.log(`   ✅ Moved ${batchIds.length} questions (Total: ${moved})`);
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`\n🎉 SUCCESSFULLY MOVED ${moved} questions to English Language`);
      console.log(`📐 Mathematics 2022 now has ${actualMathQuestions.length} actual math questions`);
      
      // Verify the fix
      const { count: newMathCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', mathSubject.id)
        .eq('exam_year', 2022);
        
      console.log(`✅ Verification: Mathematics 2022 now has ${newMathCount} questions`);
      
    } else if (!process.argv.includes('--fix')) {
      console.log('\n⚠️  Run with --fix flag to apply the changes');
    }

  } catch (error) {
    console.error('💥 Force fix failed:', error);
  }
}

forceFix();