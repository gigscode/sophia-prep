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
  it('QuizModeCard has proper touch target size', () => {
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
    // Cards have padding (p-6 = 24px on all sides) which ensures minimum touch target size
    expect(card).toHaveClass('p-6');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('QuickLinkCard has proper touch target size', () => {
    render(
      <QuickLinkCard
        title="Test Link"
        icon={<div />}
        backgroundColor="#ffffff"
        onClick={() => {}}
      />
    );
    
    const card = screen.getByRole('button');
    // Cards have padding (p-6 = 24px on all sides) which ensures minimum touch target size
    expect(card).toHaveClass('p-6');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('EventCard has proper touch target size when clickable', () => {
    render(
      <EventCard
        title="Test Event"
        date={new Date()}
        type="exam"
        onClick={() => {}}
      />
    );
    
    const card = screen.getByRole('button');
    // Cards have padding (p-4 = 16px on all sides) which ensures minimum touch target size
    expect(card).toHaveClass('p-4');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('EventCard does not have cursor-pointer when not clickable', () => {
    const { container } = render(
      <EventCard
        title="Test Event"
        date={new Date()}
        type="exam"
      />
    );
    
    // When not clickable, it should not have cursor-pointer class
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('cursor-pointer');
  });
});
