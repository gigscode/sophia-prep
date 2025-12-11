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

async function detailedQuestionAnalysis() {
  try {
    console.log('🔍 DETAILED QUESTION DATABASE ANALYSIS\n');

    // Get total question count
    const { count: totalQuestions, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting total count:', countError);
      return;
    }

    console.log(`📊 TOTAL QUESTIONS IN DATABASE: ${totalQuestions}\n`);

    // Get all questions with subject details
    const { data: allQuestions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        subject_id,
        exam_type,
        is_active,
        subjects(name, slug, exam_type)
      `);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return;
    }

    // Analyze the data
    const analysis = {
      total: allQuestions.length,
      active: 0,
      inactive: 0,
      withSubject: 0,
      withoutSubject: 0,
      byExamType: { JAMB: 0, WAEC: 0, null: 0 },
      bySubject: {},
      orphanedQuestions: []
    };

    allQuestions.forEach(question => {
      // Active/Inactive count
      if (question.is_active) {
        analysis.active++;
      } else {
        analysis.inactive++;
      }

      // Subject linking
      if (question.subject_id && question.subjects) {
        analysis.withSubject++;
        const subjectName = question.subjects.name;
        
        if (!analysis.bySubject[subjectName]) {
          analysis.bySubject[subjectName] = {
            total: 0,
            active: 0,
            inactive: 0,
            JAMB: 0,
            WAEC: 0,
            unspecified: 0
          };
        }
        
        analysis.bySubject[subjectName].total++;
        
        if (question.is_active) {
          analysis.bySubject[subjectName].active++;
        } else {
          analysis.bySubject[subjectName].inactive++;
        }

        // Count by exam type
        if (question.exam_type === 'JAMB') {
          analysis.bySubject[subjectName].JAMB++;
        } else if (question.exam_type === 'WAEC') {
          analysis.bySubject[subjectName].WAEC++;
        } else {
          analysis.bySubject[subjectName].unspecified++;
        }
      } else {
        analysis.withoutSubject++;
        analysis.orphanedQuestions.push({
          id: question.id,
          exam_type: question.exam_type,
          is_active: question.is_active
        });
      }

      // Exam type count
      if (question.exam_type === 'JAMB') {
        analysis.byExamType.JAMB++;
      } else if (question.exam_type === 'WAEC') {
        analysis.byExamType.WAEC++;
      } else {
        analysis.byExamType.null++;
      }
    });

    // Display results
    console.log('📈 OVERALL STATISTICS:');
    console.log('='.repeat(50));
    console.log(`Total Questions: ${analysis.total}`);
    console.log(`Active Questions: ${analysis.active}`);
    console.log(`Inactive Questions: ${analysis.inactive}`);
    console.log(`Questions with Subject: ${analysis.withSubject}`);
    console.log(`Questions without Subject: ${analysis.withoutSubject}`);

    console.log('\n🎯 BY EXAM TYPE:');
    console.log('='.repeat(50));
    console.log(`JAMB: ${analysis.byExamType.JAMB} questions`);
    console.log(`WAEC: ${analysis.byExamType.WAEC} questions`);
    console.log(`Unspecified: ${analysis.byExamType.null} questions`);

    console.log('\n📚 BY SUBJECT (Detailed):');
    console.log('='.repeat(50));
    
    Object.entries(analysis.bySubject)
      .sort(([,a], [,b]) => b.total - a.total)
      .forEach(([subjectName, stats]) => {
        console.log(`\n📖 ${subjectName}:`);
        console.log(`   Total: ${stats.total} (Active: ${stats.active}, Inactive: ${stats.inactive})`);
        console.log(`   JAMB: ${stats.JAMB} | WAEC: ${stats.WAEC} | Unspecified: ${stats.unspecified}`);
      });

    if (analysis.orphanedQuestions.length > 0) {
      console.log('\n⚠️  ORPHANED QUESTIONS (No Subject Assigned):');
      console.log('='.repeat(50));
      console.log(`Found ${analysis.orphanedQuestions.length} questions without subject assignment:`);
      
      const orphanedByExamType = {
        JAMB: analysis.orphanedQuestions.filter(q => q.exam_type === 'JAMB').length,
        WAEC: analysis.orphanedQuestions.filter(q => q.exam_type === 'WAEC').length,
        null: analysis.orphanedQuestions.filter(q => !q.exam_type).length
      };
      
      console.log(`   JAMB: ${orphanedByExamType.JAMB}`);
      console.log(`   WAEC: ${orphanedByExamType.WAEC}`);
      console.log(`   Unspecified: ${orphanedByExamType.null}`);
      
      // Show first few orphaned question IDs
      console.log('\n   Sample orphaned question IDs:');
      analysis.orphanedQuestions.slice(0, 5).forEach(q => {
        console.log(`   • ${q.id} (${q.exam_type || 'No exam type'}, ${q.is_active ? 'Active' : 'Inactive'})`);
      });
      
      if (analysis.orphanedQuestions.length > 5) {
        console.log(`   ... and ${analysis.orphanedQuestions.length - 5} more`);
      }
    }

    console.log('\n🎮 QUIZ AVAILABILITY SUMMARY:');
    console.log('='.repeat(50));
    
    const availableSubjects = Object.entries(analysis.bySubject)
      .filter(([, stats]) => stats.active > 0)
      .sort(([,a], [,b]) => b.active - a.active);

    if (availableSubjects.length > 0) {
      console.log('✅ Subjects available for quizzes (active questions only):');
      availableSubjects.forEach(([subjectName, stats]) => {
        console.log(`   • ${subjectName}: ${stats.active} active questions`);
        if (stats.JAMB > 0) console.log(`     - JAMB: ${stats.JAMB} questions`);
        if (stats.WAEC > 0) console.log(`     - WAEC: ${stats.WAEC} questions`);
      });
    } else {
      console.log('❌ No subjects have active questions available for quizzes');
    }

  } catch (error) {
    console.error('Error in detailed analysis:', error);
  }
}

detailedQuestionAnalysis();