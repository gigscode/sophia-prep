import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { showToast } from '../components/ui/Toast';
import { adminQuestionService, type QuestionInput } from '../services/admin-question-service';
import { adminSubjectService } from '../services/admin-subject-service';

import { Upload, FileText, Download, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import type { Subject } from '../integrations/supabase/types';
import { Card } from '../components/ui/Card';
import { createFormPersistence } from '../utils/form-state-persistence';

type ImportFormat = 'json' | 'csv' | 'simple';

interface ParsedQuestion {
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: 'A' | 'B' | 'C' | 'D';
    explanation?: string;
    exam_year?: number;
    exam_type?: 'JAMB';
    topic?: string;
    subject?: string;
}

// Validation helper
const validateQuestion = (q: Record<string, unknown>, index: number): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const prefix = `Question ${index + 1}`;

    if (!q.question_text || typeof q.question_text !== 'string' || !q.question_text.trim()) {
        errors.push(`${prefix}: Missing or invalid question_text`);
    }
    if (!q.option_a || typeof q.option_a !== 'string' || !q.option_a.trim()) {
        errors.push(`${prefix}: Missing or invalid option_a`);
    }
    if (!q.option_b || typeof q.option_b !== 'string' || !q.option_b.trim()) {
        errors.push(`${prefix}: Missing or invalid option_b`);
    }
    if (!q.option_c || typeof q.option_c !== 'string' || !q.option_c.trim()) {
        errors.push(`${prefix}: Missing or invalid option_c`);
    }
    if (!q.option_d || typeof q.option_d !== 'string' || !q.option_d.trim()) {
        errors.push(`${prefix}: Missing or invalid option_d`);
    }
    if (!q.correct_answer || typeof q.correct_answer !== 'string' || !['A', 'B', 'C', 'D'].includes(q.correct_answer.toUpperCase())) {
        errors.push(`${prefix}: Missing or invalid correct_answer (must be A, B, C, or D)`);
    }

    return { valid: errors.length === 0, errors };
};

