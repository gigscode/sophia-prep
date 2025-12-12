/**
 * Test Component for New Database Schema
 * Use this to test if everything is working correctly
 */

import React, { useState, useEffect } from 'react';
import { updatedSubjectService } from '../services/updated-subject-service';
import { updatedQuestionService } from '../services/updated-question-service';
import { examTypeService } from '../services/exam-type-service';
import QuickQuestionUploader from './QuickQuestionUploader';
import type { SubjectWithDetails, ExamTypeRecord } from '../types/database';

export const TestNewSchema: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectWithDetails[]>([]);
  const [examTypes, setExamTypes] = useState<ExamTypeRecord[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedExamType, setSelectedExamType] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableYears, setAvailableYears] = useState<Array<{examYear: number; questionCount: number}>>([]);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load exam types
      const examTypesData = await examTypeService.getAllExamTypes();
      setExamTypes(examTypesData);
      
      // Load subjects
      const subjectsData = await updatedSubjectService.getAllSubjectsWithDetails();
      setSubjects(subjectsData);
      
      addTestResult(`✅ Loaded ${examTypesData.length} exam types and ${subjectsData.length} subjects`);
    } catch (error) {
      addTestResult(`❌ Error loading initial data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Load available years when exam type changes
  useEffect(() => {
    if (selectedExamType) {
      loadAvailableYears();
    }
  }, [selectedExamType, selectedSubjects]);

  const loadAvailableYears = async () => {
    if (!selectedExamType) return;
    
    try {
      const years = await updatedQuestionService.getAvailableExamYears(
        selectedExamType,
        selectedSubjects.length > 0 ? selectedSubjects : undefined
      );
      setAvailableYears(years);
      addTestResult(`📅 Found ${years.length} available exam years for ${selectedExamType}`);
    } catch (error) {
      addTestResult(`❌ Error loading exam years: ${error}`);
    }
  };

  const testJAMBValidation = async () => {
    if (selectedSubjects.length === 0) {
      addTestResult('❌ Please select some subjects first');
      return;
    }

    try {
      const validation = await updatedSubjectService.validateJAMBSubjects(selectedSubjects);
      addTestResult(`🎯 JAMB Validation: ${validation.isValid ? '✅' : '❌'} ${validation.message}`);
    } catch (error) {
      addTestResult(`❌ JAMB validation error: ${error}`);
    }
  };

  const testPracticeQuestions = async () => {
    if (selectedSubjects.length === 0) {
      addTestResult('❌ Please select some subjects first');
      return;
    }

    try {
      setLoading(true);
      const questions = await updatedQuestionService.getPracticeQuestions(
        selectedSubjects,
        { limit: 5 }
      );
      addTestResult(`🎮 Practice Mode: Found ${questions.length} questions`);
      if (questions.length > 0) {
        addTestResult(`   First question: "${questions[0].question_text.substring(0, 50)}..."`);
      }
    } catch (error) {
      addTestResult(`❌ Practice questions error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testCBTQuestions = async () => {
    if (!selectedExamType || selectedSubjects.length === 0) {
      addTestResult('❌ Please select exam type and subjects first');
      return;
    }

    try {
      setLoading(true);
      const questions = await updatedQuestionService.getCBTExamQuestions(
        selectedExamType,
        selectedSubjects,
        { 
          limit: 10,
          examYear: selectedYear || undefined
        }
      );
      addTestResult(`🏆 CBT Mode: Found ${questions.length} questions for ${selectedExamType}${selectedYear ? ` (${selectedYear})` : ''}`);
      if (questions.length > 0) {
        addTestResult(`   First question: "${questions[0].question_text.substring(0, 50)}..."`);
      }
    } catch (error) {
      addTestResult(`❌ CBT questions error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 Test New Database Schema</h1>
      
      {/* Quick Question Uploader */}
      <QuickQuestionUploader />
      
      {/* Exam Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Exam Type:</label>
        <select 
          value={selectedExamType} 
          onChange={(e) => setSelectedExamType(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="">Choose exam type...</option>
          {examTypes.map(examType => (
            <option key={examType.id} value={examType.slug}>
              {examType.name} ({examType.slug})
            </option>
          ))}
        </select>
      </div>

      {/* Subject Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Subjects:</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded p-2">
          {subjects.map(subject => (
            <label key={subject.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedSubjects.includes(subject.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedSubjects(prev => [...prev, subject.id]);
                  } else {
                    setSelectedSubjects(prev => prev.filter(id => id !== subject.id));
                  }
                }}
              />
              <span className="text-sm">{subject.name}</span>
            </label>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Selected: {selectedSubjects.length} subjects
        </p>
      </div>

      {/* Exam Year Selection */}
      {availableYears.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Exam Year (Optional):</label>
          <select 
            value={selectedYear || ''} 
            onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="">Any year (mixed questions)</option>
            {availableYears.map(year => (
              <option key={year.examYear} value={year.examYear}>
                {year.examYear} ({year.questionCount} questions)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Test Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={testJAMBValidation}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test JAMB Validation
        </button>
        <button
          onClick={testPracticeQuestions}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Practice Questions
        </button>
        <button
          onClick={testCBTQuestions}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test CBT Questions
        </button>
        <button
          onClick={clearResults}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      {/* Test Results */}
      <div className="bg-gray-100 rounded p-4">
        <h3 className="font-medium mb-2">Test Results:</h3>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click the buttons above to test!</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded p-4">
            <p>Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestNewSchema;