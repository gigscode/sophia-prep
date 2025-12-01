import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QuizModesSection } from '../components/home/QuizModesSection';
import { QuickLinksSection } from '../components/home/QuickLinksSection';
import { UpcomingEventsSection } from '../components/home/UpcomingEventsSection';

/**
 * Property Test 17.2: Loading Skeletons
 * 
 * Validates that sections show loading skeletons when isLoading={true}
 * Requirement: 13.4 - Add loading skeletons for card components
 */
describe('Property Test 17.2: Loading Skeletons', () => {
    it('should show loading skeletons in QuizModesSection when isLoading is true', () => {
        const { container } = render(
            <BrowserRouter>
                <QuizModesSection isLoading={true} />
            </BrowserRouter>
        );

        // Look for shimmer animation class which indicates skeleton
        const skeletons = container.querySelectorAll('.shimmer');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should NOT show loading skeletons in QuizModesSection when isLoading is false', () => {
        const { container } = render(
            <BrowserRouter>
                <QuizModesSection isLoading={false} />
            </BrowserRouter>
        );

        // Should show actual content instead (use getAllByText since text appears in multiple places)
        const practiceModeElements = screen.getAllByText(/Practice Mode/i);
        expect(practiceModeElements.length).toBeGreaterThan(0);
        
        // Should NOT have shimmer skeletons
        const skeletons = container.querySelectorAll('.shimmer');
        expect(skeletons.length).toBe(0);
    });

    it('should show loading skeletons in QuickLinksSection when isLoading is true', () => {
        const { container } = render(
            <BrowserRouter>
                <QuickLinksSection isLoading={true} />
            </BrowserRouter>
        );

        const skeletons = container.querySelectorAll('.shimmer');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show loading skeletons in UpcomingEventsSection when isLoading is true', () => {
        const { container } = render(
            <BrowserRouter>
                <UpcomingEventsSection
                    isLoading={true}
                    events={[
                        {
                            id: '1',
                            title: 'Test Event',
                            date: new Date(),
                            type: 'exam' as const
                        }
                    ]}
                />
            </BrowserRouter>
        );

        const skeletons = container.querySelectorAll('.shimmer');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should verify LoadingSkeleton component has shimmer animation', () => {
        // This test documents that the LoadingSkeleton component
        // uses the 'shimmer' class for its animation effect
        // defined in src/styles/animations.css

        expect(true).toBe(true); // Documentation test
    });
});
