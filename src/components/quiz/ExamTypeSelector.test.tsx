import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ExamTypeSelector } from './ExamTypeSelector';
import { examTypeService } from '../../services/exam-type-service';
import type { ExamTypeRecord } from '../../types/database';

// Mock the exam type service
vi.mock('../../services/exam-type-service', () => ({
  examTypeService: {
    getAllExamTypes: vi.fn()
  }
}));

const mockExamTypes: ExamTypeRecord[] = [
  {
    id: '1',
    name: 'JAMB',
    slug: 'jamb',
    description: 'University entrance exam',
    full_name: 'Joint Admissions and Matriculation Board',
    duration_minutes: 150,
    total_questions: 180,
    passing_score: 180,
    is_active: true,
    sort_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'WAEC',
    slug: 'waec',
    description: 'Secondary school certificate exam',
    full_name: 'West African Examinations Council',
    duration_minutes: 180,
    total_questions: 200,
    passing_score: 50,
    is_active: true,
    sort_order: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

describe('ExamTypeSelector', () => {
  const mockOnExamTypeSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(examTypeService.getAllExamTypes).mockImplementation(() => new Promise(() => {}));
    
    render(<ExamTypeSelector onExamTypeSelected={mockOnExamTypeSelected} />);
    
    expect(screen.getByText('Loading exam types...')).toBeInTheDocument();
  });

  it('renders exam types after loading', async () => {
    vi.mocked(examTypeService.getAllExamTypes).mockResolvedValue(mockExamTypes);
    
    render(<ExamTypeSelector onExamTypeSelected={mockOnExamTypeSelected} />);
    
    await waitFor(() => {
      expect(screen.getByText('JAMB')).toBeInTheDocument();
      expect(screen.getByText('WAEC')).toBeInTheDocument();
    });
  });

  it('calls onExamTypeSelected when exam type is clicked', async () => {
    vi.mocked(examTypeService.getAllExamTypes).mockResolvedValue(mockExamTypes);
    
    render(<ExamTypeSelector onExamTypeSelected={mockOnExamTypeSelected} />);
    
    await waitFor(() => {
      expect(screen.getByText('JAMB')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('JAMB'));
    
    expect(mockOnExamTypeSelected).toHaveBeenCalledWith(mockExamTypes[0]);
  });

  it('shows selected exam type with ring styling', async () => {
    vi.mocked(examTypeService.getAllExamTypes).mockResolvedValue(mockExamTypes);
    
    render(
      <ExamTypeSelector 
        onExamTypeSelected={mockOnExamTypeSelected} 
        selectedExamType={mockExamTypes[0]}
      />
    );
    
    await waitFor(() => {
      const jambButton = screen.getByText('JAMB').closest('button');
      expect(jambButton).toHaveClass('ring-2', 'ring-blue-500');
    });
  });

  it('handles error state', async () => {
    vi.mocked(examTypeService.getAllExamTypes).mockRejectedValue(new Error('Network error'));
    
    render(<ExamTypeSelector onExamTypeSelected={mockOnExamTypeSelected} />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load exam types. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows retry button on error and retries when clicked', async () => {
    vi.mocked(examTypeService.getAllExamTypes)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockExamTypes);
    
    render(<ExamTypeSelector onExamTypeSelected={mockOnExamTypeSelected} />);
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Try Again'));
    
    await waitFor(() => {
      expect(screen.getByText('JAMB')).toBeInTheDocument();
    });
  });
});