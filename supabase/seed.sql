-- ============================================================================
-- SOPHIA PREP - SEED DATA
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-01-21
-- Description: Initial seed data for Sophia Prep platform
-- 
-- INSTRUCTIONS:
-- 1. Run schema.sql FIRST
-- 2. Then run this file to populate initial data
-- ============================================================================

-- ============================================================================
-- SEED SUBJECTS (JAMB Subjects)
-- ============================================================================

INSERT INTO subjects (name, slug, description, exam_type, subject_category, is_mandatory, sort_order) VALUES
-- Mandatory Subjects
('English Language', 'english', 'English Language for JAMB', 'JAMB', 'LANGUAGE', true, 1),
('Mathematics', 'mathematics', 'Mathematics for JAMB', 'JAMB', 'GENERAL', true, 2),

-- Science Subjects
('Physics', 'physics', 'Physics for JAMB', 'JAMB', 'SCIENCE', false, 3),
('Chemistry', 'chemistry', 'Chemistry for JAMB', 'JAMB', 'SCIENCE', false, 4),
('Biology', 'biology', 'Biology for JAMB', 'JAMB', 'SCIENCE', false, 5),
('Agricultural Science', 'agricultural-science', 'Agricultural Science for JAMB', 'JAMB', 'SCIENCE', false, 6),

-- Commercial Subjects
('Economics', 'economics', 'Economics for JAMB', 'JAMB', 'COMMERCIAL', false, 7),
('Commerce', 'commerce', 'Commerce for JAMB', 'JAMB', 'COMMERCIAL', false, 8),
('Accounting', 'accounting', 'Accounting for JAMB', 'JAMB', 'COMMERCIAL', false, 9),

-- Arts Subjects
('Literature in English', 'literature', 'Literature in English for JAMB', 'JAMB', 'ARTS', false, 10),
('Government', 'government', 'Government for JAMB', 'JAMB', 'ARTS', false, 11),
('Christian Religious Studies', 'crs', 'Christian Religious Studies for JAMB', 'JAMB', 'ARTS', false, 12),
('Islamic Religious Studies', 'irs', 'Islamic Religious Studies for JAMB', 'JAMB', 'ARTS', false, 13),
('Geography', 'geography', 'Geography for JAMB and WAEC', 'BOTH', 'ARTS', false, 16),

-- Language Subjects
('French', 'french', 'French Language for WAEC', 'WAEC', 'LANGUAGE', false, 17),
('Yoruba', 'yoruba', 'Yoruba Language for WAEC', 'WAEC', 'LANGUAGE', false, 18),
('Igbo', 'igbo', 'Igbo Language for WAEC', 'WAEC', 'LANGUAGE', false, 19),
('Hausa', 'hausa', 'Hausa Language for WAEC', 'WAEC', 'LANGUAGE', false, 20),

-- Other Subjects
('Civic Education', 'civic-education', 'Civic Education for JAMB and WAEC', 'BOTH', 'GENERAL', false, 21)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SEED SUBSCRIPTION PLANS
-- ============================================================================

INSERT INTO subscription_plans (name, slug, description, price_ngn, duration_days, features, included_subjects, exam_types, sort_order) VALUES
(
  'JAMB Only',
  'jamb-only',
  'Access to all JAMB subjects and practice materials',
  2500.00,
  90,
  ARRAY['Unlimited practice quizzes', 'Mock exams', 'Past questions (2015-2024)', 'Progress tracking', 'Performance analytics'],
  ARRAY['english', 'mathematics', 'physics', 'chemistry', 'biology', 'economics', 'commerce', 'accounting', 'literature', 'government', 'history', 'crs', 'irs', 'geography', 'civic-education'],
  ARRAY['JAMB'],
  1
),
(
  'WAEC Only',
  'waec-only',
  'Access to all WAEC subjects and practice materials',
  3000.00,
  120,
  ARRAY['Unlimited practice quizzes', 'Mock exams', 'Past questions (2015-2024)', 'Progress tracking', 'Performance analytics', 'Study materials'],
  ARRAY['english', 'mathematics', 'physics', 'chemistry', 'biology', 'agricultural-science', 'economics', 'commerce', 'accounting', 'business-studies', 'literature', 'government', 'history', 'crs', 'irs', 'geography', 'french', 'yoruba', 'igbo', 'hausa', 'civic-education'],
  ARRAY['WAEC'],
  2
),
(
  'Science Bundle',
  'science-bundle',
  'JAMB + WAEC for Science students',
  4500.00,
  120,
  ARRAY['All JAMB features', 'All WAEC features', 'Science subjects focus', 'Video lessons', 'Syllabus access'],
  ARRAY['english', 'mathematics', 'physics', 'chemistry', 'biology', 'agricultural-science'],
  ARRAY['JAMB', 'WAEC'],
  3
),
(
  'Commercial Bundle',
  'commercial-bundle',
  'JAMB + WAEC for Commercial students',
  4500.00,
  120,
  ARRAY['All JAMB features', 'All WAEC features', 'Commercial subjects focus', 'Video lessons', 'Syllabus access'],
  ARRAY['english', 'mathematics', 'economics', 'commerce', 'accounting', 'business-studies'],
  ARRAY['JAMB', 'WAEC'],
  4
),
(
  'Arts Bundle',
  'arts-bundle',
  'JAMB + WAEC for Arts students',
  4500.00,
  120,
  ARRAY['All JAMB features', 'All WAEC features', 'Arts subjects focus', 'Video lessons', 'Syllabus access'],
  ARRAY['english', 'mathematics', 'literature', 'government', 'history', 'crs', 'irs', 'geography', 'civic-education'],
  ARRAY['JAMB', 'WAEC'],
  5
),
(
  'Full Access',
  'full-access',
  'Complete access to all subjects and features',
  6000.00,
  180,
  ARRAY['All subjects (21)', 'Unlimited practice', 'All mock exams', 'All past questions', 'Video lessons', 'Study materials', 'Priority support', 'Leaderboard access', 'Performance analytics'],
  ARRAY['english', 'mathematics', 'physics', 'chemistry', 'biology', 'agricultural-science', 'economics', 'commerce', 'accounting', 'business-studies', 'literature', 'government', 'history', 'crs', 'irs', 'geography', 'french', 'yoruba', 'igbo', 'hausa', 'civic-education'],
  ARRAY['JAMB', 'WAEC'],
  6
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SEED SAMPLE COUPON CODES
-- ============================================================================

INSERT INTO coupon_codes (code, description, discount_type, discount_value, max_uses, valid_from, valid_until) VALUES
('WELCOME2025', 'Welcome discount for new users', 'PERCENTAGE', 20.00, 1000, NOW(), NOW() + INTERVAL '30 days'),
('EARLYBIRD', 'Early bird special', 'PERCENTAGE', 15.00, 500, NOW(), NOW() + INTERVAL '14 days'),
('STUDENT50', 'Student discount', 'FIXED_AMOUNT', 500.00, NULL, NOW(), NOW() + INTERVAL '90 days')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify seed data was inserted correctly

-- Check subjects count (should be 21)
-- SELECT COUNT(*) as subject_count FROM subjects;

-- Check subscription plans count (should be 6)
-- SELECT COUNT(*) as plan_count FROM subscription_plans;

-- Check coupon codes count (should be 3)
-- SELECT COUNT(*) as coupon_count FROM coupon_codes;

-- List all subjects
-- SELECT name, slug, exam_type, subject_category FROM subjects ORDER BY sort_order;

-- List all subscription plans
-- SELECT name, slug, price_ngn, duration_days FROM subscription_plans ORDER BY sort_order;

