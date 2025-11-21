-- ============================================================================
-- SOPHIA PREP - FRESH DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-01-21
-- Description: Complete database schema for Sophia Prep JAMB/WAEC platform
-- 
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire file
-- 3. Execute
-- 4. Verify all tables are created
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. SUBJECTS TABLE
-- ============================================================================
-- Stores JAMB/WAEC exam subjects
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color_theme TEXT,
  exam_type TEXT CHECK (exam_type IN ('JAMB', 'WAEC', 'BOTH')) DEFAULT 'BOTH',
  subject_category TEXT CHECK (subject_category IN ('SCIENCE', 'COMMERCIAL', 'ARTS', 'GENERAL', 'LANGUAGE')) DEFAULT 'GENERAL',
  is_mandatory BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subjects_slug ON subjects(slug);
CREATE INDEX idx_subjects_exam_type ON subjects(exam_type);
CREATE INDEX idx_subjects_category ON subjects(subject_category);
CREATE INDEX idx_subjects_active ON subjects(is_active);

-- ============================================================================
-- 2. TOPICS TABLE
-- ============================================================================
-- Stores topics within each subject
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_topics_subject_id ON topics(subject_id);
CREATE INDEX idx_topics_active ON topics(is_active);
CREATE INDEX idx_topics_order ON topics(order_index);

-- ============================================================================
-- 3. QUESTIONS TABLE
-- ============================================================================
-- Stores quiz questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('EASY', 'MEDIUM', 'HARD')) DEFAULT 'MEDIUM',
  exam_year INTEGER,
  exam_type TEXT CHECK (exam_type IN ('JAMB', 'WAEC')),
  question_number INTEGER,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_topic_id ON questions(topic_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX idx_questions_exam_year ON questions(exam_year);
CREATE INDEX idx_questions_exam_type ON questions(exam_type);
CREATE INDEX idx_questions_active ON questions(is_active);

-- ============================================================================
-- 4. USER PROFILES TABLE
-- ============================================================================
-- Extended user information beyond auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT,
  exam_type TEXT CHECK (exam_type IN ('JAMB', 'WAEC', 'BOTH')),
  target_exam_date DATE,
  preferred_subjects TEXT[],
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_exam_type ON user_profiles(exam_type);
CREATE INDEX idx_user_profiles_target_date ON user_profiles(target_exam_date);

-- ============================================================================
-- 5. SUBJECT COMBINATIONS TABLE
-- ============================================================================
-- User's selected subject combinations
CREATE TABLE IF NOT EXISTS subject_combinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('JAMB', 'WAEC', 'BOTH')),
  combination_type TEXT CHECK (combination_type IN ('SCIENCE', 'COMMERCIAL', 'ARTS', 'CUSTOM')),
  subjects TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subject_combinations_user_id ON subject_combinations(user_id);
CREATE INDEX idx_subject_combinations_exam_type ON subject_combinations(exam_type);

-- ============================================================================
-- 6. QUIZ ATTEMPTS TABLE
-- ============================================================================
-- Stores all quiz completion data for analytics and progress tracking
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  quiz_mode TEXT NOT NULL CHECK (quiz_mode IN ('PRACTICE', 'MOCK_EXAM', 'READER', 'PAST_QUESTIONS')),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0),
  incorrect_answers INTEGER NOT NULL CHECK (incorrect_answers >= 0),
  score_percentage DECIMAL(5,2) NOT NULL CHECK (score_percentage >= 0 AND score_percentage <= 100),
  time_taken_seconds INTEGER NOT NULL CHECK (time_taken_seconds >= 0),
  exam_year INTEGER,
  questions_data JSONB DEFAULT '[]',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_subject_id ON quiz_attempts(subject_id);
CREATE INDEX idx_quiz_attempts_quiz_mode ON quiz_attempts(quiz_mode);
CREATE INDEX idx_quiz_attempts_completed_at ON quiz_attempts(completed_at);

-- ============================================================================
-- 7. STUDY MATERIALS TABLE
-- ============================================================================
-- Learning resources (syllabus, novels, videos)
CREATE TABLE IF NOT EXISTS study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT CHECK (material_type IN ('VIDEO', 'PDF', 'ARTICLE', 'SYLLABUS', 'NOVEL', 'LINK')) NOT NULL,
  content_url TEXT,
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  is_premium BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_materials_subject_id ON study_materials(subject_id);
CREATE INDEX idx_study_materials_type ON study_materials(material_type);
CREATE INDEX idx_study_materials_premium ON study_materials(is_premium);
CREATE INDEX idx_study_materials_active ON study_materials(is_active);

