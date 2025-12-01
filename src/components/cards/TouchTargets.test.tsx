import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuizModeCard } from './QuizModeCard';
import { QuickLinkCard } from './QuickLinkCard';
import { EventCard } from './EventCard';
import React from 'react';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  BookOpen: () => <div data-testid="icon-book" />,
  Clock: () => <div data-testid="icon-clock" />,
  Video: () => <div data-testid="icon-video" />,
}));

describe('Property 20: Touch targets meet minimum size', () => {
  it('QuizModeCard has card-touch-target class', () => {
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
    expect(card).toHaveClass('card-touch-target');
  });

  it('QuickLinkCard has card-touch-target class', () => {
    render(
      <QuickLinkCard
        title="Test Link"
        icon={<div />}
        backgroundColor="#ffffff"
        onClick={() => {}}
      />
    );
    
    const card = screen.getByRole('button');
    expect(card).toHaveClass('card-touch-target');
  });

  it('EventCard has card-touch-target class when clickable', () => {
    render(
      <EventCard
        title="Test Event"
        date={new Date()}
        type="exam"
        onClick={() => {}}
      />
    );
    
    const card = screen.getByRole('button');
    expect(card).toHaveClass('card-touch-target');
  });

  it('EventCard does not have card-touch-target class when not clickable', () => {
    const { container } = render(
      <EventCard
        title="Test Event"
        date={new Date()}
        type="exam"
      />
    );
    
    // When not clickable, it might not have role="button", so we query by container
    const card = container.firstChild;
    expect(card).not.toHaveClass('card-touch-target');
  });
});
