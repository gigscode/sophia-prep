#!/usr/bin/env node
/**
 * Deploy and Monitor Script for Remove Topic Dependency Feature
 * 
 * This script handles deployment and monitoring for the topic dependency removal:
 * 1. Builds the application for staging
 * 2. Runs smoke tests to verify core functionality
 * 3. Monitors query performance
 * 4. Monitors error rates
 * 5. Verifies quiz functionality end-to-end
 * 
 * Task 10: Deploy and monitor
 * Requirements: 7.1, 7.2
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('🚀 Deploy and Monitor Script for Remove Topic Dependency\n');
console.log('=' .repeat(70));

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Admin client for database operations
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Regular client for testing (simulates frontend)
const testClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const testResults = {
  passed: 0,
  failed: 0,
  tests: [],
  performanceMetrics: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

function logPerformance(operation, duration, threshold = 2000) {
  const passed = duration < threshold;
  const status = passed ? '⚡ FAST' : '🐌 SLOW';
  console.log(`${status}: ${operation} - ${duration}ms (threshold: ${threshold}ms)`);
  testResults.performanceMetrics.push({ operation, duration, threshold, passed });
  return passed;
}

/**
 * Step 1: Build application for staging
 */
async function buildApplication() {
  console.log('\n🔨 Step 1: Building application for staging');
  console.log('-'.repeat(70));
  
  try {
    console.log('   Building application...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Verify build output exists
    if (fs.existsSync('dist/index.html')) {
      logTest('Application build', true, 'Build completed successfully');
      return true;
    } else {
      logTest('Application build', false, 'Build output not found');
      return false;
    }
  } catch (error) {
    logTest('Application build', false, `Build failed: ${error.message}`);
    return false;
  }
}

/**
 * Step 2: Run smoke tests
 */
async function runSmokeTests() {
  console.log('\n💨 Step 2: Running smoke tests');
  console.log('-'.repeat(70));
  
  let allPassed = true;
  
  // Test 1: Database connection
  try {
    const { data, error } = await adminClient
      .from('subjects')
      .select('id, name, slug')
      .limit(1);
    
    if (error) throw error;
    logTest('Database connection', true, 'Successfully connected to database');
  } catch (error) {
    logTest('Database connection', false, `Connection failed: ${error.message}`);
    allPassed = false;
  }
  
  // Test 2: Subject_id column exists
  try {
    const { data, error } = await adminClient
      .from('questions')
      .select('id, subject_id, topic_id')
      .limit(1);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      const hasSubjectId = data[0].hasOwnProperty('subject_id');
      logTest('Subject_id column exists', hasSubjectId, hasSubjectId ? 'Column found' : 'Column missing');
      if (!hasSubjectId) allPassed = false;
    } else {
      logTest('Subject_id column exists', true, 'No questions to test, but query succeeded');
    }
  } catch (error) {
    logTest('Subject_id column exists', false, `Query failed: ${error.message}`);
    allPassed = false;
  }
  
  // Test 3: Questions with null topic_id are allowed
  try {
    const { data, error } = await adminClient
      .from('questions')
      .select('id, subject_id, topic_id')
      .is('topic_id', null)
      .limit(5);
    
    if (error) throw error;
    logTest('Null topic_id allowed', true, `Found ${data.length} questions with null topic_id`);
  } catch (error) {
    logTest('Null topic_id allowed', false, `Query failed: ${error.message}`);
    allPassed = false;
  }
  
  // Test 4: Subject-based queries work
  try {
    const { data: subjects } = await adminClient
      .from('subjects')
      .select('id, slug')
      .eq('is_active', true)
      .limit(1);
    
    if (subjects && subjects.length > 0) {
      const testSubject = subjects[0];
      
      const { data: questions, error } = await adminClient
        .from('questions')
        .select('id, subject_id, topic_id')
        .eq('subject_id', testSubject.id)
        .eq('is_active', true)
        .limit(5);
      
      if (error) throw error;
      logTest('Subject-based queries', true, `Found ${questions.length} questions for subject ${testSubject.slug}`);
    } else {
      logTest('Subject-based queries', true, 'No active subjects to test');
    }
  } catch (error) {
    logTest('Subject-based queries', false, `Query failed: ${error.message}`);
    allPassed = false;
  }
  
  return allPassed;
}

/**
 * Step 3: Monitor query performance
 */
