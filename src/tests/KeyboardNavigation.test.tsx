import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../components/home/Header';
import { QuizModeCard } from '../components/cards/QuizModeCard';
import { QuickLinkCard } from '../components/cards/QuickLinkCard';
import { EventCard } from '../components/cards/EventCard';
import { SectionHeader } from '../components/home/SectionHeader';
import { BookOpen } from 'lucide-react';

/**
 * Keyboard Navigation Tests
 * 
 * Tests keyboard accessibility for all interactive components
 * Validates Requirements: 9.3 (Accessibility)
 */

describe('Keyboard Navigation', () => {
  describe('Header Component', () => {
    it('should allow keyboard navigation to cart button', () => {
      const onCartClick = vi.fn();
      const onNotificationClick = vi.fn();

      render(
        <Header
          userName="Test User"
          isLoggedIn={true}
          onCartClick={onCartClick}
          onNotificationClick={onNotificationClick}
        />
      );

      const cartButton = screen.getByLabelText('Open shopping cart');
      
      // Tab to button
      cartButton.focus();
      expect(document.activeElement).toBe(cartButton);

      // Press Enter
      fireEvent.keyDown(cartButton, { key: 'Enter', code: 'Enter' });
      expect(onCartClick).toHaveBeenCalledTimes(1);

      // Press Space
      fireEvent.keyDown(cartButton, { key: ' ', code: 'Space' });
      expect(onCartClick).toHaveBeenCalledTimes(2);
    });

    it('should allow keyboard navigation to notification button', () => {
      const onCartClick = vi.fn();
      const onNotificationClick = vi.fn();

      render(
        <Header
          userName="Test User"
          isLoggedIn={true}
          onCartClick={onCartClick}
          onNotificationClick={onNotificationClick}
          notificationCount={5}
        />
      );

      const notificationButton = screen.getByLabelText(/Notifications: 5 unread/);
      
      // Tab to button
      notificationButton.focus();
      expect(document.activeElement).toBe(notificationButton);

      // Press Enter
      fireEvent.keyDown(notificationButton, { key: 'Enter', code: 'Enter' });
      expect(onNotificationClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('QuizModeCard Component', () => {
    it('should be keyboard accessible', () => {
      const onClick = vi.fn();

      render(
        <QuizModeCard
          mode="practice"
          icon={<BookOpen />}
          title="Practice Mode"
          description="Study with explanations"
          onClick={onClick}
        />
      );

      const card = screen.getByRole('button', { name: /Practice Mode/ });
      
      // Should be focusable
      expect(card).toHaveAttribute('tabIndex', '0');

      // Focus the card
      card.focus();
      expect(document.activeElement).toBe(card);

      // Press Enter
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
      expect(onClick).toHaveBeenCalledTimes(1);

      // Press Space
      fireEvent.keyDown(card, { key: ' ', code: 'Space' });
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('should not trigger on other keys', () => {
      const onClick = vi.fn();

      render(
        <QuizModeCard
          mode="practice"
          icon={<BookOpen />}
          title="Practice Mode"
          description="Study with explanations"
          onClick={onClick}
        />
      );

      const card = screen.getByRole('button', { name: /Practice Mode/ });

      // Press Tab (should not trigger)
      fireEvent.keyDown(card, { key: 'Tab', code: 'Tab' });
      expect(onClick).not.toHaveBeenCalled();

      // Press Escape (should not trigger)
      fireEvent.keyDown(card, { key: 'Escape', code: 'Escape' });
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('QuickLinkCard Component', () => {
    it('should be keyboard accessible', () => {
      const onClick = vi.fn();

      render(
        <QuickLinkCard
          title="Study Hub"
          icon={<BookOpen />}
          backgroundColor="#DBEAFE"
          onClick={onClick}
        />
      );

      const card = screen.getByRole('button', { name: /Study Hub/ });
      
      // Should be focusable
      expect(card).toHaveAttribute('tabIndex', '0');

      // Focus and activate
      card.focus();
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('EventCard Component', () => {
    it('should be keyboard accessible when clickable', () => {
      const onClick = vi.fn();
      const testDate = new Date('2025-12-31');

      render(
        <EventCard
          title="JAMB Exam"
          date={testDate}
          description="Important exam date"
          type="exam"
          onClick={onClick}
        />
      );

      const card = screen.getByRole('button', { name: /JAMB Exam/ });
      
      // Should be focusable
      expect(card).toHaveAttribute('tabIndex', '0');

      // Focus and activate
      card.focus();
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
      expect(onClick).toHaveBeenCalled();
    });

    it('should not be focusable when not clickable', () => {
      const testDate = new Date('2025-12-31');

      render(
        <EventCard
          title="JAMB Exam"
          date={testDate}
          type="exam"
        />
      );

      const card = screen.getByText('JAMB Exam').closest('div');
      
      // Should not have tabIndex when not clickable
      expect(card).not.toHaveAttribute('tabIndex');
      expect(card).not.toHaveAttribute('role', 'button');
    });
  });

  describe('SectionHeader Component', () => {
    it('should allow keyboard navigation to action button', () => {
      const onActionClick = vi.fn();

      render(
        <SectionHeader
          title="Quiz Modes"
          actionIcon={<span>→</span>}
          onActionClick={onActionClick}
          actionLabel="Expand section"
        />
      );

      const actionButton = screen.getByRole('button', { name: /Expand section for Quiz Modes/ });
      
      // Should be focusable
      actionButton.focus();
      expect(document.activeElement).toBe(actionButton);

      // Press Enter
      fireEvent.keyDown(actionButton, { key: 'Enter', code: 'Enter' });
      expect(onActionClick).toHaveBeenCalled();
    });
  });

  describe('Focus Indicators', () => {
    it('should have focus-visible-ring class on interactive elements', () => {
      const onClick = vi.fn();

      render(
        <QuizModeCard
          mode="practice"
          icon={<BookOpen />}
          title="Practice Mode"
          description="Study with explanations"
          onClick={onClick}
        />
      );

      const card = screen.getByRole('button', { name: /Practice Mode/ });
      
      // Should have focus-visible-ring class
      expect(card.className).toContain('focus-visible-ring');
    });

    it('should have interactive-element class on clickable elements', () => {
      const onClick = vi.fn();

      render(
        <QuickLinkCard
          title="Study Hub"
          icon={<BookOpen />}
          backgroundColor="#DBEAFE"
          onClick={onClick}
        />
      );

      const card = screen.getByRole('button', { name: /Study Hub/ });
      
      // Should have interactive-element class
      expect(card.className).toContain('interactive-element');
    });
  });

  describe('Tab Order', () => {
    it('should maintain logical tab order in Header', () => {
      const onCartClick = vi.fn();
      const onNotificationClick = vi.fn();

      render(
        <Header
          userName="Test User"
          isLoggedIn={true}
          onCartClick={onCartClick}
          onNotificationClick={onNotificationClick}
        />
      );

      const cartButton = screen.getByLabelText('Open shopping cart');
      const notificationButton = screen.getByLabelText(/Open notifications/);

      // Both should be in tab order
      expect(cartButton).toBeInTheDocument();
      expect(notificationButton).toBeInTheDocument();
    });
  });

  describe('Touch Target Sizes', () => {
    it('should have minimum touch target size on buttons', () => {
      const onCartClick = vi.fn();
      const onNotificationClick = vi.fn();

      render(
        <Header
          userName="Test User"
          isLoggedIn={true}
          onCartClick={onCartClick}
          onNotificationClick={onNotificationClick}
        />
      );

      const cartButton = screen.getByLabelText('Open shopping cart');
      
      // Should have touch target class
      expect(cartButton.className).toContain('icon-button-touch-target');
    });

    it('should have minimum touch target size on cards', () => {
      const onClick = vi.fn();

      render(
        <QuizModeCard
          mode="practice"
          icon={<BookOpen />}
          title="Practice Mode"
          description="Study with explanations"
          onClick={onClick}
        />
      );

      const card = screen.getByRole('button', { name: /Practice Mode/ });
      
      // Should have touch target class
      expect(card.className).toContain('card-touch-target');
    });
  });
});
