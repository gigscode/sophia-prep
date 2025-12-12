import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UniversalSubjectSelector } from './UniversalSubjectSelector';
import type { ExamTypeRecord, SubjectWithDetails } from '../../types/database';

// Mock the services
vi.mock('../../services/updated-subject-service', () => ({
  updatedSubjectService: {
    getSubjectsByExamType: vi.fn(),
    getSubjectsByIds: vi.fn(),
    getEnglishSubject: vi.fn()
  }
}));

vi.mock('../../services/universal-validation-service', () => ({
  universalValidationService: {
    validateSubjectSelection: vi.fn(),
    getValidationRequirements: vi.fn()
  }
}));

const mockExamType: ExamTypeRecord = {
  id: '1',
  name: 'JAMB',
  slug: 'jamb',
  description: 'Joint Admissions and Matriculation Board',
  is_active: true,
  sort_order: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockSubjects: SubjectWithDetails[] = [
  {
    id: '1',
    name: 'English Language',
    slug: 'english',
    category_name: 'Language',
    category_slug: 'language',
    category_color: '#f59e0b',
    exam_types: ['JAMB'],
    exam_type_slugs: ['jamb'],
    is_mandatory: true,
    is_active: true,
    sort_order: 1
  },
  {
    id: '2',
    name: 'Mathematics',
    slug: 'mathematics',
    category_name: 'Science',
    category_slug: 'science',
    category_color: '#3b82f6',
    exam_types: ['JAMB'],
    exam_type_slugs: ['jamb'],
    is_mandatory: false,
    is_active: true,
    sort_order: 2
  }
];

describe('UniversalSubjectSelector', () => {
  const mockOnSubjectsChange = vi.fn();
  const mockOnValidationChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    const { updatedSubjectService } = require('../../services/updated-subject-service');
    const { universalValidationService } = require('../../services/universal-validation-service');
    
    updatedSubjectService.getSubjectsByExamType.mockResolvedValue(mockSubjects);
    
    universalValidationService.getValidationRequirements.mockReturnValue({
      title: 'JAMB Requirements',
      description: 'Select exactly 4 subjects including English',
      requirements: ['English Language (Mandatory)', '3 additional subjects'],
      minSubjects: 4,
      maxSubjects: 4,
      mandatorySubjects: ['english'],
      recommendations: []
    });
    
    universalValidationService.validateSubjectSelection.mockResolvedValue({
      isValid: false,
      message: 'Please select subjects',
      examType: 'JAMB',
      subjectCount: 0,
      errors: [],
      warnings: [],
      suggestions: [],
      validationDetails: null,
      realTimeStatus: {
        status: 'incomplete',
        message: 'Select subjects to begin',
        progress: 0
      }
    });
  });

  it('renders exam type requirements', async () => {
    render(
      <UniversalSubjectSelector
        examType={mockExamType}
        selectedSubjects={[]}
        onSubjectsChange={mockOnSubjectsChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Select Subjects')).toBeInTheDocument();
      expect(screen.getByText('JAMB Requirements')).toBeInTheDocument();
      expect(screen.getByText('English Language (Mandatory)')).toBeInTheDocument();
    });
  });

  it('displays subjects grouped by category', async () => {
    render(
      <UniversalSubjectSelector
        examType={mockExamType}
        selectedSubjects={[]}
        onSubjectsChange={mockOnSubjectsChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Language')).toBeInTheDocument();
      expect(screen.getByText('Science')).toBeInTheDocument();
      expect(screen.getByText('English Language')).toBeInTheDocument();
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });
  });

  it('calls onSubjectsChange when subject is selected', async () => {
    render(
      <UniversalSubjectSelector
        examType={mockExamType}
        selectedSubjects={[]}
        onSubjectsChange={mockOnSubjectsChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      const mathButton = screen.getByRole('button', { name: /Mathematics/ });
      fireEvent.click(mathButton);
    });

    expect(mockOnSubjectsChange).toHaveBeenCalledWith(['2']);
  });

  it('shows loading state initially', () => {
    render(
      <UniversalSubjectSelector
        examType={mockExamType}
        selectedSubjects={[]}
        onSubjectsChange={mockOnSubjectsChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    expect(screen.getByText('Loading subjects...')).toBeInTheDocument();
  });

  it('handles service errors gracefully', async () => {
    const { updatedSubjectService } = require('../../services/updated-subject-service');
    updatedSubjectService.getSubjectsByExamType.mockRejectedValue(new Error('Service error'));

    render(
      <UniversalSubjectSelector
        examType={mockExamType}
        selectedSubjects={[]}
        onSubjectsChange={mockOnSubjectsChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load subjects. Please try again.')).toBeInTheDocument();
    });
  });
});