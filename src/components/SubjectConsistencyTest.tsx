import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { updatedSubjectService } from '../services/updated-subject-service';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'loading';
  message: string;
}

export const SubjectConsistencyTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const testResults: TestResult[] = [];

    try {
      // Test 1: Check English Language subject exists with correct slug
      try {
        const englishSubject = await updatedSubjectService.getEnglishSubject();
        if (englishSubject && englishSubject.slug === 'english' && englishSubject.name === 'English Language') {
          testResults.push({
            test: 'English Language Subject',
            status: 'pass',
            message: `✅ Found: "${englishSubject.name}" with slug "${englishSubject.slug}"`
          });
        } else {
          testResults.push({
            test: 'English Language Subject',
            status: 'fail',
            message: `❌ English subject not found or incorrect configuration`
          });
        }
      } catch (error) {
        testResults.push({
          test: 'English Language Subject',
          status: 'fail',
          message: `❌ Error: ${error}`
        });
      }

      // Test 2: Check for duplicate English subjects
      try {
        const { data: englishSubjects } = await supabase
          .from('subjects')
          .select('*')
          .ilike('name', '%english%');

        if (englishSubjects && englishSubjects.length === 1) {
          testResults.push({
            test: 'No English Duplicates',
            status: 'pass',
            message: `✅ Only one English subject found`
          });
        } else {
          testResults.push({
            test: 'No English Duplicates',
            status: 'fail',
            message: `❌ Found ${englishSubjects?.length || 0} English subjects (should be 1)`
          });
        }
      } catch (error) {
        testResults.push({
          test: 'No English Duplicates',
          status: 'fail',
          message: `❌ Error checking duplicates: ${error}`
        });
      }

      // Test 3: Check Literature subject
      try {
        const { data: literatureSubjects } = await supabase
          .from('subjects')
          .select('*')
          .eq('slug', 'literature');

        if (literatureSubjects && literatureSubjects.length === 1) {
          const lit = literatureSubjects[0];
          if (lit.name === 'Literature in English') {
            testResults.push({
              test: 'Literature Subject',
              status: 'pass',
              message: `✅ Found: "${lit.name}" with slug "${lit.slug}"`
            });
          } else {
            testResults.push({
              test: 'Literature Subject',
              status: 'fail',
              message: `❌ Literature subject has wrong name: "${lit.name}"`
            });
          }
        } else {
          testResults.push({
            test: 'Literature Subject',
            status: 'fail',
            message: `❌ Found ${literatureSubjects?.length || 0} Literature subjects (should be 1)`
          });
        }
      } catch (error) {
        testResults.push({
          test: 'Literature Subject',
          status: 'fail',
          message: `❌ Error: ${error}`
        });
      }

      // Test 4: Check JAMB subjects
      try {
        const jambSubjects = await updatedSubjectService.getJAMBSubjects();
        const englishInJamb = jambSubjects.find(s => s.slug === 'english');
        const literatureInJamb = jambSubjects.find(s => s.slug === 'literature');

        if (englishInJamb && literatureInJamb) {
          testResults.push({
            test: 'JAMB Subjects Include Both',
            status: 'pass',
            message: `✅ Both English Language and Literature in English found in JAMB subjects`
          });
        } else {
          testResults.push({
            test: 'JAMB Subjects Include Both',
            status: 'fail',
            message: `❌ Missing subjects in JAMB list - English: ${!!englishInJamb}, Literature: ${!!literatureInJamb}`
          });
        }
      } catch (error) {
        testResults.push({
          test: 'JAMB Subjects Include Both',
          status: 'fail',
          message: `❌ Error: ${error}`
        });
      }

    } catch (error) {
      testResults.push({
        test: 'General Error',
        status: 'fail',
        message: `❌ Unexpected error: ${error}`
      });
    }

    setResults(testResults);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const allPassed = results.length > 0 && results.every(r => r.status === 'pass');

  return (
    <div className="bg-white border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Subject Consistency Test</h3>
        <button
          onClick={runTests}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className={`p-3 rounded ${allPassed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="font-medium">
              {allPassed ? '✅ All Tests Passed!' : '❌ Some Tests Failed'}
            </div>
          </div>

          {results.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded border ${
                result.status === 'pass'
                  ? 'bg-green-50 border-green-200'
                  : result.status === 'fail'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="font-medium">{result.test}</div>
              <div className="text-sm mt-1">{result.message}</div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Running consistency tests...</p>
        </div>
      )}
    </div>
  );
};

export default SubjectConsistencyTest;