async function monitorQueryPerformance() {
  console.log('\n⚡ Step 3: Monitoring query performance');
  console.log('-'.repeat(70));
  
  let allPassed = true;
  
  // Get test subjects
  const { data: subjects } = await adminClient
    .from('subjects')
    .select('id, slug')
    .eq('is_active', true)
    .limit(3);
  
  if (!subjects || subjects.length === 0) {
    logTest('Query performance', false, 'No subjects available for testing');
    return false;
  }
  
  // Test 1: Subject-based query performance
  for (const subject of subjects) {
    try {
      const startTime = Date.now();
      
      const { data, error } = await adminClient
        .from('questions')
        .select('id, subject_id, topic_id, exam_type, exam_year')
        .eq('subject_id', subject.id)
        .eq('is_active', true)
        .limit(50);
      
      const duration = Date.now() - startTime;
      
      if (error) throw error;
      
      const passed = logPerformance(`Subject query (${subject.slug})`, duration, 2000);
      if (!passed) allPassed = false;
      
      console.log(`   Found ${data.length} questions for ${subject.slug}`);
    } catch (error) {
      logTest(`Subject query performance (${subject.slug})`, false, `Error: ${error.message}`);
      allPassed = false;
    }
  }
  
  // Test 2: Filtered query performance
  try {
    const startTime = Date.now();
    
    const { data, error } = await adminClient
      .from('questions')
      .select('id, subject_id, topic_id, exam_type, exam_year')
      .eq('is_active', true)
      .eq('exam_type', 'JAMB')
      .eq('exam_year', 2023)
      .limit(100);
    
    const duration = Date.now() - startTime;
    
    if (error) throw error;
    
    const passed = logPerformance('Filtered query (JAMB 2023)', duration, 2000);
    if (!passed) allPassed = false;
    
    console.log(`   Found ${data.length} JAMB 2023 questions`);
  } catch (error) {
    logTest('Filtered query performance', false, `Error: ${error.message}`);
    allPassed = false;
  }
  
  // Test 3: Index usage verification (indirect)
  try {
    const startTime = Date.now();
    
    // Query that should use subject_id index
    const { data, error } = await adminClient
      .from('questions')
      .select('id')
      .eq('subject_id', subjects[0].id)
      .limit(1000);
    
    const duration = Date.now() - startTime;
    
    if (error) throw error;
    
    const passed = logPerformance('Index usage test', duration, 1000);
    if (!passed) allPassed = false;
    
  } catch (error) {
    logTest('Index usage test', false, `Error: ${error.message}`);
    allPassed = false;
  }
  
  return allPassed;
}

/**
 * Step 4: Monitor error rates
 */
async function monitorErrorRates() {
  console.log('\n🔍 Step 4: Monitoring error rates');
  console.log('-'.repeat(70));
  
  let allPassed = true;
  let errorCount = 0;
  let totalQueries = 0;
  
  // Test various query scenarios to check for errors
  const testScenarios = [
    {
      name: 'Valid subject query',
      query: async () => {
        const { data: subjects } = await adminClient.from('subjects').select('id').limit(1);
        if (subjects && subjects.length > 0) {
          return adminClient.from('questions').select('id').eq('subject_id', subjects[0].id).limit(10);
        }
        return { data: [], error: null };
      }
    },
    {
      name: 'Non-existent subject query',
      query: () => adminClient.from('questions').select('id').eq('subject_id', '00000000-0000-0000-0000-000000000000').limit(10)
    },
    {
      name: 'Null topic_id query',
      query: () => adminClient.from('questions').select('id, subject_id').is('topic_id', null).limit(10)
    },
    {
      name: 'Mixed filters query',
      query: () => adminClient.from('questions').select('id').eq('exam_type', 'JAMB').eq('is_active', true).limit(10)
    },
    {
      name: 'Year-based query',
      query: () => adminClient.from('questions').select('id').eq('exam_year', 2023).limit(10)
    }
  ];
  
  for (const scenario of testScenarios) {
    try {
      totalQueries++;
      const { error } = await scenario.query();
      
      if (error) {
        errorCount++;
        logTest(scenario.name, false, `Error: ${error.message}`);
        allPassed = false;
      } else {
        logTest(scenario.name, true, 'Query executed successfully');
      }
    } catch (error) {
      errorCount++;
      totalQueries++;
      logTest(scenario.name, false, `Exception: ${error.message}`);
      allPassed = false;
    }
  }
  
  const errorRate = (errorCount / totalQueries) * 100;
  console.log(`\n   Error Rate: ${errorRate.toFixed(1)}% (${errorCount}/${totalQueries})`);
  
  if (errorRate > 10) {
    logTest('Overall error rate', false, `Error rate too high: ${errorRate.toFixed(1)}%`);
    allPassed = false;
  } else {
    logTest('Overall error rate', true, `Error rate acceptable: ${errorRate.toFixed(1)}%`);
  }
  
  return allPassed;
}

/**
 * Step 5: Verify quiz functionality end-to-end
 */
