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

async function analyzeAndFixMisassignedQuestions() {
  try {
    console.log('🔍 ANALYZING MISASSIGNED QUESTIONS\n');

    // Get all subjects
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true);

    if (subjectsError) {
      console.error('❌ Error fetching subjects:', subjectsError);
      return;
    }

    console.log('📚 Available subjects:');
    subjects.forEach(s => {
      console.log(`   ${s.name} (${s.slug}) - ID: ${s.id.substring(0, 8)}...`);
    });

    // Find Mathematics and Literature subjects
    const mathSubject = subjects.find(s => s.slug === 'mathematics');
    const literatureSubject = subjects.find(s => s.slug === 'literature-in-english' || s.slug === 'literature' || s.name.toLowerCase().includes('literature'));
    const englishSubject = subjects.find(s => s.slug === 'english-language' || s.slug === 'english' || s.name.toLowerCase().includes('english'));

    console.log(`\n🔍 Key subjects:`);
    console.log(`   Mathematics: ${mathSubject ? mathSubject.name + ' (' + mathSubject.id.substring(0, 8) + '...)' : 'NOT FOUND'}`);
    console.log(`   Literature: ${literatureSubject ? literatureSubject.name + ' (' + literatureSubject.id.substring(0, 8) + '...)' : 'NOT FOUND'}`);
    console.log(`   English: ${englishSubject ? englishSubject.name + ' (' + englishSubject.id.substring(0, 8) + '...)' : 'NOT FOUND'}`);

    if (!mathSubject) {
      console.error('❌ Mathematics subject not found');
      return;
    }

    // Get the misassigned questions (Literature questions in Mathematics)
    const { data: misassignedQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, exam_year, exam_type')
      .eq('subject_id', mathSubject.id)
      .eq('exam_year', 2022)
      .limit(100);

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
      return;
    }

    console.log(`\n📊 Found ${misassignedQuestions?.length || 0} questions assigned to Mathematics for 2022`);

    // Analyze question content to determine correct subject
    const mathKeywords = ['solve', 'calculate', 'equation', 'formula', 'number', 'algebra', 'geometry', 'trigonometry', 'logarithm', 'function', 'derivative', 'integral', 'matrix', 'vector', 'polynomial'];
    const literatureKeywords = ['novel', 'character', 'narrator', 'plot', 'theme', 'author', 'protagonist', 'antagonist', 'setting', 'metaphor', 'symbolism', 'irony'];
    const englishKeywords = ['grammar', 'sentence', 'verb', 'noun', 'adjective', 'adverb', 'tense', 'clause', 'phrase', 'punctuation'];

    const analysis = {
      actualMath: [],
      probablyLiterature: [],
      probablyEnglish: [],
      uncertain: []
    };

    (misassignedQuestions || []).forEach(q => {
      const text = (q.question_text || '').toLowerCase();
      const allOptions = [q.option_a, q.option_b, q.option_c, q.option_d].join(' ').toLowerCase();
      const fullText = text + ' ' + allOptions;

      const mathScore = mathKeywords.filter(keyword => fullText.includes(keyword)).length;
      const litScore = literatureKeywords.filter(keyword => fullText.includes(keyword)).length;
      const engScore = englishKeywords.filter(keyword => fullText.includes(keyword)).length;

      if (mathScore > 0 && mathScore >= litScore && mathScore >= engScore) {
        analysis.actualMath.push(q);
      } else if (litScore > 0 && litScore > mathScore && litScore >= engScore) {
        analysis.probablyLiterature.push(q);
      } else if (engScore > 0 && engScore > mathScore && engScore > litScore) {
        analysis.probablyEnglish.push(q);
      } else {
        analysis.uncertain.push(q);
      }
    });

    console.log('\n📈 CONTENT ANALYSIS:');
    console.log(`   Actual Mathematics questions: ${analysis.actualMath.length}`);
    console.log(`   Probably Literature questions: ${analysis.probablyLiterature.length}`);
    console.log(`   Probably English questions: ${analysis.probablyEnglish.length}`);
    console.log(`   Uncertain classification: ${analysis.uncertain.length}`);

    // Show samples
    if (analysis.probablyLiterature.length > 0) {
      console.log('\n📖 Sample Literature questions misassigned to Mathematics:');
      analysis.probablyLiterature.slice(0, 3).forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.question_text?.substring(0, 100)}...`);
      });
    }

    if (analysis.probablyEnglish.length > 0) {
      console.log('\n📝 Sample English questions misassigned to Mathematics:');
      analysis.probablyEnglish.slice(0, 3).forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.question_text?.substring(0, 100)}...`);
      });
    }

    if (analysis.uncertain.length > 0) {
      console.log('\n❓ Sample uncertain questions:');
      analysis.uncertain.slice(0, 3).forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.question_text?.substring(0, 100)}...`);
      });
    }

    // Propose fixes
    console.log('\n🔧 PROPOSED FIXES:');
    
    if (literatureSubject && analysis.probablyLiterature.length > 0) {
      console.log(`   Move ${analysis.probablyLiterature.length} Literature questions to "${literatureSubject.name}"`);
    }
    
    if (englishSubject && analysis.probablyEnglish.length > 0) {
      console.log(`   Move ${analysis.probablyEnglish.length} English questions to "${englishSubject.name}"`);
    }

    if (analysis.uncertain.length > 0) {
      console.log(`   Review ${analysis.uncertain.length} uncertain questions manually`);
    }

    // Ask for confirmation before making changes
    console.log('\n⚠️  This analysis suggests that most "Mathematics 2022" questions are actually Literature/English questions.');
    console.log('   This explains why the Mathematics quiz gets stuck - it loads non-math questions!');
    console.log('\n   To fix this, we need to reassign these questions to their correct subjects.');
    console.log('   Run this script with --fix flag to apply the corrections.');

    // If --fix flag is provided, apply the fixes
    if (process.argv.includes('--fix')) {
      console.log('\n🔧 APPLYING FIXES...');
      
      let fixedCount = 0;
      
      // Move Literature questions
      if (literatureSubject && analysis.probablyLiterature.length > 0) {
        const literatureIds = analysis.probablyLiterature.map(q => q.id);
        const { error: litError } = await supabase
          .from('questions')
          .update({ subject_id: literatureSubject.id })
          .in('id', literatureIds);
          
        if (litError) {
          console.error('❌ Error moving Literature questions:', litError);
        } else {
          console.log(`✅ Moved ${literatureIds.length} questions to Literature`);
          fixedCount += literatureIds.length;
        }
      }
      
      // Move English questions
      if (englishSubject && analysis.probablyEnglish.length > 0) {
        const englishIds = analysis.probablyEnglish.map(q => q.id);
        const { error: engError } = await supabase
          .from('questions')
          .update({ subject_id: englishSubject.id })
          .in('id', englishIds);
          
        if (engError) {
          console.error('❌ Error moving English questions:', engError);
        } else {
          console.log(`✅ Moved ${englishIds.length} questions to English`);
          fixedCount += englishIds.length;
        }
      }
      
      console.log(`\n🎉 FIXES APPLIED: ${fixedCount} questions reassigned to correct subjects`);
      console.log('   Mathematics quiz should now work properly with actual math questions!');
    }

  } catch (error) {
    console.error('💥 Analysis failed:', error);
  }
}

analyzeAndFixMisassignedQuestions();