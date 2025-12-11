/**
 * Basic Deep Linking Tests
 * 
 * Simple tests to verify core deep linking functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isSafeUrl, createCurrentPageBookmark, createCurrentPageShareUrl } from './deep-linking';

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://sophiaprep.com',
    pathname: '/subjects/mathematics',
    search: '?mode=practice',
    hash: '#section1'
  },
  writable: true
});

// Mock route config
vi.mock('../config/routes', () => ({
  getRouteConfig: vi.fn(() => ({
    path: '/subjects/:slug',
    title: 'Mathematics - Sophia Prep',
    description: 'Mathematics subject page'
  }))
}));

describe('Basic Deep Linking Functionality', () => {
  describe('URL Safety Validation', () => {
    it('should validate safe internal URLs', () => {
      expect(isSafeUrl('/subjects/mathematics')).toBe(true);
      expect(isSafeUrl('/quiz/unified')).toBe(true);
      expect(isSafeUrl('/')).toBe(true);
    });

    it('should validate safe external URLs', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
      expect(isSafeUrl('https://google.com/search')).toBe(true);
    });

    it('should reject unsafe URLs', () => {
      expect(isSafeUrl('javascript:alert("xss")')).toBe(false);
      expect(isSafeUrl('data:text/html,<script>alert("xss")</script>')).toBe(false);
    });

    it('should handle malformed URLs', () => {
      expect(isSafeUrl('not-a-url')).toBe(false);
      expect(isSafeUrl(':::invalid:::')).toBe(false);
    });
  });

  describe('Bookmark Creation', () => {
    it('should create bookmark for current page', () => {
      const bookmark = createCurrentPageBookmark();
      
      expect(bookmark.url).toBe('/subjects/mathematics?mode=practice#section1');
      expect(bookmark.title).toBeTruthy();
      expect(bookmark.timestamp).toBeTypeOf('number');
      expect(bookmark.isValid).toBe(true);
    });

    it('should use custom title and description', () => {
      const bookmark = createCurrentPageBookmark('Custom Title', 'Custom Description');
      
      expect(bookmark.title).toBe('Custom Title');
      expect(bookmark.description).toBe('Custom Description');
    });
  });

  describe('Share URL Creation', () => {
    it('should create share URL for current page', () => {
      const shareData = createCurrentPageShareUrl();
      
      expect(shareData.url).toBe('/subjects/mathematics?mode=practice');
      expect(shareData.title).toBeTruthy();
    });

    it('should include hash when configured', () => {
      const shareData = createCurrentPageShareUrl({ includeHash: true });
      
      expect(shareData.url).toBe('/subjects/mathematics?mode=practice#section1');
    });

    it('should exclude query params when configured', () => {
      const shareData = createCurrentPageShareUrl({ includeQueryParams: false });
      
      expect(shareData.url).toBe('/subjects/mathematics');
    });
  });
});