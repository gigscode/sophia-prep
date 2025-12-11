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

// Simulate the exact same logic as the frontend
function normalizeQuestions(rows, filters) {
  const list = (rows || []).filter(r => !!r).map((r) => {
    const opts = [
      { key: 'A', text: r.option_a },
      { key: 'B', text: r.option_b },
      { key: 'C', text: r.option_c },
      { key: 'D', text: r.option_d },
    ].filter(o => !!o.text && String(o.text).trim().length > 0);
    
    let correct = r.correct_answer;
    if (correct && !['A', 'B', 'C', 'D'].includes(String(correct))) {
      const m = opts.find(o => String(o.text).trim().toLowerCase() === String(correct).trim().toLowerCase());
      correct = m?.key;
    }
    
    return {
      id: r.id,
      text: r.question_text || r.text || 'Question text missing',
      options: opts,
      correct: correct || undefined,
      explanation: r.explanation || undefined,
      exam_year: r.exam_year ?? null,
      exam_type: r.exam_type ?? null,
      subject_slug: r.subject_slug || undefined,
      subject_name: r.subject_name || undefined,
    };
  });
  
  const filtered = list.filter(q => (q.options?.length ?? 0) >= 2);
  const byYear = filters?.exam_year && filters.exam_year !== 'ALL' ? filtered.filter(q => q.exam_year === filters.exam_year) : filtered;
  const byType = filters?.exam_type && filters.exam_type !== 'ALL' ? byYear.filter(q => q.exam_type === filters.exam_type) : byYear;
  return byType;
}

async function simulateFrontendLoading() {
  try {
    console.log('🔍 SIMULATING FRONTEND QUESTION LOADING FOR MATHEMATICS 2022\n');

    // Step 1: Get Mathematics subject (same as frontend)
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

    console.log('✅ Step 1: Mathematics subject found');
    console.log(`   ID: ${mathSubject.id}`);
    console.log(`   Name: ${mathSubject.name}`);

    // Step 2: Simulate getQuestionsBySubjectSlug with filters
    const filters = {
      exam_type: 'JAMB', // Assuming JAMB since that's what has most questions
      exam_year: 2022,
      limit: 60
    };

    console.log('\n🔄 Step 2: Loading questions with filters:', filters);

    // This is the exact query the frontend makes
    let q = supabase
      .from('questions')
      .select('*')
      .eq('subject_id', mathSubject.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.exam_year) q = q.eq('exam_year', filters.exam_year);
    if (filters.exam_type) q = q.eq('exam_type', filters.exam_type);
    if (filters.limit) q = q.limit(filters.limit);

    const { data: rawQuestions, error: questionsError } = await q;

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
      return;
    }

    console.log(`✅ Step 2: Raw questions loaded: ${rawQuestions?.length || 0}`);

    if (!rawQuestions || rawQuestions.length === 0) {
      console.log('❌ No raw questions found - this would cause loading to hang');
      return;
    }

    // Step 3: Normalize questions (same as frontend)
    console.log('\n🔄 Step 3: Normalizing questions...');
    
    const normalized = normalizeQuestions(rawQuestions, {
      exam_type: filters.exam_type,
      exam_year: filters.exam_year
    });

    console.log(`✅ Step 3: Normalized questions: ${normalized.length}`);

    if (normalized.length === 0) {
      console.log('❌ No normalized questions - this would show "No questions available" error');
      return;
    }

    // Step 4: Analyze the questions
    console.log('\n📊 Step 4: Question Analysis');
    console.log(`Total questions after normalization: ${normalized.length}`);

    // Check for issues
    const questionsWithoutOptions = normalized.filter(q => !q.options || q.options.length < 2);
    const questionsWithoutCorrectAnswer = normalized.filter(q => !q.correct);
    const questionsWithoutText = normalized.filter(q => !q.text || q.text === 'Question text missing');

    console.log(`Questions without enough options: ${questionsWithoutOptions.length}`);
    console.log(`Questions without correct answer: ${questionsWithoutCorrectAnswer.length}`);
    console.log(`Questions without text: ${questionsWithoutText.length}`);

    // Show sample questions
    console.log('\n📝 Sample normalized questions:');
    normalized.slice(0, 3).forEach((q, i) => {
      console.log(`\n   ${i + 1}. ${q.text?.substring(0, 100)}...`);
      console.log(`      Options: ${q.options?.length || 0} (${q.options?.map(o => o.key).join(', ')})`);
      console.log(`      Correct: ${q.correct || 'MISSING'}`);
      console.log(`      Year: ${q.exam_year}, Type: ${q.exam_type}`);
    });

    // Check if questions look like Mathematics
    console.log('\n🔍 Content Analysis:');
    const mathKeywords = ['solve', 'calculate', 'equation', 'formula', 'number', 'algebra', 'geometry', 'trigonometry', 'logarithm', 'function'];
    const mathQuestions = normalized.filter(q => {
      const text = (q.text || '').toLowerCase();
      return mathKeywords.some(keyword => text.includes(keyword));
    });

    console.log(`Questions that appear to be Mathematics: ${mathQuestions.length}/${normalized.length}`);
    
    if (mathQuestions.length < normalized.length / 2) {
      console.log('⚠️  WARNING: Many questions may not be Mathematics questions!');
      
      // Show non-math questions
      const nonMathQuestions = normalized.filter(q => {
        const text = (q.text || '').toLowerCase();
        return !mathKeywords.some(keyword => text.includes(keyword));
      });
      
      console.log('\n❓ Sample non-Mathematics questions:');
      nonMathQuestions.slice(0, 3).forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.text?.substring(0, 100)}...`);
      });
    }

    console.log('\n✅ SIMULATION COMPLETE');
    console.log(`Result: ${normalized.length} questions would be loaded for the quiz`);

  } catch (error) {
    console.error('💥 Simulation failed:', error);
  }
}

simulateFrontendLoading();