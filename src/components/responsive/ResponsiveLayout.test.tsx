/**
 * Responsive Layout Implementation Test
 * 
 * Tests for responsive grid layouts, touch targets, and card sizing
 * across different breakpoints.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuizModesSection } from '../home/QuizModesSection';
import { QuickLinksSection } from '../home/QuickLinksSection';
import { UpcomingEventsSection } from '../home/UpcomingEventsSection';
import { QuizModeCard } from '../cards/QuizModeCard';
import { QuickLinkCard } from '../cards/QuickLinkCard';
import { EventCard } from '../cards/EventCard';
import { FeatureCard } from '../cards/FeatureCard';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  BookOpen: () => <div data-testid="icon-book" />,
  Clock: () => <div data-testid="icon-clock" />,
  Video: () => <div data-testid="icon-video" />,
  GraduationCap: () => <div data-testid="icon-graduation" />,
  BookMarked: () => <div data-testid="icon-bookmarked" />,
  ChevronRight: () => <div data-testid="icon-chevron" />,
}));

describe('Responsive Layout Implementation', () => {
  describe('Grid Layouts - Requirements 11.1, 11.2, 11.3', () => {
    it('QuizModesSection uses responsive grid classes', () => {
      const { container } = render(<QuizModesSection />);
      
      // Find the grid container
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      
      // Check responsive grid classes
      expect(gridContainer).toHaveClass('grid-cols-1'); // Mobile: 1 column
      expect(gridContainer).toHaveClass('md:grid-cols-2'); // Tablet+: 2 columns
      expect(gridContainer).toHaveClass('gap-4'); // Consistent gap
      expect(gridContainer).toHaveClass('w-full'); // Full width
    });

    it('QuickLinksSection uses responsive grid classes', () => {
      const { container } = render(<QuickLinksSection />);
      
      // Find the grid container
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      
      // Check responsive grid classes
      expect(gridContainer).toHaveClass('grid-cols-1'); // Mobile: 1 column
      expect(gridContainer).toHaveClass('sm:grid-cols-2'); // Tablet: 2 columns
      expect(gridContainer).toHaveClass('lg:grid-cols-4'); // Desktop: 4 columns
      expect(gridContainer).toHaveClass('gap-4'); // Consistent gap
      expect(gridContainer).toHaveClass('w-full'); // Full width
    });

    it('UpcomingEventsSection uses responsive grid classes', () => {
      const events = [
        {
          id: '1',
          title: 'Test Event',
          date: new Date(),
          type: 'exam' as const,
        },
      ];
      
      const { container } = render(<UpcomingEventsSection events={events} />);
      
      // Find the grid container
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      
      // Check responsive grid classes
      expect(gridContainer).toHaveClass('grid-cols-1'); // Mobile: 1 column
      expect(gridContainer).toHaveClass('md:grid-cols-2'); // Tablet: 2 columns
      expect(gridContainer).toHaveClass('lg:grid-cols-3'); // Desktop: 3 columns
      expect(gridContainer).toHaveClass('gap-4'); // Consistent gap
      expect(gridContainer).toHaveClass('w-full'); // Full width
    });
  });

  describe('Touch Targets - Requirement 11.5', () => {
    it('QuizModeCard meets minimum touch target size', () => {
      render(
        <QuizModeCard
          mode="practice"
          icon={<div />}
          title="Test Mode"
          description="Test Description"
          onClick={() => {}}
        />
      );
      
      const card = screen.getByRole('button');
      
      // Check minimum touch target size classes
      expect(card).toHaveClass('min-h-[44px]'); // Minimum height
      expect(card).toHaveClass('w-full'); // Full width
      expect(card).toHaveClass('p-6'); // Adequate padding
      expect(card).toHaveClass('cursor-pointer'); // Interactive indicator
    });

    it('QuickLinkCard meets minimum touch target size', () => {
      render(
        <QuickLinkCard
          title="Test Link"
          icon={<div />}
          backgroundColor="#ffffff"
          onClick={() => {}}
        />
      );
      
      const card = screen.getByRole('button');
      
      // Check minimum touch target size classes
      expect(card).toHaveClass('min-h-[44px]'); // Minimum height
      expect(card).toHaveClass('min-w-[44px]'); // Minimum width
      expect(card).toHaveClass('w-full'); // Full width
      expect(card).toHaveClass('p-6'); // Adequate padding
    });

    it('EventCard meets minimum touch target size when clickable', () => {
      render(
        <EventCard
          title="Test Event"
          date={new Date()}
          type="exam"
          onClick={() => {}}
        />
      );
      
      const card = screen.getByRole('button');
      
      // Check minimum touch target size classes - EventCard uses card-touch-target class
      expect(card).toHaveClass('card-touch-target'); // Touch target class
      expect(card).toHaveClass('w-full'); // Full width
      expect(card).toHaveClass('p-4'); // Adequate padding
    });

    it('FeatureCard meets minimum touch target size', () => {
      render(
        <FeatureCard
          title="Test Feature"
          icon={<div />}
          iconBackgroundColor="#ffffff"
          onClick={() => {}}
        />
      );
      
      const card = screen.getByRole('button');
      
      // Check minimum touch target size classes
      expect(card).toHaveClass('min-h-[44px]'); // Minimum height
      expect(card).toHaveClass('min-w-[44px]'); // Minimum width
      expect(card).toHaveClass('w-full'); // Full width
    });
  });

  describe('Card Sizing and Spacing - Requirement 11.4', () => {
    it('cards adjust size appropriately with responsive classes', () => {
      render(
        <QuizModeCard
          mode="practice"
          icon={<div />}
          title="Test Mode"
          description="Test Description"
          onClick={() => {}}
        />
      );
      
      const card = screen.getByRole('button');
      
      // Check card sizing classes
      expect(card).toHaveClass('w-full'); // Full width
      expect(card).toHaveClass('rounded-2xl'); // Consistent border radius
      expect(card).toHaveClass('p-6'); // Consistent padding
      expect(card).toHaveClass('shadow-sm'); // Consistent shadow
    });

    it('cards maintain consistent spacing in grids', () => {
      const { container } = render(<QuizModesSection />);
      
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('gap-4'); // 16px gap between cards
    });
  });

  describe('Accessibility and Focus Management', () => {
    it('interactive cards have proper focus indicators', () => {
      render(
        <QuizModeCard
          mode="practice"
          icon={<div />}
          title="Test Mode"
          description="Test Description"
          onClick={() => {}}
        />
      );
      
      const card = screen.getByRole('button');
      
      // Check focus management classes - uses focus-visible-ring utility class
      expect(card).toHaveClass('focus-visible-ring');
    });

    it('cards have proper ARIA labels', () => {
      render(
        <QuizModeCard
          mode="practice"
          icon={<div />}
          title="Practice Mode"
          description="Test with explanations"
          onClick={() => {}}
        />
      );
      
      const card = screen.getByRole('button');
      // QuizModeCard uses format: "Quiz mode: {title}. {description}"
      expect(card).toHaveAttribute('aria-label', 'Quiz mode: Practice Mode. Test with explanations');
    });

    it('cards support keyboard navigation', () => {
      render(
        <QuickLinkCard
          title="Test Link"
          icon={<div />}
          backgroundColor="#ffffff"
          onClick={() => {}}
        />
      );
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Responsive Behavior Validation', () => {
    it('sections maintain proper structure across breakpoints', () => {
      const { container } = render(<QuickLinksSection />);
      
      // Check section structure
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('space-y-4'); // Consistent vertical spacing
      
      // Check grid container
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('w-full'); // Full width at all breakpoints
    });

    it('cards maintain aspect ratios when specified', () => {
      render(
        <QuickLinkCard
          title="Test Link"
          icon={<div />}
          backgroundColor="#ffffff"
          onClick={() => {}}
          aspectRatio="1:1"
        />
      );
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('aspect-square'); // 1:1 aspect ratio
    });

    it('cards handle different aspect ratios correctly', () => {
      render(
        <QuickLinkCard
          title="Test Link"
          icon={<div />}
          backgroundColor="#ffffff"
          onClick={() => {}}
          aspectRatio="4:3"
        />
      );
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('aspect-[4/3]'); // 4:3 aspect ratio
    });
  });

  describe('Performance and Optimization', () => {
    it('cards use efficient CSS classes for transitions', () => {
      render(
        <QuizModeCard
          mode="practice"
          icon={<div />}
          title="Test Mode"
          description="Test Description"
          onClick={() => {}}
        />
      );
      
      const card = screen.getByRole('button');
      
      // Check transition classes
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('duration-200');
      expect(card).toHaveClass('ease-out');
    });

    it('hover effects are properly configured', () => {
      render(
        <FeatureCard
          title="Test Feature"
          icon={<div />}
          iconBackgroundColor="#ffffff"
          onClick={() => {}}
        />
      );
      
      const card = screen.getByRole('button');
      
      // Check hover effect classes
      expect(card).toHaveClass('hover:scale-[1.02]');
      expect(card).toHaveClass('hover:shadow-lg');
    });
  });
});