-- ============================================================================
-- 8. USER PROGRESS TABLE
-- ============================================================================
-- Tracks user progress on learning materials
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  is_completed BOOLEAN DEFAULT FALSE,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, material_id)
);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_material_id ON user_progress(material_id);
CREATE INDEX idx_user_progress_completed ON user_progress(is_completed);

-- ============================================================================
-- 9. NOTIFICATIONS TABLE
-- ============================================================================
-- User notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT CHECK (notification_type IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'REMINDER')) DEFAULT 'INFO',
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- 10. STUDY TARGETS TABLE
-- ============================================================================
-- Daily/weekly/monthly study goals
CREATE TABLE IF NOT EXISTS study_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT CHECK (target_type IN ('DAILY', 'WEEKLY', 'MONTHLY')) NOT NULL,
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  current_value INTEGER DEFAULT 0 CHECK (current_value >= 0),
  target_date DATE NOT NULL,
  is_achieved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_targets_user_id ON study_targets(user_id);
CREATE INDEX idx_study_targets_type ON study_targets(target_type);
CREATE INDEX idx_study_targets_date ON study_targets(target_date);
CREATE INDEX idx_study_targets_achieved ON study_targets(is_achieved);

-- ============================================================================
-- 11. MOCK EXAM SESSIONS TABLE
-- ============================================================================
-- Mock exam tracking
CREATE TABLE IF NOT EXISTS mock_exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT CHECK (exam_type IN ('JAMB', 'WAEC')) NOT NULL,
  subjects TEXT[] NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  time_limit_minutes INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  score_percentage DECIMAL(5,2),
  status TEXT CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')) DEFAULT 'IN_PROGRESS',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mock_exam_sessions_user_id ON mock_exam_sessions(user_id);
CREATE INDEX idx_mock_exam_sessions_exam_type ON mock_exam_sessions(exam_type);
CREATE INDEX idx_mock_exam_sessions_status ON mock_exam_sessions(status);

-- ============================================================================
-- 12. SUBSCRIPTION PLANS TABLE
-- ============================================================================
-- Available subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_ngn DECIMAL(10,2) NOT NULL CHECK (price_ngn >= 0),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  features TEXT[] DEFAULT '{}',
  included_subjects TEXT[] DEFAULT '{}',
  exam_types TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);

-- ============================================================================
-- 13. USER SUBSCRIPTIONS TABLE
-- ============================================================================
-- User subscription records
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING')) DEFAULT 'PENDING',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT FALSE,
  payment_reference TEXT,
  amount_paid DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_end_date ON user_subscriptions(end_date);

-- ============================================================================
-- 14. PAYMENTS TABLE
-- ============================================================================
-- Payment transaction records
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'NGN',
  payment_method TEXT CHECK (payment_method IN ('PAYSTACK', 'BANK_TRANSFER', 'CARD', 'OTHER')) DEFAULT 'PAYSTACK',
  payment_reference TEXT UNIQUE NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')) DEFAULT 'PENDING',
  payment_gateway_response JSONB DEFAULT '{}',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_reference ON payments(payment_reference);

-- ============================================================================
-- 15. COUPON CODES TABLE
-- ============================================================================
-- Discount coupon management
CREATE TABLE IF NOT EXISTS coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')) NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  applicable_plans TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupon_codes_code ON coupon_codes(code);
CREATE INDEX idx_coupon_codes_active ON coupon_codes(is_active);
CREATE INDEX idx_coupon_codes_valid_until ON coupon_codes(valid_until);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_materials_updated_at BEFORE UPDATE ON study_materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_targets_updated_at BEFORE UPDATE ON study_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupon_codes_updated_at BEFORE UPDATE ON coupon_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PUBLIC READ POLICIES (Content tables - everyone can read)
-- ============================================================================

-- Subjects: Public read
CREATE POLICY "Subjects are viewable by everyone"
  ON subjects FOR SELECT
  USING (is_active = true);

-- Topics: Public read
CREATE POLICY "Topics are viewable by everyone"
  ON topics FOR SELECT
  USING (is_active = true);

-- Questions: Public read (active questions only)
CREATE POLICY "Questions are viewable by everyone"
  ON questions FOR SELECT
  USING (is_active = true);

-- Study Materials: Public read for free content, authenticated for premium
CREATE POLICY "Free study materials are viewable by everyone"
  ON study_materials FOR SELECT
  USING (is_active = true AND is_premium = false);

