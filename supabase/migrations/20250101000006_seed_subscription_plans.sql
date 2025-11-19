-- Migration: Seed initial subscription plans
-- This migration inserts subscription plans for JAMB/WAEC exam preparation
-- Requirements: 7.1, 7.2

-- ============================================================================
-- SUBSCRIPTION PLANS SEEDING
-- ============================================================================

-- Insert subscription plans
INSERT INTO subscription_plans (
  plan_id,
  name,
  description,
  exam_type,
  bundle_type,
  included_subjects,
  amount,
  currency,
  interval,
  features,
  is_active,
  sort_order
) VALUES
  -- JAMB Only Plan
  (
    'jamb-only',
    'JAMB Only',
    'Access to all JAMB subjects and practice materials',
    'JAMB',
    'FULL_ACCESS',
    ARRAY[
      'english-language',
      'mathematics',
      'physics',
      'chemistry',
      'biology',
      'further-mathematics',
      'geography',
      'commerce',
      'accounting',
      'economics',
      'literature-in-english',
      'government',
      'crs-irs',
      'yoruba',
      'hausa',
      'igbo'
    ],
    5000.00,
    'NGN',
    'MONTHLY',
    ARRAY[
      'Access to all JAMB subjects',
      'Unlimited practice questions',
      'Mock exam simulations',
      'Past questions (2010-2024)',
      'Video lessons',
      'Study materials and syllabus',
      'Performance analytics',
      'Progress tracking'
    ],
    TRUE,
    1
  ),
  
  -- WAEC Only Plan
  (
    'waec-only',
    'WAEC Only',
    'Access to all WAEC subjects and practice materials',
    'WAEC',
    'FULL_ACCESS',
    ARRAY[
      'english-language',
      'mathematics',
      'physics',
      'chemistry',
      'biology',
      'further-mathematics',
      'geography',
      'food-nutrition',
      'commerce',
      'accounting',
      'economics',
      'marketing',
      'civic-education',
      'literature-in-english',
      'government',
      'crs-irs',
      'music',
      'history',
      'yoruba',
      'hausa',
      'igbo'
    ],
    5000.00,
    'NGN',
    'MONTHLY',
    ARRAY[
      'Access to all WAEC subjects',
      'Unlimited practice questions',
      'Mock exam simulations',
      'Past questions (2010-2024)',
      'Video lessons',
      'Study materials and syllabus',
      'Performance analytics',
      'Progress tracking'
    ],
    TRUE,
    2
  ),
  
  -- Science Bundle Plan
  (
    'science-bundle',
    'Science Bundle',
    'Complete package for Science students (JAMB & WAEC)',
    'BOTH',
    'SCIENCE_BUNDLE',
    ARRAY[
      'english-language',
      'mathematics',
      'physics',
      'chemistry',
      'biology',
      'further-mathematics',
      'geography',
      'food-nutrition'
    ],
    3500.00,
    'NGN',
    'MONTHLY',
    ARRAY[
      'All Science subjects',
      'English Language (mandatory)',
      'Mathematics',
      'Physics, Chemistry, Biology',
      'Further Mathematics',
      'Unlimited practice questions',
      'Mock exams',
      'Past questions',
      'Video lessons',
      'Performance analytics'
    ],
    TRUE,
    3
  ),
  
  -- Commercial Bundle Plan
  (
    'commercial-bundle',
    'Commercial Bundle',
    'Complete package for Commercial students (JAMB & WAEC)',
    'BOTH',
    'COMMERCIAL_BUNDLE',
    ARRAY[
      'english-language',
      'mathematics',
      'commerce',
      'accounting',
      'economics',
      'marketing',
      'geography'
    ],
    3500.00,
    'NGN',
    'MONTHLY',
    ARRAY[
      'All Commercial subjects',
      'English Language (mandatory)',
      'Mathematics',
      'Commerce, Accounting, Economics',
      'Marketing',
      'Unlimited practice questions',
      'Mock exams',
      'Past questions',
      'Video lessons',
      'Performance analytics'
    ],
    TRUE,
    4
  ),
  
  -- Arts Bundle Plan
  (
    'arts-bundle',
    'Arts Bundle',
    'Complete package for Arts students (JAMB & WAEC)',
    'BOTH',
    'ARTS_BUNDLE',
    ARRAY[
      'english-language',
      'literature-in-english',
      'government',
      'crs-irs',
      'music',
      'history',
      'geography',
      'yoruba',
      'hausa',
      'igbo'
    ],
    3500.00,
    'NGN',
    'MONTHLY',
    ARRAY[
      'All Arts subjects',
      'English Language (mandatory)',
      'Literature in English',
      'Government, CRS/IRS',
      'Music, History',
      'Nigerian Languages',
      'Unlimited practice questions',
      'Mock exams',
      'Past questions',
      'Video lessons',
      'Performance analytics'
    ],
    TRUE,
    5
  ),
  
  -- Full Access Plan
  (
    'full-access',
    'Full Access',
    'Unlimited access to all JAMB and WAEC subjects',
    'BOTH',
    'FULL_ACCESS',
    ARRAY[
      'english-language',
      'mathematics',
      'physics',
      'chemistry',
      'biology',
      'further-mathematics',
      'geography',
      'food-nutrition',
      'commerce',
      'accounting',
      'economics',
      'marketing',
      'civic-education',
      'literature-in-english',
      'government',
      'crs-irs',
      'music',
      'history',
      'yoruba',
      'hausa',
      'igbo'
    ],
    7500.00,
    'NGN',
    'MONTHLY',
    ARRAY[
      'Access to ALL subjects',
      'Both JAMB and WAEC',
      'All Science subjects',
      'All Commercial subjects',
      'All Arts subjects',
      'All Nigerian Languages',
      'Unlimited practice questions',
      'Mock exam simulations',
      'Past questions (2010-2024)',
      'Video lessons',
      'Study materials and syllabus',
      'Performance analytics',
      'Progress tracking',
      'Priority support'
    ],
    TRUE,
    6
  )
ON CONFLICT (plan_id) DO NOTHING;

-- Verify subscription plans were inserted
DO $
DECLARE
  v_plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_plan_count FROM subscription_plans;
  RAISE NOTICE 'Subscription plans seeded successfully. Total plans: %', v_plan_count;
END $;
