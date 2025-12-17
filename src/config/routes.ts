/**
 * Route Configuration System
 * 
 * Centralizes route definitions with authentication requirements,
 * parameter validation, and preloading configuration.
 */

import { ComponentType, lazy } from 'react';
import { RouteParamConfig, validateSlug } from '../utils/route-validation';

/**
 * Route configuration interface
 */
export interface RouteConfig {
  path: string;
  component: ComponentType<any>;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallbackPath?: string;
  paramValidation?: RouteParamConfig[];
  preloadData?: () => Promise<any>;
  showFooter?: boolean;
  title?: string;
  description?: string;
}

/**
 * Lazy load all page components with proper error handling
 */
const HomePage = lazy(() => import('../pages/HomePage').then(module => ({ default: module.HomePage })));
const StudyHub = lazy(() => import('../pages/StudyHub').then(module => ({ default: module.StudyHub })));
const SyllabusPage = lazy(() => import('../pages/SyllabusPage').then(module => ({ default: module.SyllabusPage })));
const SummariesPage = lazy(() => import('../pages/SummariesPage').then(module => ({ default: module.SummariesPage })));
const NovelsPage = lazy(() => import('../pages/NovelsPage').then(module => ({ default: module.NovelsPage })));
const VideosPage = lazy(() => import('../pages/VideosPage').then(module => ({ default: module.VideosPage })));

