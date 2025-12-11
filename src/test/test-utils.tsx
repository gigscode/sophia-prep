import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { UnifiedNavigationProvider } from '../components/navigation/UnifiedNavigationProvider';
import { AuthProvider } from '../hooks/useAuth';
import { EnhancedAuthProvider } from '../components/auth/EnhancedAuthProvider';

// Mock sessionStorage for tests
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialPath?: string;
  enableDebugMode?: boolean;
}

function AllTheProviders({ 
  children, 
  initialPath = '/',
  enableDebugMode = false 
}: { 
  children: React.ReactNode;
  initialPath?: string;
  enableDebugMode?: boolean;
}) {
  // Set initial path if provided
  if (initialPath !== '/') {
    window.history.pushState({}, '', initialPath);
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <UnifiedNavigationProvider enableDebugMode={enableDebugMode}>
          <EnhancedAuthProvider>
            {children}
          </EnhancedAuthProvider>
        </UnifiedNavigationProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialPath, enableDebugMode, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: (props) => (
      <AllTheProviders 
        initialPath={initialPath}
        enableDebugMode={enableDebugMode}
        {...props}
      />
    ),
    ...renderOptions,
  });
};

export * from '@testing-library/react';
export { customRender as render };