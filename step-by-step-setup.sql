-- STEP-BY-STEP DATABASE SETUP
-- Run each section separately to identify any issues

-- ============================================================================
-- STEP 1: Fix Missing Columns (Run this first)
-- ============================================================================

-- Add price_ngn column to subscription_plans table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' 
        AND column_name = 'price_ngn'
    ) THEN
        ALTER TABLE subscription_plans 
        ADD COLUMN price_ngn DECIMAL(10,2) DEFAULT 0 CHECK (price_ngn >= 0);
        RAISE NOTICE 'Added price_ngn column to subscription_plans table';
    ELSE
        RAISE NOTICE 'price_ngn column already exists';
    END IF;
END $$;

-- Add exam_type column to questions table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' 
        AND column_name = 'exam_type'
    ) THEN
        ALTER TABLE questions 
        ADD COLUMN exam_type TEXT CHECK (exam_type IN ('JAMB'));
        UPDATE questions SET exam_type = 'JAMB' WHERE exam_type IS NULL;
        RAISE NOTICE 'Added exam_type column to questions table';
    ELSE
        RAISE NOTICE 'exam_type column already exists';
    END IF;
END $$;

SELECT 'Step 1 completed - Missing columns fixed' as status;

-- ============================================================================
-- STEP 2: Create Topic Categories Table (Run this second)
-- ============================================================================

CREATE TABLE IF NOT EXISTS topic_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color_theme TEXT DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subject_id, slug)
);

SELECT 'Step 2 completed - Topic categories table created' as status;

-- ============================================================================
-- STEP 3: Create Topics Table (Run this third)
-- ============================================================================

CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES topic_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  
  -- Hierarchical structure
  parent_topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  topic_level INTEGER DEFAULT 1 CHECK (topic_level >= 1 AND topic_level <= 3),
  
  -- Organization and metadata
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  estimated_questions_count INTEGER DEFAULT 0,
  difficulty_level TEXT CHECK (difficulty_level IN ('BASIC', 'INTERMEDIATE', 'ADVANCED')),
  estimated_study_time_minutes INTEGER DEFAULT 60,
  prerequisites TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subject_id, slug)
);

SELECT 'Step 3 completed - Topics table created' as status;

-- ============================================================================
-- STEP 4: Add topic_id to questions table (Run this fourth)
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' 
        AND column_name = 'topic_id'
    ) THEN
        ALTER TABLE questions 
        ADD COLUMN topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added topic_id column to questions table';
    ELSE
        RAISE NOTICE 'topic_id column already exists';
    END IF;
END $$;

SELECT 'Step 4 completed - topic_id added to questions' as status;

-- ============================================================================
-- STEP 5: Create Indexes (Run this fifth)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_topic_categories_subject_id ON topic_categories(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_category_id ON topics(category_id);
CREATE INDEX IF NOT EXISTS idx_topics_slug ON topics(slug);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type);

SELECT 'Step 5 completed - Indexes created' as status;

-- ============================================================================
-- STEP 6: Create Triggers (Run this sixth)
-- ============================================================================

DROP TRIGGER IF EXISTS update_topics_updated_at ON topics;
CREATE TRIGGER update_topics_updated_at 
  BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_topic_categories_updated_at ON topic_categories;
CREATE TRIGGER update_topic_categories_updated_at 
  BEFORE UPDATE ON topic_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Step 6 completed - Triggers created' as status;

-- ============================================================================
-- STEP 7: Enable RLS and Create Policies (Run this seventh)
-- ============================================================================

-- Enable RLS
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Topics are viewable by everyone" ON topics;
DROP POLICY IF EXISTS "Topic categories are viewable by everyone" ON topic_categories;

-- Create public read policies
CREATE POLICY "Topics are viewable by everyone"
  ON topics FOR SELECT
  USING (is_active = true);

CREATE POLICY "Topic categories are viewable by everyone"
  ON topic_categories FOR SELECT
  USING (is_active = true);

SELECT 'Step 7 completed - RLS policies created' as status;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

SELECT 'SETUP COMPLETED SUCCESSFULLY! 🎉' as result;

-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('topics', 'topic_categories') 
AND table_schema = 'public';

-- Verify columns exist
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE (table_name = 'questions' AND column_name IN ('topic_id', 'exam_type'))
   OR (table_name = 'subscription_plans' AND column_name = 'price_ngn')
   OR (table_name = 'topics' AND column_name = 'category_id');