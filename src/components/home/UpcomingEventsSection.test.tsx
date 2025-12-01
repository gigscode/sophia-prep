import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { UpcomingEventsSection } from './UpcomingEventsSection';

// Wrapper component to provide router context
function renderWithRouter(component: React.ReactElement) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('UpcomingEventsSection', () => {
  const mockEvents = [
    {
      id: '1',
      title: 'JAMB UTME 2025',
      date: new Date('2025-05-15'),
      description: 'Unified Tertiary Matriculation Examination',
      type: 'exam' as const,
    },
    {
      id: '2',
      title: 'WAEC Registration Deadline',
      date: new Date('2025-03-31'),
      description: 'Last day to register',
      type: 'deadline' as const,
    },
    {
      id: '3',
      title: 'New Study Materials',
      date: new Date('2025-02-10'),
      type: 'announcement' as const,
    },
  ];

  it('renders section header with title (Requirement 6.1)', () => {
    renderWithRouter(<UpcomingEventsSection events={mockEvents} />);
    
    expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
  });

  it('renders event cards for provided events (Requirement 6.1)', () => {
    renderWithRouter(<UpcomingEventsSection events={mockEvents} />);
    
    expect(screen.getByText('JAMB UTME 2025')).toBeInTheDocument();
    expect(screen.getByText('WAEC Registration Deadline')).toBeInTheDocument();
    expect(screen.getByText('New Study Materials')).toBeInTheDocument();
  });

  it('shows View All link when more than 3 events exist (Requirement 6.4)', () => {
    const manyEvents = [
      ...mockEvents,
      {
        id: '4',
        title: 'Mock Exam',
        date: new Date('2025-04-20'),
        type: 'exam' as const,
      },
    ];

    renderWithRouter(<UpcomingEventsSection events={manyEvents} />);
    
    expect(screen.getByText('View All')).toBeInTheDocument();
  });

  it('does not show View All link when 3 or fewer events exist (Requirement 6.4)', () => {
    renderWithRouter(<UpcomingEventsSection events={mockEvents} />);
    
    expect(screen.queryByText('View All')).not.toBeInTheDocument();
  });

  it('calls onViewAllClick when View All is clicked (Requirement 6.5)', async () => {
    const handleViewAll = vi.fn();
    const user = userEvent.setup();
    
    const manyEvents = [
      ...mockEvents,
      {
        id: '4',
        title: 'Mock Exam',
        date: new Date('2025-04-20'),
        type: 'exam' as const,
      },
    ];

    renderWithRouter(
      <UpcomingEventsSection events={manyEvents} onViewAllClick={handleViewAll} />
    );
    
    const viewAllButton = screen.getByText('View All');
    await user.click(viewAllButton);
    
    expect(handleViewAll).toHaveBeenCalledTimes(1);
  });

  it('uses responsive grid layout (Requirement 6.1)', () => {
    const { container } = renderWithRouter(<UpcomingEventsSection events={mockEvents} />);
    
    // Check for responsive grid classes
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
  });

  it('renders nothing when no events are provided', () => {
    const { container } = renderWithRouter(<UpcomingEventsSection events={[]} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('applies custom className when provided', () => {
    const { container } = renderWithRouter(
      <UpcomingEventsSection events={mockEvents} className="custom-events-class" />
    );
    
    const section = container.querySelector('.custom-events-class');
    expect(section).toBeInTheDocument();
  });

  it('renders event cards with dates (Requirement 6.2)', () => {
    renderWithRouter(<UpcomingEventsSection events={mockEvents} />);
    
    // Check that dates are displayed in the expected format
    expect(screen.getByText('15')).toBeInTheDocument(); // Day from first event
    expect(screen.getByText('31')).toBeInTheDocument(); // Day from second event
    expect(screen.getByText('10')).toBeInTheDocument(); // Day from third event
  });

  it('renders event type indicators (Requirement 6.3)', () => {
    renderWithRouter(<UpcomingEventsSection events={mockEvents} />);
    
    // Check that event types are displayed
    expect(screen.getByText('exam')).toBeInTheDocument();
    expect(screen.getByText('deadline')).toBeInTheDocument();
    expect(screen.getByText('announcement')).toBeInTheDocument();
  });
});
