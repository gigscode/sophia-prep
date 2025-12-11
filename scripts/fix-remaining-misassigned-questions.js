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

async function fixRemainingMisassignedQuestions() {
  try {
    console.log('🔍 FIXING REMAINING MISASSIGNED QUESTIONS\n');

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
    const literatureSubject = subjects.find(s => s.slug === 'literature-in-english');

    if (!mathSubject || !englishSubject) {
      console.error('❌ Required subjects not found');
      return;
    }

    // Get remaining questions still assigned to Mathematics for 2022
    const { data: remainingQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d')
      .eq('subject_id', mathSubject.id)
      .eq('exam_year', 2022);

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
      return;
    }

    console.log(`📊 Found ${remainingQuestions?.length || 0} questions still assigned to Mathematics for 2022`);

    if (!remainingQuestions || remainingQuestions.length === 0) {
      console.log('✅ No more questions to fix!');
      return;
    }

    // Enhanced analysis with more keywords and patterns
    const subjectPatterns = {
      mathematics: {
        keywords: ['solve', 'calculate', 'equation', 'formula', 'number', 'algebra', 'geometry', 'trigonometry', 'logarithm', 'function', 'derivative', 'integral', 'matrix', 'vector', 'polynomial', 'fraction', 'decimal', 'percentage', 'ratio', 'proportion', 'angle', 'triangle', 'circle', 'square', 'rectangle', 'volume', 'area', 'perimeter', 'radius', 'diameter', 'circumference', 'sine', 'cosine', 'tangent', 'factorial', 'permutation', 'combination', 'probability', 'statistics', 'mean', 'median', 'mode', 'standard deviation'],
        patterns: [/\d+[\+\-\*\/]\d+/, /x\s*[\+\-\*\/=]/, /\d+x/, /\^\d+/, /\d+\.\d+/, /\d+%/]
      },
      english: {
        keywords: ['grammar', 'sentence', 'verb', 'noun', 'adjective', 'adverb', 'tense', 'clause', 'phrase', 'punctuation', 'pronoun', 'preposition', 'conjunction', 'article', 'subject', 'predicate', 'object', 'passive', 'active', 'plural', 'singular', 'past tense', 'present tense', 'future tense', 'gerund', 'participle', 'infinitive', 'syllable', 'vowel', 'consonant', 'phoneme', 'morpheme', 'syntax', 'semantics'],
        patterns: [/choose the correct/, /identify the/, /what is the.*of.*word/, /complete the sentence/, /fill in the blank/]
      },
      literature: {
        keywords: ['novel', 'character', 'narrator', 'plot', 'theme', 'author', 'protagonist', 'antagonist', 'setting', 'metaphor', 'symbolism', 'irony', 'allegory', 'personification', 'simile', 'alliteration', 'rhyme', 'meter', 'stanza', 'verse', 'prose', 'poetry', 'drama', 'tragedy', 'comedy', 'soliloquy', 'monologue', 'dialogue', 'flashback', 'foreshadowing', 'climax', 'resolution', 'conflict', 'mood', 'tone'],
        patterns: [/in the novel/, /the author/, /the character/, /the protagonist/, /the story/]
      },
      general: {
        keywords: ['passage', 'paragraph', 'text', 'reading', 'comprehension', 'according to', 'the writer', 'the author suggests', 'main idea', 'central theme', 'inference', 'conclusion', 'summary', 'title'],
        patterns: [/according to the passage/, /the passage suggests/, /the main idea/, /the best title/]
      }
    };

    const analysis = {
      mathematics: [],
      english: [],
      literature: [],
      general: [], // Reading comprehension - could go to English
      uncertain: []
    };

    remainingQuestions.forEach(q => {
      const text = (q.question_text || '').toLowerCase();
      const allOptions = [q.option_a, q.option_b, q.option_c, q.option_d].join(' ').toLowerCase();
      const fullText = text + ' ' + allOptions;

      let scores = {
        mathematics: 0,
        english: 0,
        literature: 0,
        general: 0
      };

      // Calculate keyword scores
      Object.keys(subjectPatterns).forEach(subject => {
        const pattern = subjectPatterns[subject];
        
        // Keyword matching
        scores[subject] += pattern.keywords.filter(keyword => fullText.includes(keyword)).length;
        
        // Pattern matching
        scores[subject] += pattern.patterns.filter(pattern => pattern.test(fullText)).length * 2; // Weight patterns higher
      });

      // Determine best match
      const maxScore = Math.max(...Object.values(scores));
      const bestMatch = Object.keys(scores).find(subject => scores[subject] === maxScore);

      if (maxScore === 0) {
        analysis.uncertain.push(q);
      } else {
        analysis[bestMatch].push(q);
      }
    });

    console.log('\n📈 ENHANCED ANALYSIS:');
    console.log(`   Mathematics questions: ${analysis.mathematics.length}`);
    console.log(`   English questions: ${analysis.english.length}`);
    console.log(`   Literature questions: ${analysis.literature.length}`);
    console.log(`   General/Reading questions: ${analysis.general.length}`);
    console.log(`   Still uncertain: ${analysis.uncertain.length}`);

    // Show samples
    Object.keys(analysis).forEach(category => {
      if (analysis[category].length > 0) {
        console.log(`\n📝 Sample ${category} questions:`);
        analysis[category].slice(0, 2).forEach((q, i) => {
          console.log(`   ${i + 1}. ${q.question_text?.substring(0, 80)}...`);
        });
      }
    });

    if (process.argv.includes('--fix')) {
      console.log('\n🔧 APPLYING COMPREHENSIVE FIXES...');
      
      let totalFixed = 0;

      // Move English questions to English Language
      if (analysis.english.length > 0) {
        const englishIds = analysis.english.map(q => q.id);
        const { error } = await supabase
          .from('questions')
          .update({ subject_id: englishSubject.id })
          .in('id', englishIds);
          
        if (error) {
          console.error('❌ Error moving English questions:', error);
        } else {
          console.log(`✅ Moved ${englishIds.length} questions to English Language`);
          totalFixed += englishIds.length;
        }
      }

      // Move Literature questions to Literature in English
      if (literatureSubject && analysis.literature.length > 0) {
        const literatureIds = analysis.literature.map(q => q.id);
        const { error } = await supabase
          .from('questions')
          .update({ subject_id: literatureSubject.id })
          .in('id', literatureIds);
          
        if (error) {
          console.error('❌ Error moving Literature questions:', error);
        } else {
          console.log(`✅ Moved ${literatureIds.length} questions to Literature in English`);
          totalFixed += literatureIds.length;
        }
      }

      // Move General/Reading comprehension questions to English Language
      if (analysis.general.length > 0) {
        const generalIds = analysis.general.map(q => q.id);
        const { error } = await supabase
          .from('questions')
          .update({ subject_id: englishSubject.id })
          .in('id', generalIds);
          
        if (error) {
          console.error('❌ Error moving General questions:', error);
        } else {
          console.log(`✅ Moved ${generalIds.length} reading comprehension questions to English Language`);
          totalFixed += generalIds.length;
        }
      }

      console.log(`\n🎉 COMPREHENSIVE FIXES APPLIED: ${totalFixed} questions reassigned`);
      console.log(`   Mathematics now has ${analysis.mathematics.length} actual math questions for 2022`);
      console.log(`   ${analysis.uncertain.length} questions still need manual review`);
      
      if (analysis.uncertain.length > 0) {
        console.log('\n❓ Remaining uncertain questions need manual classification:');
        analysis.uncertain.slice(0, 5).forEach((q, i) => {
          console.log(`   ${i + 1}. ${q.question_text?.substring(0, 100)}...`);
        });
      }
    } else {
      console.log('\n⚠️  Run with --fix flag to apply these corrections');
    }

  } catch (error) {
    console.error('💥 Fix failed:', error);
  }
}

fixRemainingMisassignedQuestions();