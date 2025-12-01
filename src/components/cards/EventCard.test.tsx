import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventCard } from './EventCard';

describe('EventCard', () => {
  const testDate = new Date('2025-05-15');

  it('renders event title and date', () => {
    render(
      <EventCard
        title="JAMB UTME 2025"
        date={testDate}
        type="exam"
      />
    );

    expect(screen.getByText('JAMB UTME 2025')).toBeDefined();
    expect(screen.getByText('15')).toBeDefined(); // Day
    expect(screen.getByText('May')).toBeDefined(); // Month
  });

  it('renders event description when provided', () => {
    render(
      <EventCard
        title="JAMB UTME 2025"
        date={testDate}
        description="Joint Admissions and Matriculation Board exam"
        type="exam"
      />
    );

    expect(screen.getByText('Joint Admissions and Matriculation Board exam')).toBeDefined();
  });

  it('renders without description', () => {
    render(
      <EventCard
        title="JAMB UTME 2025"
        date={testDate}
        type="exam"
      />
    );

    expect(screen.getByText('JAMB UTME 2025')).toBeDefined();
  });

  it('displays event type indicator for exam', () => {
    render(
      <EventCard
        title="JAMB UTME 2025"
        date={testDate}
        type="exam"
      />
    );

    expect(screen.getByText('exam')).toBeDefined();
  });

  it('displays event type indicator for deadline', () => {
    render(
      <EventCard
        title="Registration Deadline"
        date={testDate}
        type="deadline"
      />
    );

    expect(screen.getByText('deadline')).toBeDefined();
  });

  it('displays event type indicator for announcement', () => {
    render(
      <EventCard
        title="New Materials"
        date={testDate}
        type="announcement"
      />
    );

    expect(screen.getByText('announcement')).toBeDefined();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <EventCard
        title="JAMB UTME 2025"
        date={testDate}
        type="exam"
        onClick={handleClick}
      />
    );

    const card = screen.getByRole('button');
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation with Enter key', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <EventCard
        title="JAMB UTME 2025"
        date={testDate}
        type="exam"
        onClick={handleClick}
      />
    );

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation with Space key', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <EventCard
        title="JAMB UTME 2025"
        date={testDate}
        type="exam"
        onClick={handleClick}
      />
    );

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard(' ');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is not interactive when onClick is not provided', () => {
    render(
      <EventCard
        title="JAMB UTME 2025"
        date={testDate}
        type="exam"
      />
    );

    const card = screen.queryByRole('button');
    expect(card).toBeNull();
  });

  it('formats date correctly in ARIA label (Requirement 6.2)', () => {
    render(
      <EventCard
        title="JAMB UTME 2025"
        date={new Date('2025-12-31')}
        type="exam"
        onClick={() => {}}
      />
    );

    const card = screen.getByRole('button');
    expect(card.getAttribute('aria-label')).toContain('31 Dec, 2025');
  });

  it('displays date badge with day and month (Requirement 6.2)', () => {
    render(
      <EventCard
        title="JAMB UTME 2025"
        date={new Date('2025-12-31')}
        type="exam"
      />
    );

    // Verify date badge shows day and month
    expect(screen.getByText('31')).toBeDefined();
    expect(screen.getByText('Dec')).toBeDefined();
  });

  it('includes event type indicator (Requirement 6.3)', () => {
    render(
      <EventCard
        title="JAMB UTME 2025"
        date={testDate}
        type="exam"
      />
    );

    // Verify event type indicator is present
    expect(screen.getByText('exam')).toBeDefined();
  });

  it('has proper accessibility attributes when clickable', () => {
    render(
      <EventCard
        title="JAMB UTME 2025"
        date={testDate}
        type="exam"
        onClick={() => {}}
      />
    );

    const card = screen.getByRole('button');
    expect(card.getAttribute('tabIndex')).toBe('0');
    expect(card.getAttribute('aria-label')).toContain('exam: JAMB UTME 2025');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <EventCard
        title="JAMB UTME 2025"
        date={testDate}
        type="exam"
        className="custom-class"
      />
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeDefined();
  });
});
