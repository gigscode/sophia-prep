import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuizResultsPage } from './QuizResultsPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: {
        questions: [
          {
            id: '1',
            text: 'What is 2 + 2?',
            options: [
              { key: 'A', text: '3' },
              { key: 'B', text: '4' },
              { key: 'C', text: '5' },
              { key: 'D', text: '6' }
            ],
            correct: 'B',
            explanation: 'The sum of 2 and 2 is 4. This is basic arithmetic.',
            exam_year: 2023,
            exam_type: 'JAMB',
            topic: 'Mathematics'
          },
          {
            id: '2',
            text: 'What is the capital of Nigeria?',
            options: [
              { key: 'A', text: 'Lagos' },
              { key: 'B', text: 'Abuja' },
              { key: 'C', text: 'Kano' },
              { key: 'D', text: 'Port Harcourt' }
            ],
            correct: 'B',
            explanation: 'Abuja is the capital city of Nigeria, located in the center of the country.',
            exam_year: 2023,
            exam_type: 'JAMB',
            topic: 'Geography'
          }
        ],
        answers: {
          '1': 'B',
          '2': 'A'
        },
        score: 1,
        totalQuestions: 2,
        timeTaken: 120,
        quizMode: 'practice',
        subject: 'mathematics'
      }
    })
  };
});

describe('QuizResultsPage - Explanation Visibility', () => {
  it('should show explanations for all questions in review screen', () => {
    render(
      <MemoryRouter>
        <QuizResultsPage />
      </MemoryRouter>
    );

    // Should show the first question's explanation
    expect(screen.getByText(/The sum of 2 and 2 is 4/i)).toBeInTheDocument();
  });

  it('should show correct and incorrect indicators', () => {
    render(
      <MemoryRouter>
        <QuizResultsPage />
      </MemoryRouter>
    );

    // Should show correct answer indicator
    expect(screen.getByText(/Correct Answer/i)).toBeInTheDocument();
  });

  it('should display question metadata (exam type, year, topic)', () => {
    render(
      <MemoryRouter>
        <QuizResultsPage />
      </MemoryRouter>
    );

    // Should show exam type
    expect(screen.getByText('JAMB')).toBeInTheDocument();

    // Should show exam year
    expect(screen.getByText('2023')).toBeInTheDocument();

    // Should show topic
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
  });

  it('should allow navigation between questions in review', () => {
    render(
      <MemoryRouter>
        <QuizResultsPage />
      </MemoryRouter>
    );

    // Should show navigation buttons
    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).not.toBeDisabled();

    const prevButton = screen.getByRole('button', { name: /Previous/i });
    expect(prevButton).toBeInTheDocument();
    expect(prevButton).toBeDisabled(); // First question, so previous should be disabled
  });

  it('should show overall score and statistics', () => {
    render(
      <MemoryRouter>
        <QuizResultsPage />
      </MemoryRouter>
    );

    // Should show percentage
    expect(screen.getByText('50%')).toBeInTheDocument();

    // Should show total questions
    expect(screen.getByText('2')).toBeInTheDocument();

    // Should show correct count
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