export function ImportQuestionsPage() {
    const navigate = useNavigate();
    const [format, setFormat] = useState<ImportFormat>('json');
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedExamType, setSelectedExamType] = useState<'JAMB' | ''>('JAMB');
    const [selectedExamYear, setSelectedExamYear] = useState<string>('');
    const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [textInput, setTextInput] = useState('');
    const [importMode, setImportMode] = useState<'file' | 'text'>('file');
    const [previewValidation, setPreviewValidation] = useState<{
        totalQuestions: number;
        validQuestions: number;
        warnings: string[];
        suggestions: Array<{
            questionPreview: string;
            currentSubject: string;
            suggestedSubject: string;
            confidence: number;
        }>;
    } | null>(null);

    // Form state persistence
    const formPersistence = createFormPersistence('importQuestions');

    useEffect(() => {
        loadSubjects();
        
        // Load saved form state
        const savedState = formPersistence.restoreFormState();
        if (savedState) {
            if (savedState.selectedSubject) setSelectedSubject(savedState.selectedSubject);
            if (savedState.selectedExamType) setSelectedExamType(savedState.selectedExamType as 'JAMB');
            if (savedState.selectedExamYear) setSelectedExamYear(savedState.selectedExamYear);
            if (savedState.format) setFormat(savedState.format as ImportFormat);
            if (savedState.importMode) setImportMode(savedState.importMode as 'file' | 'text');
        }
    }, [formPersistence]);

    const loadSubjects = async () => {
        try {
            const fetchedSubjects = await adminSubjectService.getAllSubjects();
            setSubjects(fetchedSubjects);
        } catch (error) {
            console.error('Failed to load subjects:', error);
            showToast('Failed to load subjects', 'error');
        }
    };

    const handleSubjectChange = async (subjectId: string) => {
        setSelectedSubject(subjectId);
        // Auto-save form state
        formPersistence.autoSaveFormState({
            selectedSubject: subjectId,
            selectedExamType,
            selectedExamYear,
            format,
            importMode
        });
        
        // Clear previous validation when subject changes
        setPreviewValidation(null);
    };

    const validateContent = async () => {
        if (!selectedSubject) {
            showToast('Please select a subject first', 'error');
            return;
        }

        try {
            let text = '';
            if (importMode === 'file' && file) {
                text = await file.text();
            } else if (importMode === 'text' && textInput.trim()) {
                text = textInput;
            } else {
                showToast('Please provide content to validate', 'error');
                return;
            }

            let parsedQuestions: ParsedQuestion[];

            // Parse questions based on format
            if (format === 'csv') {
                parsedQuestions = parseCSV(text);
            } else if (format === 'simple') {
                parsedQuestions = parseSimpleText(text);
            } else {
                parsedQuestions = parseJSON(text);
            }

            // Get subject slug for validation
            const selectedSubjectObj = subjects.find(s => s.id === selectedSubject);
            if (!selectedSubjectObj) {
                showToast('Selected subject not found', 'error');
                return;
            }

            // Content validation disabled - trust user's subject selection
            setPreviewValidation({
                totalQuestions: parsedQuestions.length,
                validQuestions: parsedQuestions.length, // All questions are considered valid
                warnings: [],
                suggestions: []
            });

            showToast(`Ready to import ${parsedQuestions.length} questions to ${selectedSubjectObj.name}`, 'success');

        } catch (error: unknown) {
            showToast(`Validation failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
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

            const question: Record<string, string> = {};
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
                exam_type: 'JAMB',
                topic: question.topic,
                subject: question.subject,
            });
        }

        return questions;
    };

    const parseJSON = (text: string): ParsedQuestion[] => {
        try {
            const data = JSON.parse(text);
            const questions: ParsedQuestion[] = [];
            const validationErrors: string[] = [];

            // Handle different JSON formats
            if (Array.isArray(data)) {
                data.forEach((q: Record<string, unknown>, index) => {
                    const validation = validateQuestion(q, index);
                    if (validation.valid) {
                        questions.push({
                            question_text: String(q.question_text).trim(),
                            option_a: String(q.option_a).trim(),
                            option_b: String(q.option_b).trim(),
                            option_c: String(q.option_c).trim(),
                            option_d: String(q.option_d).trim(),
                            correct_answer: String(q.correct_answer).toUpperCase() as 'A' | 'B' | 'C' | 'D',
                            explanation: q.explanation ? String(q.explanation).trim() : undefined,
                            exam_year: q.exam_year ? parseInt(String(q.exam_year)) : undefined,
                            exam_type: 'JAMB',
                            topic: q.topic ? String(q.topic).trim() : undefined,
                            subject: q.subject ? String(q.subject).trim() : undefined,
                        });
                    } else {
                        validationErrors.push(...validation.errors);
                    }
                });
            } else if (typeof data === 'object') {
                // Handle format like { "mathematics": [...], "english": [...] }
                let questionIndex = 0;
                Object.keys(data).forEach(key => {
                    if (Array.isArray(data[key])) {
                        data[key].forEach((q: Record<string, unknown>) => {
                            const validation = validateQuestion(q, questionIndex++);
                            if (validation.valid) {
                                questions.push({
                                    question_text: String(q.question_text).trim(),
                                    option_a: String(q.option_a).trim(),
                                    option_b: String(q.option_b).trim(),
                                    option_c: String(q.option_c).trim(),
                                    option_d: String(q.option_d).trim(),
                                    correct_answer: String(q.correct_answer).toUpperCase() as 'A' | 'B' | 'C' | 'D',
                                    explanation: q.explanation ? String(q.explanation).trim() : undefined,
                                    exam_year: q.exam_year ? parseInt(String(q.exam_year)) : undefined,
                                    exam_type: 'JAMB',
                                    topic: q.topic ? String(q.topic).trim() : undefined,
                                    subject: q.subject ? String(q.subject).trim() : key.trim(),
                                });
                            } else {
                                validationErrors.push(...validation.errors);
                            }
                        });
                    }
                });
            } else {
                throw new Error('Invalid JSON format. Expected an array of questions or an object with subject keys.');
            }

            if (validationErrors.length > 0) {
                throw new Error(`JSON validation failed:\n${validationErrors.join('\n')}`);
            }

            if (questions.length === 0) {
                throw new Error('No valid questions found in JSON file');
            }

            return questions;
        } catch (error: unknown) {
            if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON syntax: ${error.message}`);
            }
            throw error;
        }
    };

    const parseSimpleText = (text: string): ParsedQuestion[] => {
        const questions: ParsedQuestion[] = [];
        const blocks = text.split(/---+/).filter(b => b.trim());

        blocks.forEach((block, blockIndex) => {
            try {
                const lines = block.split('\n').map(l => l.trim()).filter(l => l);
                const question: Record<string, string> = {};

                // Debug info for the current block
                console.log(`Parsing block ${blockIndex + 1}:`, lines);

                lines.forEach(line => {
                    // Handle different formats: "Key: Value", "Key) Value", "Key. Value", etc.
                    let colonIndex = line.indexOf(':');
                    
                    if (colonIndex === -1) {
                        colonIndex = line.indexOf(')');
                    }
                    if (colonIndex === -1) {
                        colonIndex = line.indexOf('.');
                    }
                    if (colonIndex === -1) {
                        // Try to match patterns like "A) option" or "A. option" or "A option"
                        const optionMatch = line.match(/^([ABCD])\s*[).\\-\s]\s*(.+)$/i);
                        if (optionMatch) {
                            const optionLetter = optionMatch[1].toUpperCase();
                            const optionText = optionMatch[2].trim();
                            question[`option_${optionLetter.toLowerCase()}`] = optionText;
                            return;
                        }
                        
                        // Try to match question patterns
                        const questionMatch = line.match(/^(?:Q|Question)\s*[).\\-\s]\s*(.+)$/i);
                        if (questionMatch) {
                            question.question_text = questionMatch[1].trim();
                            return;
                        }
                        
                        // Try to match answer patterns
                        const answerMatch = line.match(/^(?:Answer|Correct|Correct Answer)\s*[).\\-\s]\s*([ABCD])$/i);
                        if (answerMatch) {
                            question.correct_answer = answerMatch[1].toUpperCase();
                            return;
                        }
                        
                        return; // Skip lines that don't match any pattern
                    }

                    const key = line.substring(0, colonIndex).trim().toUpperCase();
                    const value = line.substring(colonIndex + 1).trim();

                    // More flexible key matching
                    if (key.match(/^Q(UESTION)?$/)) {
                        question.question_text = value;
                    } else if (key === 'A' || key.startsWith('OPTION A')) {
                        question.option_a = value;
                    } else if (key === 'B' || key.startsWith('OPTION B')) {
                        question.option_b = value;
                    } else if (key === 'C' || key.startsWith('OPTION C')) {
                        question.option_c = value;
                    } else if (key === 'D' || key.startsWith('OPTION D')) {
                        question.option_d = value;
                    } else if (key.match(/^(ANSWER|CORRECT|CORRECT ANSWER|CORRECT_ANSWER)$/)) {
                        question.correct_answer = value.toUpperCase();
                    } else if (key.match(/^(EXPLANATION|EXPLAIN)$/)) {
                        question.explanation = value;
                    }
                });

                // Provide detailed debugging info
                console.log(`Block ${blockIndex + 1} parsed:`, question);

                const validation = validateQuestion(question, blockIndex);
                if (validation.valid) {
                    questions.push({
                        question_text: question.question_text,
                        option_a: question.option_a,
                        option_b: question.option_b,
                        option_c: question.option_c,
                        option_d: question.option_d,
                        correct_answer: question.correct_answer as 'A' | 'B' | 'C' | 'D',
                        explanation: question.explanation,
                    });
                } else {
                    // Provide more helpful error message
                    const missingFields = [];
                    if (!question.question_text) missingFields.push('Question text');
                    if (!question.option_a) missingFields.push('Option A');
                    if (!question.option_b) missingFields.push('Option B');
                    if (!question.option_c) missingFields.push('Option C');
                    if (!question.option_d) missingFields.push('Option D');
                    if (!question.correct_answer) missingFields.push('Correct answer');
                    
                    throw new Error(`Block ${blockIndex + 1} is missing: ${missingFields.join(', ')}. 

Expected format:
Q: Your question here?
A: First option
B: Second option  
C: Third option
D: Fourth option
Answer: C

Current block content:
${lines.join('\n')}

Parsed fields: ${JSON.stringify(question, null, 2)}`);
                }
            } catch (error: unknown) {
                throw new Error(`Error parsing block ${blockIndex + 1}: ${error instanceof Error ? error.message : String(error)}`);
            }
        });

        if (questions.length === 0) {
            throw new Error('No valid questions found in text. Make sure to separate questions with "---" and use the correct format.');
        }

        return questions;
    };

    const handleImport = async () => {
        if (importMode === 'file' && !file) {
            showToast('Please select a file to import', 'error');
            return;
        }
        if (importMode === 'text' && !textInput.trim()) {
            showToast('Please enter text to import', 'error');
            return;
        }

        // Validate required fields - subject is required when not provided in data, topic is optional
        // For simple format, subject must be selected since it's not in the data
        // For JSON/CSV formats, subject can be in the data or selected in the dropdown
        if (!selectedSubject && format === 'simple') {
            showToast('Validation Error: Please select a Subject. Topic is optional - questions can be assigned directly to subjects.', 'error');
            return;
        }

        setImporting(true);
        setImportResult(null);

        try {
            let text = '';
            if (importMode === 'file' && file) {
                text = await file.text();
            } else {
                text = textInput;
            }

            let parsedQuestions: ParsedQuestion[];

            if (format === 'csv') {
                parsedQuestions = parseCSV(text);
            } else if (format === 'simple') {
                parsedQuestions = parseSimpleText(text);
            } else {
                parsedQuestions = parseJSON(text);
            }

            // Convert to QuestionInput format  
            const questionsToImport: QuestionInput[] = [];
            const errors: string[] = [];

            for (const pq of parsedQuestions) {
                let subjectId = selectedSubject;

                // Resolve Subject (if not already selected)
                if (!subjectId) {
                    if (pq.subject) {
                        const foundSubject = subjects.find(s =>
                            s.name.toLowerCase().trim() === pq.subject?.toLowerCase().trim() ||
                            s.slug.toLowerCase().trim() === pq.subject?.toLowerCase().trim()
                        );
                        if (foundSubject) {
                            subjectId = foundSubject.id;
                        }
                    }
                }

                if (!subjectId) {
                    errors.push(`Validation Error: Could not resolve subject for question: "${pq.question_text.substring(0, 30)}...". Either select a subject from the dropdown or provide a valid subject name in the data (Subject provided: ${pq.subject || 'none'})`);
                    continue;
                }

                questionsToImport.push({
                    subject_id: subjectId,
                    question_text: pq.question_text,
                    option_a: pq.option_a,
                    option_b: pq.option_b,
                    option_c: pq.option_c,
                    option_d: pq.option_d,
                    correct_answer: pq.correct_answer,
                    explanation: pq.explanation,
                    exam_year: selectedExamYear ? parseInt(selectedExamYear) : pq.exam_year,
                    exam_type: 'JAMB',
                    is_active: true,
                });
            }

            // Import questions with content validation
            const result = { success: 0, failed: 0, errors: [...errors] };

            if (questionsToImport.length > 0) {
                // Get subject slug for content validation
                const selectedSubjectObj = subjects.find(s => s.id === selectedSubject);
                const subjectSlug = selectedSubjectObj?.slug;

                const importRes = await adminQuestionService.importQuestions(questionsToImport, subjectSlug);
                result.success = importRes.success;
                result.failed = importRes.failed + errors.length;
                result.errors = [...result.errors, ...importRes.errors];
            } else {
                result.failed = errors.length;
            }

            setImportResult(result);

            if (result.success > 0) {
                showToast(`Successfully imported ${result.success} questions`, 'success');
                // Clear form state on successful import
                formPersistence.clearFormState();
            }

            if (result.failed > 0) {
                showToast(`Failed to import ${result.failed} questions`, 'error');
            }
        } catch (error: unknown) {
            showToast(`Import failed: ${(error as Error).message}`, 'error');
            setImportResult({ success: 0, failed: 0, errors: [(error as Error).message] });
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
"Solve: x + 5 = 10","3","4","5","6","C","Subtract 5 from both sides: x = 10 - 5 = 5","2023","JAMB","Algebra","Mathematics"`;
            filename = 'questions_template.csv';
        } else if (templateFormat === 'simple') {
            content = `Q: What is 2 + 2?
A: 2
B: 3
C: 4
D: 5
Answer: C
Explanation: Addition of two numbers
---
Question: Solve: x + 5 = 10
A) 3
B) 4
C) 5
D) 6
Correct: C
Explanation: Subtract 5 from both sides: x = 10 - 5 = 5
---
Q) What is the capital of Nigeria?
A. Lagos
B. Abuja
C. Kano
D. Port Harcourt
Correct Answer: B
---`;
            filename = 'questions_template.txt';
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
                    exam_type: "JAMB",
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

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" onClick={() => navigate('/7351/admin')}>
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Admin
                    </Button>
                    <h1 className="text-3xl font-bold">Import Questions</h1>
                </div>

                <Card>
                    <div className="space-y-8">
                        {/* Import Mode Selection */}
                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={() => {
                                    setImportMode('file');
                                    formPersistence.autoSaveFormState({
                                        selectedSubject,
                                        selectedExamType,
                                        selectedExamYear,
                                        format,
                                        importMode: 'file'
                                    });
                                }}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${importMode === 'file'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                File Upload
                            </button>
                            <button
                                onClick={() => {
                                    setImportMode('text');
                                    setFormat('simple');
                                    formPersistence.autoSaveFormState({
                                        selectedSubject,
                                        selectedExamType,
                                        selectedExamYear,
                                        format: 'simple',
                                        importMode: 'text'
                                    });
                                }}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${importMode === 'text'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                Copy & Paste Text
                            </button>
                        </div>

                        {/* Format Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-3">Import Format</label>
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={() => {
                                        setFormat('json');
                                        formPersistence.autoSaveFormState({
                                            selectedSubject,
                                            selectedExamType,
                                            selectedExamYear,
                                            format: 'json',
                                            importMode
                                        });
                                    }}
                                    className={`p-6 border-2 rounded-xl flex flex-col items-center justify-center gap-3 transition-all ${format === 'json'
                                        ? 'border-[#B78628] bg-[#FDF6E8] text-[#B78628] shadow-sm'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <FileText className="w-6 h-6" />
                                    <span className="font-semibold text-lg">JSON</span>
                                    <span className="text-xs text-gray-500">Structured data</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setFormat('csv');
                                        formPersistence.autoSaveFormState({
                                            selectedSubject,
                                            selectedExamType,
                                            selectedExamYear,
                                            format: 'csv',
                                            importMode
                                        });
                                    }}
                                    className={`p-6 border-2 rounded-xl flex flex-col items-center justify-center gap-3 transition-all ${format === 'csv'
                                        ? 'border-[#B78628] bg-[#FDF6E8] text-[#B78628] shadow-sm'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <FileText className="w-6 h-6" />
                                    <span className="font-semibold text-lg">CSV</span>
                                    <span className="text-xs text-gray-500">Spreadsheet</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setFormat('simple');
                                        formPersistence.autoSaveFormState({
                                            selectedSubject,
                                            selectedExamType,
                                            selectedExamYear,
                                            format: 'simple',
                                            importMode
                                        });
                                    }}
                                    className={`p-6 border-2 rounded-xl flex flex-col items-center justify-center gap-3 transition-all ${format === 'simple'
                                        ? 'border-[#B78628] bg-[#FDF6E8] text-[#B78628] shadow-sm'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <FileText className="w-6 h-6" />
                                    <span className="font-semibold text-lg">Simple Text</span>
                                    <span className="text-xs text-gray-500">Easy format</span>
                                </button>
                            </div>
                        </div>

                        {/* Template Download */}
                        <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <AlertCircle className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-blue-900 mb-1">
                                        {format === 'simple' ? 'Simple Text Format Guide' : 'Download Template'}
                                    </h3>
                                    {format === 'simple' ? (
                                        <div className="text-blue-700 mb-4">
                                            <p className="mb-2">Use this easy format to add questions. Separate each question with "---":</p>
                                            <div className="bg-white p-3 rounded border border-blue-200 font-mono text-xs">
                                                <div>Q: Your question here?</div>
                                                <div>A: First option</div>
                                                <div>B: Second option</div>
                                                <div>C: Third option</div>
                                                <div>D: Fourth option</div>
                                                <div>Answer: C</div>
                                                <div>Explanation: Why C is correct</div>
                                                <div className="mt-2">---</div>
                                                <div className="mt-2 text-gray-500">Alternative formats also work:</div>
                                                <div className="text-gray-500">Q) Question text</div>
                                                <div className="text-gray-500">A) Option text</div>
                                                <div className="text-gray-500">Correct: C</div>
                                            </div>
                                            <p className="mt-2 text-xs font-semibold">Note: Select Subject (required) from the dropdown below. Topic is optional.</p>
                                        </div>
                                    ) : (
                                        <p className="text-blue-700 mb-4">
                                            Download a template file to see the expected format for importing questions.
                                        </p>
                                    )}
                                    <Button
                                        onClick={() => downloadTemplate(format)}
                                        variant="outline"
                                        className="bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download {format === 'simple' ? 'Text' : format.toUpperCase()} Template
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Subject and Topic Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Subject (Required)</label>
                                <Select
                                    value={selectedSubject}
                                    onChange={(e) => handleSubjectChange(e.target.value)}
                                    options={[
                                        { value: '', label: 'Select Subject' },
                                        ...subjects.map(s => ({ value: s.id, label: s.name }))
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Exam Year (Optional)</label>
                                <input
                                    type="number"
                                    value={selectedExamYear}
                                    onChange={(e) => {
                                        setSelectedExamYear(e.target.value);
                                        formPersistence.autoSaveFormState({
                                            selectedSubject,
                                            selectedExamType,
                                            selectedExamYear: e.target.value,
                                            format,
                                            importMode
                                        });
                                    }}
                                    placeholder="e.g. 2023"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B78628] focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Input Area (File or Text) */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {importMode === 'file' ? 'Upload File' : 'Paste Text'}
                            </label>

                            {importMode === 'file' ? (
                                <>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-[#B78628] hover:bg-[#FDF6E8] transition-all group"
                                    >
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#FDF6E8] transition-colors">
                                            <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#B78628] transition-colors" />
                                        </div>
                                        {file ? (
                                            <div>
                                                <p className="font-semibold text-gray-900 text-lg mb-1">{file.name}</p>
                                                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-semibold text-gray-700 text-lg mb-1">Click to upload {format.toUpperCase()} file</p>
                                                <p className="text-sm text-gray-500">or drag and drop</p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={format === 'json' ? '.json' : format === 'csv' ? '.csv' : '.txt'}
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </>
                            ) : (
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder={format === 'simple'
                                        ? `Q: Your question here?\nA: First option\nB: Second option\nC: Third option\nD: Fourth option\nCorrect Answer: C\nExplanation: Why C is correct\n---\n(Add more questions separated by ---)`
                                        : `Paste your ${format.toUpperCase()} content here...`}
                                    className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B78628] focus:border-transparent font-mono text-sm"
                                />
                            )}
                        </div>

                        {/* Import Result */}
                        {importResult && (
                            <div className={`p-6 rounded-xl border ${importResult.success > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                }`}>
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-lg ${importResult.success > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                        {importResult.success > 0 ? (
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        ) : (
                                            <AlertCircle className="w-6 h-6 text-red-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-2 text-lg">Import Results</h3>
                                        <div className="flex gap-4 mb-3">
                                            <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-green-700 border border-green-200">
                                                Success: {importResult.success}
                                            </span>
                                            <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-red-700 border border-red-200">
                                                Failed: {importResult.failed}
                                            </span>
                                        </div>
                                        {importResult.errors.length > 0 && (
                                            <div className="mt-4 bg-white p-4 rounded-lg border border-red-100">
                                                <p className="text-sm font-semibold text-red-800 mb-2">Error Details:</p>
                                                <ul className="text-sm space-y-1 max-h-40 overflow-y-auto pr-2">
                                                    {importResult.errors.slice(0, 10).map((error, index) => (
                                                        <li key={index} className="text-red-600 flex items-start gap-2">
                                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                                            {error}
                                                        </li>
                                                    ))}
                                                    {importResult.errors.length > 10 && (
                                                        <li className="text-red-500 italic pl-3.5">... and {importResult.errors.length - 10} more errors</li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Content Validation Preview */}
                        {previewValidation && (
                            <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-green-900 mb-2">Ready to Import</h3>
                                        <div className="flex gap-4 mb-3">
                                            <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-green-700 border border-green-200">
                                                {previewValidation.totalQuestions} questions ready for import
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between pt-4 border-t">
                            <Button
                                onClick={validateContent}
                                disabled={(importMode === 'file' && !file) || (importMode === 'text' && !textInput) || !selectedSubject}
                                variant="outline"
                                className="px-6 py-3 text-lg h-auto border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                                <AlertCircle className="w-5 h-5 mr-2" />
                                Validate Content
                            </Button>
                            
                            <Button
                                onClick={handleImport}
                                disabled={(importMode === 'file' && !file) || (importMode === 'text' && !textInput) || importing}
                                style={{ backgroundColor: '#B78628', color: 'white' }}
                                className="px-8 py-3 text-lg h-auto"
                            >
                                {importing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Importing Questions...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5 mr-2" />
                                        Start Import
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
