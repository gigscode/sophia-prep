import React from 'react';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

/**
 * SkipLink Component
 * 
 * Provides a skip navigation link for keyboard users to bypass repetitive content.
 * The link is visually hidden until focused, improving accessibility for screen readers
 * and keyboard navigation.
 * 
 * Requirements: Accessibility compliance (WCAG 2.1)
 */
export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="skip-to-main"
      onClick={(e) => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          (target as HTMLElement).focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }}
    >
      {children}
    </a>
  );
}

/**
 * SkipLinks Component
 * 
 * Container for multiple skip links, typically placed at the beginning of the page.
 */
export function SkipLinks() {
  return (
    <>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#primary-navigation">Skip to navigation</SkipLink>
    </>
  );
}

export default SkipLink;