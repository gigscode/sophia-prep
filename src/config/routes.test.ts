/**
 * Route Configuration Tests
 * 
 * Tests for the centralized route configuration system
 */

import { describe, it, expect } from 'vitest';
import { 
  routeConfigs, 
  getRouteConfig, 
  routeRequiresAuth, 
  routeRequiresAdmin,
  getPublicRoutes,
  getProtectedRoutes,
  getAdminRoutes
} from './routes';

describe('Route Configuration', () => {
  it('should have all required routes defined', () => {
    const expectedPaths = [
      '/',
      '/practice',
      '/jamb-exam',
      '/quiz',
      '/profile',
      '/login',
      '/7351/admin'
    ];

    expectedPaths.forEach(path => {
      const config = routeConfigs.find(c => c.path === path);
      expect(config).toBeDefined();
    });
  });

  it('should correctly identify route authentication requirements', () => {
    expect(routeRequiresAuth('/')).toBe(false);
    expect(routeRequiresAuth('/practice')).toBe(false);
    expect(routeRequiresAuth('/profile')).toBe(true);
    expect(routeRequiresAuth('/7351/admin')).toBe(true);
  });

  it('should correctly identify admin route requirements', () => {
    expect(routeRequiresAdmin('/')).toBe(false);
    expect(routeRequiresAdmin('/profile')).toBe(false);
    expect(routeRequiresAdmin('/7351/admin')).toBe(true);
    expect(routeRequiresAdmin('/7351/admin/import-questions')).toBe(true);
  });

  it('should extract route parameters correctly', () => {
    // Test with a route that has parameters (e.g., admin import questions)
    const config = getRouteConfig('/7351/admin/import-questions');
    expect(config).toBeDefined();
  });

  it('should categorize routes correctly', () => {
    const publicRoutes = getPublicRoutes();
    const protectedRoutes = getProtectedRoutes();
    const adminRoutes = getAdminRoutes();

    expect(publicRoutes.length).toBeGreaterThan(0);
    expect(protectedRoutes.length).toBeGreaterThan(0);
    expect(adminRoutes.length).toBeGreaterThan(0);

    // Check that home page is public
    expect(publicRoutes.some(r => r.path === '/')).toBe(true);
    
    // Check that profile is protected
    expect(protectedRoutes.some(r => r.path === '/profile')).toBe(true);
    
    // Check that admin is admin-only
    expect(adminRoutes.some(r => r.path === '/7351/admin')).toBe(true);
  });

  it('should have valid component references', () => {
    routeConfigs.forEach(config => {
      expect(config.component).toBeDefined();
      // Lazy components are objects with $$typeof property
      expect(typeof config.component === 'function' || typeof config.component === 'object').toBe(true);
    });
  });

  it('should have routes with proper configuration', () => {
    // Verify that routes have proper configuration
    const practiceConfig = getRouteConfig('/practice');
    expect(practiceConfig).toBeDefined();
    expect(practiceConfig?.requireAuth).toBe(false);
  });
});