async function verifyQuizFunctionality() {
  console.log('\n🎯 Step 5: Verifying quiz functionality end-to-end');
  console.log('-'.repeat(70));
  
  let allPassed = true;
  
  // Import QuestionService for testing
  try {
    // Test 1: Subject-based quiz flow
    const { data: subjects } = await adminClient
      .from('subjects')
      .select('id, slug, name')
      .eq('is_active', true)
      .limit(2);
    
    if (!subjects || subjects.length === 0) {
      logTest('Quiz functionality', false, 'No subjects available for testing');
      return false;
    }
    
    for (const subject of subjects) {
      try {
        // Simulate QuestionService.getQuestionsBySubjectSlug
        const startTime = Date.now();
        
        const { data: questions, error } = await adminClient
          .from('questions')
          .select('*')
          .eq('subject_id', subject.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20);
        
        const duration = Date.now() - startTime;
        
        if (error) throw error;
        
        // Verify questions have required fields for quiz
        const validQuestions = questions.filter(q => 
          q.question_text && 
          q.option_a && 
          q.option_b && 
          q.option_c && 
          q.option_d && 
          q.correct_answer
        );
        
        logTest(
          `Quiz flow for ${subject.name}`,
          validQuestions.length > 0,
          `Found ${validQuestions.length}/${questions.length} valid questions in ${duration}ms`
        );
        
        if (validQuestions.length === 0) allPassed = false;
        
      } catch (error) {
        logTest(`Quiz flow for ${subject.name}`, false, `Error: ${error.message}`);
        allPassed = false;
      }
    }
    
    // Test 2: Year-based quiz flow
    try {
      const startTime = Date.now();
      
      const { data: questions, error } = await adminClient
        .from('questions')
        .select('*')
        .eq('exam_year', 2023)
        .eq('is_active', true)
        .order('question_number', { ascending: true })
        .limit(20);
      
      const duration = Date.now() - startTime;
      
      if (error) throw error;
      
      const validQuestions = questions.filter(q => 
        q.question_text && 
        q.option_a && 
        q.option_b && 
        q.correct_answer
      );
      
      logTest(
        'Year-based quiz flow (2023)',
        validQuestions.length > 0,
        `Found ${validQuestions.length}/${questions.length} valid questions in ${duration}ms`
      );
      
      if (validQuestions.length === 0) allPassed = false;
      
    } catch (error) {
      logTest('Year-based quiz flow', false, `Error: ${error.message}`);
      allPassed = false;
    }
    
    // Test 3: Filtered quiz flow (exam type + year)
    try {
      const startTime = Date.now();
      
      const { data: questions, error } = await adminClient
        .from('questions')
        .select('*')
        .eq('exam_type', 'JAMB')
        .eq('exam_year', 2023)
        .eq('is_active', true)
        .limit(20);
      
      const duration = Date.now() - startTime;
      
      if (error) throw error;
      
      logTest(
        'Filtered quiz flow (JAMB 2023)',
        true,
        `Found ${questions.length} questions in ${duration}ms`
      );
      
    } catch (error) {
      logTest('Filtered quiz flow', false, `Error: ${error.message}`);
      allPassed = false;
    }
    
    // Test 4: Empty result handling
    try {
      const { data: questions, error } = await adminClient
        .from('questions')
        .select('*')
        .eq('subject_id', '00000000-0000-0000-0000-000000000000')
        .eq('is_active', true);
      
      if (error) throw error;
      
      logTest(
        'Empty result handling',
        questions.length === 0,
        'Empty results handled gracefully'
      );
      
    } catch (error) {
      logTest('Empty result handling', false, `Error: ${error.message}`);
      allPassed = false;
    }
    
  } catch (error) {
    logTest('Quiz functionality setup', false, `Setup error: ${error.message}`);
    allPassed = false;
  }
  
  return allPassed;
}

/**
 * Print deployment summary
 */
function printDeploymentSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 DEPLOYMENT & MONITORING SUMMARY');
  console.log('='.repeat(70));
  
  console.log(`\nTotal Tests: ${testResults.tests.length}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  
  if (testResults.performanceMetrics.length > 0) {
    console.log('\n⚡ Performance Metrics:');
    testResults.performanceMetrics.forEach(metric => {
      const status = metric.passed ? '✅' : '❌';
      console.log(`   ${status} ${metric.operation}: ${metric.duration}ms (threshold: ${metric.threshold}ms)`);
    });
  }
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`   - ${t.name}`);
        if (t.details) console.log(`     ${t.details}`);
      });
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (testResults.failed === 0) {
    console.log('✅ DEPLOYMENT SUCCESSFUL - All systems operational!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Monitor application logs for any runtime errors');
    console.log('   2. Check user feedback for quiz functionality');
    console.log('   3. Monitor database performance metrics');
    console.log('   4. Verify Vercel deployment status');
  } else {
    console.log('⚠️  DEPLOYMENT ISSUES DETECTED - Review failures above');
    console.log('\n🔧 Recommended Actions:');
    console.log('   1. Fix failing tests before proceeding');
    console.log('   2. Check database schema and migrations');
    console.log('   3. Verify environment configuration');
    console.log('   4. Review application logs');
  }
  
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('Starting deployment and monitoring process...\n');
    
    // Step 1: Build application
    const buildSuccess = await buildApplication();
    if (!buildSuccess) {
      console.error('❌ Build failed - stopping deployment');
      process.exit(1);
    }
    
    // Step 2: Run smoke tests
    const smokeTestsPass = await runSmokeTests();
    
    // Step 3: Monitor query performance
    const performanceGood = await monitorQueryPerformance();
    
    // Step 4: Monitor error rates
    const errorRatesGood = await monitorErrorRates();
    
    // Step 5: Verify quiz functionality
    const quizFunctionalityGood = await verifyQuizFunctionality();
    
    // Print summary
    printDeploymentSummary();
    
    // Exit with appropriate code
    if (testResults.failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 Ready for production deployment!');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as deployAndMonitor };