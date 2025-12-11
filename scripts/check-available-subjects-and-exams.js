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

async function checkAvailableSubjectsAndExams() {
  try {
    console.log('🔍 Checking available subjects and exam types in your database...\n');

    // Get all subjects with question counts
    const { data: subjectsWithQuestions, error: subjectsError } = await supabase
      .from('subjects')
      .select(`
        id,
        name,
        slug,
        exam_type,
        subject_category,
        is_active,
        questions:questions(count)
      `);

    if (subjectsError) {
      console.error('Error fetching subjects:', subjectsError);
      return;
    }

    // Get question counts by exam type and subject
    const { data: questionStats, error: statsError } = await supabase
      .from('questions')
      .select('subject_id, exam_type, subjects(name, slug, exam_type)')
      .eq('is_active', true);

    if (statsError) {
      console.error('Error fetching question statistics:', statsError);
      return;
    }

    // Process the data
    const subjectStats = {};
    const examTypeStats = {
      JAMB: { subjects: new Set(), totalQuestions: 0 },
      WAEC: { subjects: new Set(), totalQuestions: 0 },
      BOTH: { subjects: new Set(), totalQuestions: 0 },
      null: { subjects: new Set(), totalQuestions: 0 }
    };

    questionStats.forEach(question => {
      const subjectName = question.subjects?.name || 'Unknown Subject';
      const examType = question.exam_type || 'Unspecified';
      
      // Count by subject
      if (!subjectStats[subjectName]) {
        subjectStats[subjectName] = {
          JAMB: 0,
          WAEC: 0,
          Unspecified: 0,
          total: 0
        };
      }
      
      if (examType === 'JAMB') {
        subjectStats[subjectName].JAMB++;
        examTypeStats.JAMB.subjects.add(subjectName);
        examTypeStats.JAMB.totalQuestions++;
      } else if (examType === 'WAEC') {
        subjectStats[subjectName].WAEC++;
        examTypeStats.WAEC.subjects.add(subjectName);
        examTypeStats.WAEC.totalQuestions++;
      } else {
        subjectStats[subjectName].Unspecified++;
        examTypeStats.null.subjects.add(subjectName);
        examTypeStats.null.totalQuestions++;
      }
      
      subjectStats[subjectName].total++;
    });

    // Display results
    console.log('📊 EXAM TYPES SUMMARY:');
    console.log('='.repeat(50));
    
    if (examTypeStats.JAMB.totalQuestions > 0) {
      console.log(`🎯 JAMB: ${examTypeStats.JAMB.totalQuestions} questions across ${examTypeStats.JAMB.subjects.size} subjects`);
    }
    
    if (examTypeStats.WAEC.totalQuestions > 0) {
      console.log(`📚 WAEC: ${examTypeStats.WAEC.totalQuestions} questions across ${examTypeStats.WAEC.subjects.size} subjects`);
    }
    
    if (examTypeStats.null.totalQuestions > 0) {
      console.log(`❓ Unspecified: ${examTypeStats.null.totalQuestions} questions across ${examTypeStats.null.subjects.size} subjects`);
    }

    console.log('\n📚 SUBJECTS WITH QUESTIONS:');
    console.log('='.repeat(50));

    const sortedSubjects = Object.entries(subjectStats)
      .sort(([,a], [,b]) => b.total - a.total);

    sortedSubjects.forEach(([subjectName, stats]) => {
      console.log(`\n📖 ${subjectName} (Total: ${stats.total})`);
      if (stats.JAMB > 0) console.log(`   • JAMB: ${stats.JAMB} questions`);
      if (stats.WAEC > 0) console.log(`   • WAEC: ${stats.WAEC} questions`);
      if (stats.Unspecified > 0) console.log(`   • Unspecified: ${stats.Unspecified} questions`);
    });

    // Show subjects without questions
    const subjectsWithoutQuestions = subjectsWithQuestions.filter(subject => {
      return !Object.keys(subjectStats).includes(subject.name);
    });

    if (subjectsWithoutQuestions.length > 0) {
      console.log('\n❌ SUBJECTS WITHOUT QUESTIONS:');
      console.log('='.repeat(50));
      subjectsWithoutQuestions.forEach(subject => {
        console.log(`• ${subject.name} (${subject.exam_type})`);
      });
    }

    // Summary for quiz attempts
    console.log('\n🎮 QUIZ ATTEMPT RECOMMENDATIONS:');
    console.log('='.repeat(50));
    
    const availableForJAMB = Array.from(examTypeStats.JAMB.subjects);
    const availableForWAEC = Array.from(examTypeStats.WAEC.subjects);
    
    if (availableForJAMB.length > 0) {
      console.log(`\n✅ You can attempt JAMB quizzes in these subjects:`);
      availableForJAMB.forEach(subject => {
        const count = subjectStats[subject]?.JAMB || 0;
        console.log(`   • ${subject} (${count} questions)`);
      });
    }
    
    if (availableForWAEC.length > 0) {
      console.log(`\n✅ You can attempt WAEC quizzes in these subjects:`);
      availableForWAEC.forEach(subject => {
        const count = subjectStats[subject]?.WAEC || 0;
        console.log(`   • ${subject} (${count} questions)`);
      });
    }

    const totalQuestions = Object.values(subjectStats).reduce((sum, stats) => sum + stats.total, 0);
    console.log(`\n📈 TOTAL: ${totalQuestions} questions across ${Object.keys(subjectStats).length} subjects`);

  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkAvailableSubjectsAndExams();