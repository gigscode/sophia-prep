import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ModeSelectionPage } from './ModeSelectionPage';
import { subjectService } from '../services/subject-service';
import { supabase } from '../integrations/supabase/client';

// Mock the services
vi.mock('../services/subject-service', () => ({
  subjectService: {
    getSubjectsByExamType: vi.fn(),
  },
}));

vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ModeSelectionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ModeSelectionPage />
      </BrowserRouter>
    );
  };

  it('should render exam type selection as first step', () => {
    renderComponent();
    
    expect(screen.getByText('Select Exam Type')).toBeInTheDocument();
    expect(screen.getByText('JAMB')).toBeInTheDocument();
    expect(screen.getByText('WAEC')).toBeInTheDocument();
  });

  it('should progress to mode selection after selecting exam type', async () => {
    renderComponent();
    
    const jambButton = screen.getByText('JAMB').closest('button');
    expect(jambButton).toBeInTheDocument();
    
    fireEvent.click(jambButton!);
    
    await waitFor(() => {
      expect(screen.getByText('Choose Quiz Mode')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    expect(screen.getByText('Exam Simulation')).toBeInTheDocument();
  });

  it('should progress to method selection after selecting mode', async () => {
    renderComponent();
    
    // Select exam type
    const jambButton = screen.getByText('JAMB').closest('button');
    fireEvent.click(jambButton!);
    
    await waitFor(() => {
      expect(screen.getByText('Choose Quiz Mode')).toBeInTheDocument();
    });
    
    // Select mode
    const practiceButton = screen.getByText('Practice Mode').closest('button');
    fireEvent.click(practiceButton!);
    
    await waitFor(() => {
      expect(screen.getByText('Select Practice Method')).toBeInTheDocument();
    });
    
    expect(screen.getByText('By Subject')).toBeInTheDocument();
    expect(screen.getByText('By Year')).toBeInTheDocument();
  });

  it('should load subjects when subject method is selected', async () => {
    const mockSubjects = [
      {
        id: '1',
        name: 'Mathematics',
        slug: 'mathematics',
        description: 'Math subject',
        icon: '',
        color_theme: '',
        exam_type: 'JAMB' as const,
        subject_category: 'SCIENCE' as const,
        is_mandatory: true,
        is_active: true,
        sort_order: 1,
        created_at: '',
        updated_at: '',
      },
    ];

    vi.mocked(subjectService.getSubjectsByExamType).mockResolvedValue(mockSubjects);
    
    renderComponent();
    
    // Navigate to subject selection
    fireEvent.click(screen.getByText('JAMB').closest('button')!);
    await waitFor(() => screen.getByText('Choose Quiz Mode'));
    
    fireEvent.click(screen.getByText('Practice Mode').closest('button')!);
    await waitFor(() => screen.getByText('Select Practice Method'));
    
    fireEvent.click(screen.getByText('By Subject').closest('button')!);
    
    await waitFor(() => {
      expect(screen.getByText('Select a Subject')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });
  });

  it('should load available years when year method is selected', async () => {
    const mockYears = [
      { exam_year: 2023 },
      { exam_year: 2022 },
      { exam_year: 2021 },
    ];

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockYears,
              error: null,
            }),
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom as any);
    
    renderComponent();
    
    // Navigate to year selection
    fireEvent.click(screen.getByText('WAEC').closest('button')!);
    await waitFor(() => screen.getByText('Choose Quiz Mode'));
    
    fireEvent.click(screen.getByText('Exam Simulation').closest('button')!);
    await waitFor(() => screen.getByText('Select Practice Method'));
    
    fireEvent.click(screen.getByText('By Year').closest('button')!);
    
    await waitFor(() => {
      expect(screen.getByText('Select Exam Year')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('2023')).toBeInTheDocument();
      expect(screen.getByText('2022')).toBeInTheDocument();
      expect(screen.getByText('2021')).toBeInTheDocument();
    });
  });

  it('should show summary panel with selections', async () => {
    renderComponent();
    
    // Select exam type
    fireEvent.click(screen.getByText('JAMB').closest('button')!);
    
    await waitFor(() => {
      expect(screen.getByText(/Exam Type:/)).toBeInTheDocument();
      expect(screen.getByText(/JAMB/)).toBeInTheDocument();
    });
  });

  it('should navigate back through steps', async () => {
    renderComponent();
    
    // Go forward
    fireEvent.click(screen.getByText('JAMB').closest('button')!);
    await waitFor(() => screen.getByText('Choose Quiz Mode'));
    
    // Go back
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    
    await waitFor(() => {
      expect(screen.getByText('Select Exam Type')).toBeInTheDocument();
    });
  });

  it('should reset selections when exam type changes', async () => {
    const mockSubjects = [
      {
        id: '1',
        name: 'Mathematics',
        slug: 'mathematics',
        description: 'Math subject',
        icon: '',
        color_theme: '',
        exam_type: 'JAMB' as const,
        subject_category: 'SCIENCE' as const,
        is_mandatory: true,
        is_active: true,
        sort_order: 1,
        created_at: '',
        updated_at: '',
      },
    ];

    vi.mocked(subjectService.getSubjectsByExamType).mockResolvedValue(mockSubjects);
    
    renderComponent();
    
    // Select JAMB and go through to subject selection
    fireEvent.click(screen.getByText('JAMB').closest('button')!);
    await waitFor(() => screen.getByText('Choose Quiz Mode'));
    
    fireEvent.click(screen.getByText('Practice Mode').closest('button')!);
    await waitFor(() => screen.getByText('Select Practice Method'));
    
    fireEvent.click(screen.getByText('By Subject').closest('button')!);
    await waitFor(() => screen.getByText('Select a Subject'));
    
    // Go back to exam type selection
    fireEvent.click(screen.getByText('Back'));
    await waitFor(() => screen.getByText('Select Practice Method'));
    
    fireEvent.click(screen.getByText('Back'));
    await waitFor(() => screen.getByText('Choose Quiz Mode'));
    
    fireEvent.click(screen.getByText('Back'));
    await waitFor(() => screen.getByText('Select Exam Type'));
    
    // Select WAEC - this should reset all selections
    fireEvent.click(screen.getByText('WAEC').closest('button')!);
    
    await waitFor(() => {
      expect(screen.getByText('Choose Quiz Mode')).toBeInTheDocument();
    });
    
    // Verify the summary shows WAEC, not JAMB
    expect(screen.getByText(/WAEC/)).toBeInTheDocument();
  });
});