const PracticeModePage = lazy(() => import('../pages/PracticeModePage').then(module => ({ default: module.PracticeModePage })));
const JAMBExamPage = lazy(() => import('../pages/JAMBExamPage').then(module => ({ default: module.JAMBExamPage })));
const QuizResultsPage = lazy(() => import('../pages/QuizResultsPage').then(module => ({ default: module.QuizResultsPage })));
const HelpCenter = lazy(() => import('../pages/HelpCenter').then(module => ({ default: module.HelpCenter })));
const AboutPage = lazy(() => import('../pages/AboutPage').then(module => ({ default: module.AboutPage })));
const PrivacyPolicyPage = lazy(() => import('../pages/PrivacyPolicyPage').then(module => ({ default: module.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('../pages/TermsOfServicePage').then(module => ({ default: module.TermsOfServicePage })));
const ContactPage = lazy(() => import('../pages/ContactPage').then(module => ({ default: module.ContactPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then(module => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('../pages/SignupPage').then(module => ({ default: module.SignupPage })));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage })));
const AdminPage = lazy(() => import('../pages/AdminPage').then(module => ({ default: module.AdminPage })));
const ImportQuestionsPage = lazy(() => import('../pages/ImportQuestionsPage').then(module => ({ default: module.ImportQuestionsPage })));
const MorePage = lazy(() => import('../pages/MorePage').then(module => ({ default: module.MorePage })));
const TopicsPage = lazy(() => import('../pages/TopicsPage').then(module => ({ default: module.TopicsPage })));
const StudyMaterialsPage = lazy(() => import('../components/pdfs/StudyMaterialsPage').then(module => ({ default: module.StudyMaterialsPage })));


/**
 * Centralized route configuration
 * Defines all application routes with their requirements and validation
 */
export const routeConfigs: RouteConfig[] = [
  // Home
  {
    path: '/',
    component: HomePage,
    requireAuth: false,
    showFooter: true,
    title: 'Home - Sophia Prep',
    description: 'Your comprehensive exam preparation platform'
  },

  // Study Resources
  {
    path: '/study',
    component: StudyHub,
    requireAuth: false,
    showFooter: false,
    title: 'Study Hub - Sophia Prep',
    description: 'Access study materials and resources'
  },
  {
    path: '/syllabus',
    component: SyllabusPage,
    requireAuth: false,
    showFooter: true,
    title: 'Syllabus - Sophia Prep',
    description: 'View exam syllabi and curriculum'
  },
  {
    path: '/summaries',
    component: SummariesPage,
    requireAuth: false,
    showFooter: true,
    title: 'Summaries - Sophia Prep',
    description: 'Quick study summaries and notes'
  },
  {
    path: '/novels',
    component: NovelsPage,
    requireAuth: false,
    showFooter: true,
    title: 'Novels - Sophia Prep',
    description: 'Literature and novel study guides'
  },
  {
    path: '/videos',
    component: VideosPage,
    requireAuth: false,
    showFooter: true,
    title: 'Videos - Sophia Prep',
    description: 'Educational video content'
  },
  {
    path: '/study-materials',
    component: StudyMaterialsPage,
    requireAuth: false,
    showFooter: true,
    title: 'Study Materials - Sophia Prep',
    description: 'Access study materials and syllabus files'
  },

  // Practice Mode
  {
    path: '/practice',
    component: PracticeModePage,
    requireAuth: false,
    showFooter: false,
    title: 'Practice Mode - Sophia Prep',
    description: 'Practice questions by subject and topic'
  },

  // JAMB CBT Exam
  {
    path: '/jamb-exam',
    component: JAMBExamPage,
    requireAuth: false,
    showFooter: false,
    title: 'JAMB CBT Exam - Sophia Prep',
    description: 'Take JAMB CBT exam simulation with real exam conditions'
  },

  // Quiz Routes
  {
    path: '/quiz/results',
    component: QuizResultsPage,
    requireAuth: false,
    showFooter: false,
    title: 'Quiz Results - Sophia Prep',
    description: 'View your quiz results and performance'
  },

  // Help & Info
  {
    path: '/help',
    component: HelpCenter,
    requireAuth: false,
    showFooter: true,
    title: 'Help Center - Sophia Prep',
    description: 'Get help and support'
  },
  {
    path: '/about',
    component: AboutPage,
    requireAuth: false,
    showFooter: true,
    title: 'About - Sophia Prep',
    description: 'Learn more about Sophia Prep'
  },
  {
    path: '/privacy',
    component: PrivacyPolicyPage,
    requireAuth: false,
    showFooter: true,
    title: 'Privacy Policy - Sophia Prep',
    description: 'Our privacy policy and data handling practices'
  },
  {
    path: '/terms',
    component: TermsOfServicePage,
    requireAuth: false,
    showFooter: true,
    title: 'Terms of Service - Sophia Prep',
    description: 'Terms and conditions of use'
  },
  {
    path: '/contact',
    component: ContactPage,
    requireAuth: false,
    showFooter: true,
    title: 'Contact - Sophia Prep',
    description: 'Get in touch with us'
  },

  // More Page
  {
    path: '/more',
    component: MorePage,
    requireAuth: false,
    showFooter: true,
    title: 'More - Sophia Prep',
    description: 'Additional features and options'
  },

  // Topics Page
  {
    path: '/topics/:subjectSlug',
    component: TopicsPage,
    requireAuth: false,
    showFooter: false,
    title: 'Topics - Sophia Prep',
    description: 'Browse topics by subject'
  },

  // Profile / Auth (some require authentication)
  {
    path: '/profile',
    component: ProfilePage,
    requireAuth: true,
    showFooter: false,
    title: 'Profile - Sophia Prep',
    description: 'Manage your profile and preferences'
  },
  {
    path: '/login',
    component: LoginPage,
    requireAuth: false,
    showFooter: false,
    title: 'Login - Sophia Prep',
    description: 'Sign in to your account'
  },
  {
    path: '/signup',
    component: SignupPage,
    requireAuth: false,
    showFooter: false,
    title: 'Sign Up - Sophia Prep',
    description: 'Create a new account'
  },
  {
    path: '/forgot-password',
    component: ForgotPasswordPage,
    requireAuth: false,
    showFooter: false,
    title: 'Forgot Password - Sophia Prep',
    description: 'Reset your password'
  },
  {
    path: '/reset-password',
    component: ResetPasswordPage,
    requireAuth: false,
    showFooter: false,
    title: 'Reset Password - Sophia Prep',
    description: 'Set a new password'
  },

  // Admin Routes (require admin privileges)
  {
    path: '/7351/admin',
    component: AdminPage,
    requireAuth: true,
    requireAdmin: true,
    showFooter: false,
    title: 'Admin Dashboard - Sophia Prep',
    description: 'Administrative dashboard and controls'
  },
  {
    path: '/7351/admin/import-questions',
    component: ImportQuestionsPage,
    requireAuth: true,
    requireAdmin: true,
    showFooter: false,
    title: 'Import Questions - Sophia Prep',
    description: 'Import and manage quiz questions'
  }
];

/**
 * Get route configuration by path
 */
export const getRouteConfig = (path: string): RouteConfig | undefined => {
  // First try exact match
  const exactMatch = routeConfigs.find(config => config.path === path);
  if (exactMatch) return exactMatch;

  // Then try pattern matching for dynamic routes
  return routeConfigs.find(config => {
    if (!config.path.includes(':')) return false;
    
    const configParts = config.path.split('/');
    const pathParts = path.split('/');
    
    if (configParts.length !== pathParts.length) return false;
    
    return configParts.every((part, index) => {
      return part.startsWith(':') || part === pathParts[index];
    });
  });
};

/**
 * Extract parameters from a path based on route configuration
 */
export const extractRouteParams = (path: string, routeConfig: RouteConfig): Record<string, string> => {
  const params: Record<string, string> = {};
  
  if (!routeConfig.path.includes(':')) return params;
  
  const configParts = routeConfig.path.split('/');
  const pathParts = path.split('/');
  
  configParts.forEach((part, index) => {
    if (part.startsWith(':') && pathParts[index]) {
      const paramName = part.substring(1);
      params[paramName] = pathParts[index];
    }
  });
  
  return params;
};

/**
 * Check if a route requires authentication
 */
export const routeRequiresAuth = (path: string): boolean => {
  const config = getRouteConfig(path);
  return config?.requireAuth === true;
};

/**
 * Check if a route requires admin privileges
 */
export const routeRequiresAdmin = (path: string): boolean => {
  const config = getRouteConfig(path);
  return config?.requireAdmin === true;
};

/**
 * Get all public routes (no authentication required)
 */
export const getPublicRoutes = (): RouteConfig[] => {
  return routeConfigs.filter(config => !config.requireAuth);
};

/**
 * Get all protected routes (authentication required)
 */
export const getProtectedRoutes = (): RouteConfig[] => {
  return routeConfigs.filter(config => config.requireAuth);
};

/**
 * Get all admin routes (admin privileges required)
 */
export const getAdminRoutes = (): RouteConfig[] => {
  return routeConfigs.filter(config => config.requireAdmin);
};