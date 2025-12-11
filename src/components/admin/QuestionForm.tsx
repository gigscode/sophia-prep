import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { adminSubjectService } from '../../services/admin-subject-service';
import type { Subject, Question } from '../../integrations/supabase/types';
import type { QuestionInput } from '../../services/admin-question-service';

interface QuestionFormProps {
  question?: Question | null;
  onSubmit: (data: QuestionInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function QuestionForm({ question, onSubmit, onCancel, isSubmitting = false }: QuestionFormProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<QuestionInput>({
    subject_id: question?.subject_id || null,
    question_text: question?.question_text || '',
    option_a: question?.option_a || '',
    option_b: question?.option_b || '',
    option_c: question?.option_c || '',
    option_d: question?.option_d || '',
    correct_answer: question?.correct_answer || 'A',
    explanation: question?.explanation || null,
    exam_year: question?.exam_year || null,
    exam_type: question?.exam_type || null,
    question_number: question?.question_number || null,
    is_active: question?.is_active ?? true,
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    const fetchedSubjects = await adminSubjectService.getAllSubjects({ status: 'active' });
    setSubjects(fetchedSubjects);
  };

  const handleChange = (field: keyof QuestionInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };



  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate that subject_id is provided
    if (!formData.subject_id) {
      newErrors.subject_id = 'Subject must be selected';
    }

    // Validate required fields
    if (!formData.question_text?.trim()) {
      newErrors.question_text = 'Question text is required';
    }
    if (!formData.option_a?.trim()) {
      newErrors.option_a = 'Option A is required';
    }
    if (!formData.option_b?.trim()) {
      newErrors.option_b = 'Option B is required';
    }
    if (!formData.option_c?.trim()) {
      newErrors.option_c = 'Option C is required';
    }
    if (!formData.option_d?.trim()) {
      newErrors.option_d = 'Option D is required';
    }
    if (!formData.correct_answer) {
      newErrors.correct_answer = 'Correct answer is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Subject Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subject <span className="text-red-500">*</span>
        </label>
        <Select
          value={formData.subject_id || ''}
          onChange={(e) => handleChange('subject_id', e.target.value || null)}
          options={[
            { value: '', label: 'Select a subject' },
            ...subjects.map(s => ({ value: s.id, label: s.name }))
          ]}
          className={errors.subject_id ? 'border-red-500' : ''}
        />
        {errors.subject_id && (
          <p className="mt-1 text-sm text-red-600">{errors.subject_id}</p>
        )}
      </div>

      {/* Question Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Text <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.question_text}
          onChange={(e) => handleChange('question_text', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${errors.question_text ? 'border-red-500' : 'border-gray-300'
            }`}
          placeholder="Enter the question text..."
        />
        {errors.question_text && (
          <p className="mt-1 text-sm text-red-600">{errors.question_text}</p>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Option A <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.option_a}
            onChange={(e) => handleChange('option_a', e.target.value)}
            className={errors.option_a ? 'border-red-500' : ''}
          />
          {errors.option_a && (
            <p className="mt-1 text-sm text-red-600">{errors.option_a}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Option B <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.option_b}
            onChange={(e) => handleChange('option_b', e.target.value)}
            className={errors.option_b ? 'border-red-500' : ''}
          />
          {errors.option_b && (
            <p className="mt-1 text-sm text-red-600">{errors.option_b}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Option C <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.option_c}
            onChange={(e) => handleChange('option_c', e.target.value)}
            className={errors.option_c ? 'border-red-500' : ''}
          />
          {errors.option_c && (
            <p className="mt-1 text-sm text-red-600">{errors.option_c}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Option D <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.option_d}
            onChange={(e) => handleChange('option_d', e.target.value)}
            className={errors.option_d ? 'border-red-500' : ''}
          />
          {errors.option_d && (
            <p className="mt-1 text-sm text-red-600">{errors.option_d}</p>
          )}
        </div>
      </div>

      {/* Correct Answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Correct Answer <span className="text-red-500">*</span>
        </label>
        <Select
          value={formData.correct_answer}
          onChange={(e) => handleChange('correct_answer', e.target.value as 'A' | 'B' | 'C' | 'D')}
          options={[
            { value: 'A', label: 'A' },
            { value: 'B', label: 'B' },
            { value: 'C', label: 'C' },
            { value: 'D', label: 'D' },
          ]}
          className={errors.correct_answer ? 'border-red-500' : ''}
        />
        {errors.correct_answer && (
          <p className="mt-1 text-sm text-red-600">{errors.correct_answer}</p>
        )}
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Explanation <span className="text-gray-400">(Optional)</span>
        </label>
        <textarea
          value={formData.explanation || ''}
          onChange={(e) => handleChange('explanation', e.target.value || null)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          placeholder="Provide an explanation for the correct answer..."
        />
      </div>

      {/* Exam Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exam Type <span className="text-gray-400">(Optional)</span>
          </label>
          <Select
            value={formData.exam_type || ''}
            onChange={(e) => handleChange('exam_type', e.target.value || null)}
            options={[
              { value: '', label: 'Not specified' },
              { value: 'JAMB', label: 'JAMB' },
              { value: 'WAEC', label: 'WAEC' },
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exam Year <span className="text-gray-400">(Optional)</span>
          </label>
          <Input
            type="number"
            value={formData.exam_year || ''}
            onChange={(e) => handleChange('exam_year', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="e.g., 2023"
            min="1990"
            max="2030"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question Number <span className="text-gray-400">(Optional)</span>
          </label>
          <Input
            type="number"
            value={formData.question_number || ''}
            onChange={(e) => handleChange('question_number', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="e.g., 1"
            min="1"
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => handleChange('is_active', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
          Active (question will be available for quizzes)
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Saving...' : question ? 'Update Question' : 'Create Question'}
        </Button>
      </div>
    </form>
  );
}