CREATE POLICY "Premium study materials are viewable by authenticated users"
  ON study_materials FOR SELECT
  USING (
    is_active = true
    AND is_premium = true
    AND auth.uid() IS NOT NULL
  );

-- Subscription Plans: Public read
CREATE POLICY "Subscription plans are viewable by everyone"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- USER-SPECIFIC POLICIES (Users can only access their own data)
-- ============================================================================

-- User Profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Subject Combinations
CREATE POLICY "Users can view their own subject combinations"
  ON subject_combinations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subject combinations"
  ON subject_combinations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subject combinations"
  ON subject_combinations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subject combinations"
  ON subject_combinations FOR DELETE
  USING (auth.uid() = user_id);

-- Quiz Attempts
CREATE POLICY "Users can view their own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User Progress
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Study Targets
CREATE POLICY "Users can view their own study targets"
  ON study_targets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study targets"
  ON study_targets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study targets"
  ON study_targets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study targets"
  ON study_targets FOR DELETE
  USING (auth.uid() = user_id);

-- Mock Exam Sessions
CREATE POLICY "Users can view their own mock exam sessions"
  ON mock_exam_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mock exam sessions"
  ON mock_exam_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mock exam sessions"
  ON mock_exam_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- User Subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Payments
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Coupon Codes: Read-only for authenticated users
CREATE POLICY "Authenticated users can view active coupon codes"
  ON coupon_codes FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = user_uuid
      AND status = 'ACTIVE'
      AND end_date > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible subjects based on subscription
CREATE OR REPLACE FUNCTION get_user_accessible_subjects(user_uuid UUID)
RETURNS TEXT[] AS $$
DECLARE
  subject_list TEXT[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT unnest_subjects)
  INTO subject_list
  FROM (
    SELECT unnest(sp.included_subjects) as unnest_subjects
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = user_uuid
      AND us.status = 'ACTIVE'
      AND us.end_date > NOW()
  ) subquery;

  RETURN COALESCE(subject_list, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate coupon code
CREATE OR REPLACE FUNCTION validate_coupon_code(coupon_code_text TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_type TEXT,
  discount_value DECIMAL,
  message TEXT
) AS $$
DECLARE
  coupon RECORD;
BEGIN
  SELECT * INTO coupon
  FROM coupon_codes
  WHERE code = coupon_code_text
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::DECIMAL, 'Invalid coupon code';
    RETURN;
  END IF;

  IF coupon.valid_until IS NOT NULL AND coupon.valid_until < NOW() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::DECIMAL, 'Coupon code has expired';
    RETURN;
  END IF;

  IF coupon.max_uses IS NOT NULL AND coupon.current_uses >= coupon.max_uses THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::DECIMAL, 'Coupon code usage limit reached';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, coupon.discount_type, coupon.discount_value, 'Valid coupon code';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- User Performance Summary View
CREATE OR REPLACE VIEW user_performance_summary AS
SELECT
  qa.user_id,
  COUNT(*) as total_attempts,
  AVG(qa.score_percentage) as average_score,
  MAX(qa.score_percentage) as best_score,
  MIN(qa.score_percentage) as worst_score,
  SUM(qa.total_questions) as total_questions_attempted,
  SUM(qa.correct_answers) as total_correct_answers,
  AVG(qa.time_taken_seconds) as average_time_seconds
FROM quiz_attempts qa
GROUP BY qa.user_id;

-- Subject Performance View
CREATE OR REPLACE VIEW subject_performance AS
SELECT
  qa.user_id,
  s.name as subject_name,
  s.slug as subject_slug,
  COUNT(*) as attempts,
  AVG(qa.score_percentage) as average_score,
  MAX(qa.score_percentage) as best_score
FROM quiz_attempts qa
JOIN subjects s ON qa.subject_id = s.id
GROUP BY qa.user_id, s.id, s.name, s.slug;

-- Active Subscriptions View
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT
  us.user_id,
  us.id as subscription_id,
  sp.name as plan_name,
  sp.slug as plan_slug,
  us.start_date,
  us.end_date,
  sp.included_subjects,
  sp.exam_types
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.status = 'ACTIVE'
  AND us.end_date > NOW();

-- ============================================================================
-- INITIAL SETUP COMPLETE
-- ============================================================================
--
-- Next Steps:
-- 1. Run seed scripts to populate subjects and subscription plans
-- 2. Import questions from JSON files
-- 3. Test RLS policies
-- 4. Set up Supabase Auth
--
-- ============================================================================

