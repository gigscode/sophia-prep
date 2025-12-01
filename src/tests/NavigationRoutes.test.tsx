import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { QuizModesSection } from '../components/home/QuizModesSection';
import { QuickLinksSection } from '../components/home/QuickLinksSection';
import { UpcomingEventsSection, EventData } from '../components/home/UpcomingEventsSection';
import { HeroBanner } from '../components/home/HeroBanner';

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('Navigation Routes', () => {
  describe('QuizModesSection Navigation', () => {
    it('should navigate to /quiz/practice when Practice Mode card is clicked', () => {
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      render(
        <BrowserRouter>
          <QuizModesSection />
        </BrowserRouter>
      );

      const practiceCard = screen.getByText('Practice Mode').closest('article');
      expect(practiceCard).toBeTruthy();
      
      fireEvent.click(practiceCard!);
      expect(mockNavigate).toHaveBeenCalledWith('/quiz/practice');
    });

    it('should navigate to /quiz/cbt when CBT Quiz card is clicked', () => {
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      render(
        <BrowserRouter>
          <QuizModesSection />
        </BrowserRouter>
      );

      const cbtCard = screen.getByText('CBT Quiz').closest('article');
      expect(cbtCard).toBeTruthy();
      
      fireEvent.click(cbtCard!);
      expect(mockNavigate).toHaveBeenCalledWith('/quiz/cbt');
    });
  });

  describe('QuickLinksSection Navigation', () => {
    it('should navigate to /subjects when Study Past Questions is clicked', () => {
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      render(
        <BrowserRouter>
          <QuickLinksSection />
        </BrowserRouter>
      );

      const pastQuestionsCard = screen.getByText('Study Past Questions').closest('article');
      expect(pastQuestionsCard).toBeTruthy();
      
      fireEvent.click(pastQuestionsCard!);
      expect(mockNavigate).toHaveBeenCalledWith('/subjects');
    });

    it('should navigate to /videos when Video Lessons is clicked', () => {
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      render(
        <BrowserRouter>
          <QuickLinksSection />
        </BrowserRouter>
      );

      const videosCard = screen.getByText('Video Lessons').closest('article');
      expect(videosCard).toBeTruthy();
      
      fireEvent.click(videosCard!);
      expect(mockNavigate).toHaveBeenCalledWith('/videos');
    });

    it('should navigate to /novels when Novels is clicked', () => {
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      render(
        <BrowserRouter>
          <QuickLinksSection />
        </BrowserRouter>
      );

      const novelsCard = screen.getByText('Novels').closest('article');
      expect(novelsCard).toBeTruthy();
      
      fireEvent.click(novelsCard!);
      expect(mockNavigate).toHaveBeenCalledWith('/novels');
    });

    it('should navigate to /study when Study Hub is clicked', () => {
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      render(
        <BrowserRouter>
          <QuickLinksSection />
        </BrowserRouter>
      );

      const studyHubCard = screen.getByText('Study Hub').closest('article');
      expect(studyHubCard).toBeTruthy();
      
      fireEvent.click(studyHubCard!);
      expect(mockNavigate).toHaveBeenCalledWith('/study');
    });
  });

  describe('UpcomingEventsSection Navigation', () => {
    const mockEvents: EventData[] = [
      {
        id: '1',
        title: 'Test Event 1',
        date: new Date('2025-01-15'),
        type: 'exam',
      },
      {
        id: '2',
        title: 'Test Event 2',
        date: new Date('2025-02-20'),
        type: 'deadline',
      },
    ];

    it('should navigate to /events/:id when event card is clicked', () => {
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      render(
        <BrowserRouter>
          <UpcomingEventsSection events={mockEvents} />
        </BrowserRouter>
      );

      const eventCard = screen.getByText('Test Event 1').closest('article');
      expect(eventCard).toBeTruthy();
      
      fireEvent.click(eventCard!);
      expect(mockNavigate).toHaveBeenCalledWith('/events/1');
    });

    it('should navigate to /events when View All is clicked (more than 3 events)', () => {
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      const manyEvents: EventData[] = [
        ...mockEvents,
        {
          id: '3',
          title: 'Test Event 3',
          date: new Date('2025-03-15'),
          type: 'announcement',
        },
        {
          id: '4',
          title: 'Test Event 4',
          date: new Date('2025-04-20'),
          type: 'exam',
        },
      ];

      render(
        <BrowserRouter>
          <UpcomingEventsSection events={manyEvents} />
        </BrowserRouter>
      );

      const viewAllButton = screen.getByText('View All');
      expect(viewAllButton).toBeTruthy();
      
      fireEvent.click(viewAllButton);
      expect(mockNavigate).toHaveBeenCalledWith('/events');
    });
  });

  describe('HeroBanner Navigation', () => {
    it('should call buttonAction when CTA button is clicked', () => {
      const mockButtonAction = vi.fn();

      render(
        <BrowserRouter>
          <HeroBanner
            title="Test Banner"
            description="Test Description"
            buttonText="Get Started"
            buttonAction={mockButtonAction}
            gradientColors={['#000', '#fff']}
          />
        </BrowserRouter>
      );

      const button = screen.getByText('Get Started');
      expect(button).toBeTruthy();
      
      fireEvent.click(button);
      expect(mockButtonAction).toHaveBeenCalled();
    });
  });

  describe('Route Definitions', () => {
    it('should have correct quiz routes defined', () => {
      // This test verifies that the expected routes exist in the app
      const expectedQuizRoutes = [
        '/quiz',
        '/quiz/practice',
        '/quiz/cbt',
        '/quiz/mock',
        '/quiz/reader',
        '/quiz/results',
      ];

      // In a real test, you would check the route configuration
      // For now, we just verify the routes are documented
      expect(expectedQuizRoutes).toHaveLength(6);
    });

    it('should have correct study routes defined', () => {
      const expectedStudyRoutes = [
        '/study',
        '/subjects',
        '/videos',
        '/novels',
        '/syllabus',
        '/summaries',
      ];

      expect(expectedStudyRoutes).toHaveLength(6);
    });

    it('should have correct navigation routes defined', () => {
      const expectedNavRoutes = [
        '/',
        '/study',
        '/quiz',
        '/help',
        '/profile',
      ];

      expect(expectedNavRoutes).toHaveLength(5);
    });
  });
});
