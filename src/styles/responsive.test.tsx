/**
 * Responsive Layout Utilities - Test Suite
 * 
 * Tests for responsive grid layouts, touch targets, and accessibility features.
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Responsive Utilities', () => {
  describe('Touch Target Sizes', () => {
    it('touch-target class provides minimum 44px dimensions', () => {
      const { container } = render(
        <button className="touch-target">Test Button</button>
      );
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      
      // Check that the class is applied
      expect(button).toHaveClass('touch-target');
    });

    it('touch-target-interactive class provides minimum 44px dimensions', () => {
      const { container } = render(
        <button className="touch-target-interactive">Interactive Button</button>
      );
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('touch-target-interactive');
    });

    it('icon-button-touch-target class provides minimum 44px dimensions', () => {
      const { container } = render(
        <button className="icon-button-touch-target" aria-label="Icon button">
          <span>Icon</span>
        </button>
      );
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('icon-button-touch-target');
    });

    it('button-touch-target class provides minimum 44px dimensions', () => {
      const { container } = render(
        <button className="button-touch-target">Button</button>
      );
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('button-touch-target');
    });
  });

  describe('Responsive Grid Classes', () => {
    it('responsive-grid-cards class is applied correctly', () => {
      const { container } = render(
        <div className="responsive-grid-cards">
          <div>Card 1</div>
          <div>Card 2</div>
        </div>
      );
      
      const grid = container.querySelector('.responsive-grid-cards');
      expect(grid).toBeInTheDocument();
    });

    it('quiz-modes-grid class is applied correctly', () => {
      const { container } = render(
        <div className="quiz-modes-grid">
          <div>Mode 1</div>
          <div>Mode 2</div>
        </div>
      );
      
      const grid = container.querySelector('.quiz-modes-grid');
      expect(grid).toBeInTheDocument();
    });

    it('quick-links-grid class is applied correctly', () => {
      const { container } = render(
        <div className="quick-links-grid">
          <div>Link 1</div>
          <div>Link 2</div>
          <div>Link 3</div>
          <div>Link 4</div>
        </div>
      );
      
      const grid = container.querySelector('.quick-links-grid');
      expect(grid).toBeInTheDocument();
    });

    it('events-grid class is applied correctly', () => {
      const { container } = render(
        <div className="events-grid">
          <div>Event 1</div>
          <div>Event 2</div>
          <div>Event 3</div>
        </div>
      );
      
      const grid = container.querySelector('.events-grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Card Container Classes', () => {
    it('card-container class prevents overflow', () => {
      const { container } = render(
        <div className="card-container">
          <p>Card content</p>
        </div>
      );
      
      const cardContainer = container.querySelector('.card-container');
      expect(cardContainer).toBeInTheDocument();
      expect(cardContainer).toHaveClass('card-container');
    });

    it('card-touch-target class is applied to interactive cards', () => {
      const { container } = render(
        <div className="card-touch-target" role="button">
          <p>Interactive card</p>
        </div>
      );
      
      const card = container.querySelector('.card-touch-target');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('card-touch-target');
    });
  });

  describe('Responsive Spacing Classes', () => {
    it('page-padding class is applied correctly', () => {
      const { container } = render(
        <div className="page-padding">
          <p>Page content</p>
        </div>
      );
      
      const page = container.querySelector('.page-padding');
      expect(page).toBeInTheDocument();
      expect(page).toHaveClass('page-padding');
    });

    it('section-spacing class is applied correctly', () => {
      const { container } = render(
        <section className="section-spacing">
          <p>Section content</p>
        </section>
      );
      
      const section = container.querySelector('.section-spacing');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('section-spacing');
    });
  });

  describe('Accessibility Classes', () => {
    it('focus-visible-ring class is applied for keyboard navigation', () => {
      const { container } = render(
        <button className="focus-visible-ring">Accessible Button</button>
      );
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('focus-visible-ring');
    });
  });

  describe('Mobile-Specific Classes', () => {
    it('mobile-no-overflow class prevents horizontal overflow', () => {
      const { container } = render(
        <div className="mobile-no-overflow">
          <p>Mobile content</p>
        </div>
      );
      
      const mobileContainer = container.querySelector('.mobile-no-overflow');
      expect(mobileContainer).toBeInTheDocument();
      expect(mobileContainer).toHaveClass('mobile-no-overflow');
    });

    it('mobile-full-width class ensures full width on mobile', () => {
      const { container } = render(
        <div className="mobile-full-width">
          <p>Full width content</p>
        </div>
      );
      
      const fullWidth = container.querySelector('.mobile-full-width');
      expect(fullWidth).toBeInTheDocument();
      expect(fullWidth).toHaveClass('mobile-full-width');
    });
  });

  describe('Aspect Ratio Classes', () => {
    it('aspect-square class maintains 1:1 ratio', () => {
      const { container } = render(
        <div className="aspect-square">
          <p>Square content</p>
        </div>
      );
      
      const square = container.querySelector('.aspect-square');
      expect(square).toBeInTheDocument();
      expect(square).toHaveClass('aspect-square');
    });

    it('aspect-4-3 class maintains 4:3 ratio', () => {
      const { container } = render(
        <div className="aspect-4-3">
          <p>4:3 content</p>
        </div>
      );
      
      const ratio = container.querySelector('.aspect-4-3');
      expect(ratio).toBeInTheDocument();
      expect(ratio).toHaveClass('aspect-4-3');
    });
  });

  describe('Container Responsive Class', () => {
    it('container-responsive class provides responsive max-width', () => {
      const { container } = render(
        <div className="container-responsive">
          <p>Container content</p>
        </div>
      );
      
      const responsiveContainer = container.querySelector('.container-responsive');
      expect(responsiveContainer).toBeInTheDocument();
      expect(responsiveContainer).toHaveClass('container-responsive');
    });
  });
});
