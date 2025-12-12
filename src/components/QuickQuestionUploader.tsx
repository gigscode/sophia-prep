/**
 * Quick Question Uploader - For testing the new schema
 */

import React, { useState } from 'react';
import { questionUploadService } from '../services/question-upload-service';

export const QuickQuestionUploader: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string>('');

  const uploadSampleQuestions = async () => {
    setUploading(true);
    setResult('Uploading sample questions...');

    try {
      // Sample questions for testing
      const sampleQuestions = [
        {
          subjectSlug: 'mathematics',
          examTypeSlug: 'jamb',
          questionText: 'What is 2 + 2?',
          optionA: '3',
          optionB: '4',
          optionC: '5',
          optionD: '6',
          correctAnswer: 'B' as const,
          explanation: '2 + 2 equals 4',
          difficultyLevel: 'EASY' as const,
          examYear: 2024
        },
        {
          subjectSlug: 'english',
          examTypeSlug: 'jamb',
          questionText: 'Which of the following is a noun?',
          optionA: 'Run',
          optionB: 'Beautiful',
          optionC: 'Book',
          optionD: 'Quickly',
          correctAnswer: 'C' as const,
          explanation: 'Book is a noun (a thing)',
          difficultyLevel: 'EASY' as const,
          examYear: 2024
        },
        {
          subjectSlug: 'physics',
          examTypeSlug: 'jamb',
          questionText: 'What is the unit of force?',
          optionA: 'Joule',
          optionB: 'Newton',
          optionC: 'Watt',
          optionD: 'Pascal',
          correctAnswer: 'B' as const,
          explanation: 'Newton is the SI unit of force',
          difficultyLevel: 'MEDIUM' as const,
          examYear: 2023
        },
        {
          subjectSlug: 'chemistry',
          examTypeSlug: 'jamb',
          questionText: 'What is the chemical symbol for water?',
          optionA: 'H2O',
          optionB: 'CO2',
          optionC: 'NaCl',
          optionD: 'O2',
          correctAnswer: 'A' as const,
          explanation: 'Water is H2O (2 hydrogen atoms + 1 oxygen atom)',
          difficultyLevel: 'EASY' as const,
          examYear: 2023
        },
        {
          subjectSlug: 'mathematics',
          examTypeSlug: 'waec',
          questionText: 'What is 5 × 6?',
          optionA: '25',
          optionB: '30',
          optionC: '35',
          optionD: '40',
          correctAnswer: 'B' as const,
          explanation: '5 × 6 = 30',
          difficultyLevel: 'EASY' as const,
          examYear: 2024
        }
      ];

      const uploadResult = await questionUploadService.uploadQuestionsBulk(sampleQuestions);

      if (uploadResult.success) {
        setResult(`✅ Success! Uploaded ${uploadResult.successfulUploads} questions. 
                   Failed: ${uploadResult.failedUploads}
                   ${uploadResult.errors.length > 0 ? '\nErrors: ' + uploadResult.errors.join('\n') : ''}`);
      } else {
        setResult(`❌ Upload failed: ${uploadResult.errors.join('\n')}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
      <h3 className="font-medium mb-2">📚 Quick Question Upload (For Testing)</h3>
      <p className="text-sm text-gray-600 mb-3">
        Upload 5 sample questions to test the new schema (2 JAMB Math, 1 each for English/Physics/Chemistry, 1 WAEC Math)
      </p>
      
      <button
        onClick={uploadSampleQuestions}
        disabled={uploading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-3"
      >
        {uploading ? 'Uploading...' : 'Upload Sample Questions'}
      </button>

      {result && (
        <div className="bg-white border rounded p-3">
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default QuickQuestionUploader;