import { useState, useRef } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { showToast } from '../ui/Toast';
import { adminQuestionService, type QuestionInput } from '../../services/admin-question-service';
import { adminSubjectService } from '../../services/admin-subject-service';
import { adminTopicService } from '../../services/admin-topic-service';
import { Upload, FileText, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import type { Subject, Topic } from '../../integrations/supabase/types';

interface ImportQuestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportFormat = 'json' | 'csv';

interface ParsedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  exam_year?: number;
  exam_type?: 'JAMB' | 'WAEC';
  topic?: string;
  subject?: string;
}

export function ImportQuestionsDialog({ isOpen, onClose, onSuccess }: ImportQuestionsDialogProps) {
  const [format, setFormat] = useState<ImportFormat>('json');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = async () => {
    if (isOpen) {
      const fetchedSubjects = await adminSubjectService.getAllSubjects();
      setSubjects(fetchedSubjects);
    }
  };

  useState(() => {
    handleOpen();
  });

  const handleSubjectChange = async (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedTopic('');
    if (subjectId) {
      const fetchedTopics = await adminTopicService.getAllTopics(subjectId);
      setTopics(fetchedTopics);
    } else {
      setTopics([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const parseCSV = (text: string): ParsedQuestion[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV file must have at least a header row and one data row');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const questions: ParsedQuestion[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) continue;

      const question: any = {};
      headers.forEach((header, index) => {
        question[header] = values[index];
      });

      questions.push({
        question_text: question.question_text || question.question,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        correct_answer: (question.correct_answer || 'A').toUpperCase() as 'A' | 'B' | 'C' | 'D',
        explanation: question.explanation,
        exam_year: question.exam_year ? parseInt(question.exam_year) : undefined,
        exam_type: question.exam_type?.toUpperCase() as 'JAMB' | 'WAEC' | undefined,
        topic: question.topic,
        subject: question.subject,
      });
    }

    return questions;
  };

  const parseJSON = (text: string): ParsedQuestion[] => {
    const data = JSON.parse(text);

    // Handle different JSON formats
    if (Array.isArray(data)) {
      return data;
    } else if (typeof data === 'object') {
      // Handle format like { "mathematics": [...], "english": [...] }
      const allQuestions: ParsedQuestion[] = [];
      Object.keys(data).forEach(key => {
        if (Array.isArray(data[key])) {
          data[key].forEach((q: any) => {
            allQuestions.push({
              ...q,
              subject: q.subject || key,
            });
          });
        }
      });
      return allQuestions;
    }

    throw new Error('Invalid JSON format');
  };

  const handleImport = async () => {
    if (!file) {
      showToast('Please select a file to import', 'error');
      return;
    }

    if (!selectedTopic && !selectedSubject) {
      showToast('Please select a subject or topic', 'error');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      let parsedQuestions: ParsedQuestion[];

      if (format === 'csv') {
        parsedQuestions = parseCSV(text);
      } else {
        parsedQuestions = parseJSON(text);
      }

      // Convert to QuestionInput format
      const questionsToImport: QuestionInput[] = [];

      for (const pq of parsedQuestions) {
        let topicId = selectedTopic;

        // If no topic selected, try to find or create topic from question data
        if (!topicId && pq.topic) {
          const subjectId = selectedSubject || subjects.find(s =>
            s.name.toLowerCase() === pq.subject?.toLowerCase() ||
            s.slug.toLowerCase() === pq.subject?.toLowerCase()
          )?.id;

          if (subjectId) {
            let topic = topics.find(t => t.name.toLowerCase() === pq.topic.toLowerCase() && t.subject_id === subjectId);
            if (!topic) {
              // Create new topic
              topic = await adminTopicService.createTopic({
                subject_id: subjectId,
                name: pq.topic,
                description: `Auto-created from import`,
                order_index: 0,
                is_active: true,
              });
            }
            topicId = topic?.id || '';
          }
        }

        if (!topicId) {
          continue; // Skip questions without valid topic
        }

        questionsToImport.push({
          topic_id: topicId,
          question_text: pq.question_text,
          option_a: pq.option_a,
          option_b: pq.option_b,
          option_c: pq.option_c,
          option_d: pq.option_d,
          correct_answer: pq.correct_answer,
          explanation: pq.explanation,
          exam_year: pq.exam_year,
          exam_type: pq.exam_type,
          is_active: true,
        });
      }

      // Import questions
      const result = await adminQuestionService.importQuestions(questionsToImport);
      setImportResult(result);

      if (result.success > 0) {
        showToast(`Successfully imported ${result.success} questions`, 'success');
        onSuccess();
      }

      if (result.failed > 0) {
        showToast(`Failed to import ${result.failed} questions`, 'error');
      }
    } catch (error: any) {
      showToast(`Import failed: ${error.message}`, 'error');
      setImportResult({ success: 0, failed: 0, errors: [error.message] });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = (templateFormat: ImportFormat) => {
    let content = '';
    let filename = '';

    if (templateFormat === 'csv') {
      content = `question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,exam_year,exam_type,topic,subject
"What is 2 + 2?","2","3","4","5","C","Addition of two numbers","2023","JAMB","Arithmetic","Mathematics"
"Solve: x + 5 = 10","3","4","5","6","C","Subtract 5 from both sides: x = 10 - 5 = 5","2023","WAEC","Algebra","Mathematics"`;
      filename = 'questions_template.csv';
    } else {
      const template = [
        {
          question_text: "What is 2 + 2?",
          option_a: "2",
          option_b: "3",
          option_c: "4",
          option_d: "5",
          correct_answer: "C",
          explanation: "Addition of two numbers",
          exam_year: 2023,
          exam_type: "JAMB",
          topic: "Arithmetic",
          subject: "Mathematics"
        },
        {
          question_text: "Solve: x + 5 = 10",
          option_a: "3",
          option_b: "4",
          option_c: "5",
          option_d: "6",
          correct_answer: "C",
          explanation: "Subtract 5 from both sides: x = 10 - 5 = 5",
          exam_year: 2023,
          exam_type: "WAEC",
          topic: "Algebra",
          subject: "Mathematics"
        }
      ];
      content = JSON.stringify(template, null, 2);
      filename = 'questions_template.json';
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    setSelectedSubject('');
    setSelectedTopic('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Import Questions</h2>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Import Format</label>
            <div className="flex gap-4">
              <button
                onClick={() => setFormat('json')}
                className={`flex-1 p-4 border-2 rounded-lg flex items-center justify-center gap-2 ${format === 'json' ? 'border-[#B78628] bg-[#FDF6E8]' : 'border-gray-300'
                  }`}
              >
                <FileText className="w-5 h-5" />
                <span className="font-medium">JSON</span>
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={`flex-1 p-4 border-2 rounded-lg flex items-center justify-center gap-2 ${format === 'csv' ? 'border-[#B78628] bg-[#FDF6E8]' : 'border-gray-300'
                  }`}
              >
                <FileText className="w-5 h-5" />
                <span className="font-medium">CSV</span>
              </button>
            </div>
          </div>

          {/* Template Download */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-1">Download Template</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Download a template file to see the expected format for importing questions.
                </p>
                <Button
                  onClick={() => downloadTemplate(format)}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download {format.toUpperCase()} Template
                </Button>
              </div>
            </div>
          </div>

          {/* Subject and Topic Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Subject (Optional)</label>
              <Select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                options={[
                  { value: '', label: 'Select Subject' },
                  ...subjects.map(s => ({ value: s.id, label: s.name }))
                ]}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty if questions include subject/topic info
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Topic (Optional)</label>
              <Select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                options={[
                  { value: '', label: 'Select Topic' },
                  ...topics.map(t => ({ value: t.id, label: t.name }))
                ]}
                disabled={!selectedSubject}
              />
              <p className="text-xs text-gray-500 mt-1">
                Select a default topic for all questions
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Upload File</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#B78628] hover:bg-[#FDF6E8] transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              {file ? (
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-700">Click to upload {format.toUpperCase()} file</p>
                  <p className="text-sm text-gray-500">or drag and drop</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={format === 'json' ? '.json' : '.csv'}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Import Result */}
          {importResult && (
            <div className={`mb-6 p-4 rounded-lg ${importResult.success > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
              <div className="flex items-start gap-3">
                {importResult.success > 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="font-medium mb-2">Import Results</h3>
                  <p className="text-sm mb-2">
                    <span className="font-medium text-green-700">Success: {importResult.success}</span>
                    {' | '}
                    <span className="font-medium text-red-700">Failed: {importResult.failed}</span>
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Errors:</p>
                      <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                        {importResult.errors.slice(0, 10).map((error, index) => (
                          <li key={index} className="text-red-700">• {error}</li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li className="text-red-700">... and {importResult.errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button onClick={handleClose} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              style={{ backgroundColor: '#B78628', color: 'white' }}
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Questions
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


