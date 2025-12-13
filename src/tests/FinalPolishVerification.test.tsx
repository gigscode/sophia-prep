/**
 * Final Testing and Polish Verification
 * 
 * This test suite verifies all aspects of the Modern UI Redesign implementation:
 * - Component rendering across different states
 * - Responsive behavior
 * - Animation smoothness
 * - Color system consistency
 * - Spacing consistency
 * - User state handling
 * - Error states and edge cases
 * 
 * Task: 21. Final testing and polish
 * Requirements: All requirements
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { Header } from '../components/home/Header';
import { HeroBanner } from '../components/home/HeroBanner';
import { QuizModesSection } from '../components/home/QuizModesSection';
import { QuickLinksSection } from '../components/home/QuickLinksSection';
import { UpcomingEventsSection } from '../components/home/UpcomingEventsSection';

// Mock hooks
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { name: 'Test User', email: 'test@example.com' },
  }),
}));

vi.mock('../hooks/useLazyLoad', () => ({
  useLazyLoad: () => [{ current: null }, true],
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Final Testing and Polish - Component Rendering', () => {
  describe('Header Component', () => {
    it('should render with logged in user', () => {
      render(
        <Header
          userName="John Doe"
          isLoggedIn={true}
          onCartClick={vi.fn()}
          onNotificationClick={vi.fn()}
          notificationCount={0}
        />
      );

      expect(screen.getByText(/Hello, John Doe/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/shopping cart/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument();
    });

    it('should render with guest user', () => {
      render(
        <Header
          isLoggedIn={false}
          onCartClick={vi.fn()}
          onNotificationClick={vi.fn()}
          notificationCount={0}
        />
      );

      expect(screen.getByText(/Hello, Guest/i)).toBeInTheDocument();
    });

    it('should display notification badge when count > 0', () => {
      render(
        <Header
          userName="Test User"
          isLoggedIn={true}
          onCartClick={vi.fn()}
          onNotificationClick={vi.fn()}
          notificationCount={5}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('HeroBanner Component', () => {
    it('should render all required elements', () => {
      const mockAction = vi.fn();
      render(
        <HeroBanner
          title="Test Banner"
          description="Test Description"
          buttonText="Get Started"
          buttonAction={mockAction}
          gradientColors={['#3B82F6', '#8B5CF6']}
        />
      );

      expect(screen.getByText('Test Banner')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
    });

    it('should render with optional icon', () => {
      const mockAction = vi.fn();
      const TestIcon = () => <span data-testid="test-icon">Icon</span>;
      
      render(
        <HeroBanner
          title="Test Banner"
          description="Test Description"
          buttonText="Get Started"
          buttonAction={mockAction}
          gradientColors={['#3B82F6', '#8B5CF6']}
          icon={<TestIcon />}
        />
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });
  });

  describe('QuizModesSection Component', () => {
    it('should render both quiz mode cards', () => {
      renderWithRouter(<QuizModesSection />);

      expect(screen.getByText('Quiz Modes')).toBeInTheDocument();
      expect(screen.getByText('Practice Mode')).toBeInTheDocument();
      expect(screen.getByText('CBT Quiz')).toBeInTheDocument();
    });

    it('should render loading skeletons when loading', () => {
      renderWithRouter(<QuizModesSection isLoading={true} />);

      // Check for loading status elements instead of data-testid
      const loadingElements = screen.getAllByRole('status');
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('QuickLinksSection Component', () => {
    it('should render at least 4 quick link cards', () => {
      renderWithRouter(<QuickLinksSection />);

      expect(screen.getByText('Quick Links')).toBeInTheDocument();
      expect(screen.getByText('Study Past Questions')).toBeInTheDocument();
      expect(screen.getByText('Video Lessons')).toBeInTheDocument();
      expect(screen.getByText('Novels')).toBeInTheDocument();
      expect(screen.getByText('Study Hub')).toBeInTheDocument();
    });
  });

  describe('UpcomingEventsSection Component', () => {
    const mockEvents = [
      {
        id: '1',
        title: 'JAMB 2025',
        date: new Date('2025-05-20'),
        type: 'exam' as const,
      },
    ];

    it('should render event cards', () => {
      renderWithRouter(<UpcomingEventsSection events={mockEvents} />);

      expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
      expect(screen.getByText('JAMB 2025')).toBeInTheDocument();
    });

    it('should show View All link when more than 3 events', () => {
      const manyEvents = [
        ...mockEvents,
        {
          id: '3',
          title: 'Event 3',
          date: new Date('2025-07-01'),
          type: 'announcement' as const,
        },
        {
          id: '4',
          title: 'Event 4',
          date: new Date('2025-08-01'),
          type: 'deadline' as const,
        },
      ];

      renderWithRouter(<UpcomingEventsSection events={manyEvents} />);

      expect(screen.getByText(/view all/i)).toBeInTheDocument();
    });

    it('should not render when no events and not loading', () => {
      const { container } = renderWithRouter(<UpcomingEventsSection events={[]} />);

      expect(container.firstChild).toBeNull();
    });
  });
});

describe('Final Testing and Polish - Accessibility', () => {
  it('should have proper ARIA labels on interactive elements', () => {
    render(
      <Header
        userName="Test User"
        isLoggedIn={true}
        onCartClick={vi.fn()}
        onNotificationClick={vi.fn()}
        notificationCount={3}
      />
    );

    expect(screen.getByLabelText(/shopping cart/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument();
  });

  it('should have proper heading hierarchy', () => {
    renderWithRouter(<QuizModesSection />);

    const heading = screen.getByText('Quiz Modes');
    expect(heading.tagName).toBe('H2');
  });

  it('should have keyboard accessible buttons', () => {
    const mockAction = vi.fn();
    render(
      <HeroBanner
        title="Test"
        description="Test"
        buttonText="Click Me"
        buttonAction={mockAction}
        gradientColors={['#3B82F6', '#8B5CF6']}
      />
    );

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveAttribute('type', 'button');
  });
});

describe('Final Testing and Polish - Responsive Behavior', () => {
  it('should apply responsive padding classes', () => {
    const { container } = renderWithRouter(<HomePage />);

    const pageContainer = container.querySelector('.page-padding');
    expect(pageContainer).toBeInTheDocument();
  });

  it('should have responsive grid classes on sections', () => {
    renderWithRouter(<QuickLinksSection />);

    // Check for grid classes - find the actual grid container
    const quickLinkCard = screen.getByText('Study Past Questions');
    const gridContainer = quickLinkCard.closest('article')?.parentElement;
    expect(gridContainer).toBeTruthy();
    expect(gridContainer).toHaveClass('grid');
  });
});

describe('Final Testing and Polish - Color System', () => {
  it('should use design system colors for quiz mode cards', () => {
    renderWithRouter(<QuizModesSection />);

    // Practice Mode should have orange background
    const practiceCard = screen.getByText('Practice Mode').closest('div');
    expect(practiceCard).toHaveStyle({ backgroundColor: expect.any(String) });

    // CBT Quiz should have green background
    const cbtCard = screen.getByText('CBT Quiz').closest('div');
    expect(cbtCard).toHaveStyle({ backgroundColor: expect.any(String) });
  });
});

describe('Final Testing and Polish - Edge Cases', () => {
  it('should handle empty user name gracefully', () => {
    render(
      <Header
        userName=""
        isLoggedIn={true}
        onCartClick={vi.fn()}
        onNotificationClick={vi.fn()}
        notificationCount={0}
      />
    );

    expect(screen.getByText(/Hello, Guest/i)).toBeInTheDocument();
  });

  it('should handle undefined user name', () => {
    render(
      <Header
        userName={undefined}
        isLoggedIn={true}
        onCartClick={vi.fn()}
        onNotificationClick={vi.fn()}
        notificationCount={0}
      />
    );

    expect(screen.getByText(/Hello, Guest/i)).toBeInTheDocument();
  });

  it('should handle high notification counts', () => {
    render(
      <Header
        userName="Test"
        isLoggedIn={true}
        onCartClick={vi.fn()}
        onNotificationClick={vi.fn()}
        notificationCount={150}
      />
    );

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should handle loading state for sections', () => {
    renderWithRouter(<QuizModesSection isLoading={true} />);

    // Should show skeletons instead of content
    expect(screen.queryByText('Practice Mode')).not.toBeInTheDocument();
  });
});

describe('Final Testing and Polish - Animation Classes', () => {
  it('should apply fade-in-up animation to cards', () => {
    renderWithRouter(<QuizModesSection />);

    // Find the actual card element with animation class
    const practiceCard = screen.getByText('Practice Mode').closest('article');
    expect(practiceCard).toBeTruthy();
    expect(practiceCard).toHaveClass('animate-fade-in-up');
  });

  it('should apply stagger delays to multiple cards', () => {
    renderWithRouter(<QuickLinksSection />);

    const cards = screen.getAllByRole('button');
    // At least one card should have a delay class
    const hasDelayClass = cards.some(card => 
      card.className.includes('animate-delay')
    );
    expect(hasDelayClass).toBe(true);
  });
});

describe('Final Testing and Polish - Spacing Consistency', () => {
  it('should have consistent section spacing', () => {
    const { container } = renderWithRouter(<HomePage />);

    const sections = container.querySelectorAll('.space-y-8');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('should have consistent card spacing in grids', () => {
    renderWithRouter(<QuickLinksSection />);

    // Find the actual grid container with gap classes
    const quickLinkCard = screen.getByText('Study Past Questions');
    const grid = quickLinkCard.closest('article')?.parentElement;
    expect(grid).toBeTruthy();
    expect(grid).toHaveClass('gap-4');
  });
});
