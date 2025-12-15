-- COMPLETE DATABASE SETUP FOR TOPICS FEATURE
-- Copy and paste this ENTIRE script into Supabase Dashboard > SQL Editor and run it
-- This will set up everything needed for the topics feature

-- ============================================================================
-- PART 1: FIX MISSING COLUMNS (if needed)
-- ============================================================================

-- Add price_ngn column to subscription_plans table if it doesn't exist
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
        RAISE NOTICE 'price_ngn column already exists in subscription_plans table';
    END IF;
END $$;

-- Add exam_type column to questions table if it doesn't exist
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
        RAISE NOTICE 'exam_type column already exists in questions table';
    END IF;
END $$;

-- ============================================================================
-- PART 2: CREATE TOPICS STRUCTURE
-- ============================================================================

-- Create topic_categories table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topic_categories') THEN
        CREATE TABLE topic_categories (
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
        RAISE NOTICE 'Created topic_categories table';
    ELSE
        RAISE NOTICE 'topic_categories table already exists';
    END IF;
END $$;

-- Create topics table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topics') THEN
        CREATE TABLE topics (
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
        RAISE NOTICE 'Created topics table';
    ELSE
        RAISE NOTICE 'topics table already exists';
    END IF;
END $$;

-- Add topic_id to questions table if it doesn't exist
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
        RAISE NOTICE 'topic_id column already exists in questions table';
    END IF;
END $$;

-- Create indexes (with error handling)
DO $$ 
BEGIN
    -- Create indexes for topic_categories
    CREATE INDEX IF NOT EXISTS idx_topic_categories_subject_id ON topic_categories(subject_id);
    
    -- Create indexes for topics (only if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topics') THEN
        CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
        CREATE INDEX IF NOT EXISTS idx_topics_category_id ON topics(category_id);
        CREATE INDEX IF NOT EXISTS idx_topics_slug ON topics(slug);
    END IF;
    
    -- Create indexes for questions
    CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type);
    
    -- Create topic_id index only if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'topic_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
    END IF;
    
    RAISE NOTICE 'Indexes created successfully';
END $$;

-- Create triggers for updated_at (with error handling)
DO $$ 
BEGIN
    -- Create trigger for topics if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topics') THEN
        DROP TRIGGER IF EXISTS update_topics_updated_at ON topics;
        CREATE TRIGGER update_topics_updated_at 
          BEFORE UPDATE ON topics
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Create trigger for topic_categories if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topic_categories') THEN
        DROP TRIGGER IF EXISTS update_topic_categories_updated_at ON topic_categories;
        CREATE TRIGGER update_topic_categories_updated_at 
          BEFORE UPDATE ON topic_categories
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    RAISE NOTICE 'Triggers created successfully';
END $$;

-- ============================================================================
-- PART 3: SETUP ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS (with error handling)
DO $$ 
BEGIN
    -- Enable RLS for topics if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topics') THEN
        ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policy if it exists
        DROP POLICY IF EXISTS "Topics are viewable by everyone" ON topics;
        
        -- Create public read policy
        CREATE POLICY "Topics are viewable by everyone"
          ON topics FOR SELECT
          USING (is_active = true);
          
        RAISE NOTICE 'RLS enabled for topics table';
    END IF;
    
    -- Enable RLS for topic_categories if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topic_categories') THEN
        ALTER TABLE topic_categories ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policy if it exists
        DROP POLICY IF EXISTS "Topic categories are viewable by everyone" ON topic_categories;
        
        -- Create public read policy
        CREATE POLICY "Topic categories are viewable by everyone"
          ON topic_categories FOR SELECT
          USING (is_active = true);
          
        RAISE NOTICE 'RLS enabled for topic_categories table';
    END IF;
END $$;

-- ============================================================================
-- PART 4: UPDATE ADMIN POLICIES WITH CORRECT EMAILS
-- ============================================================================

-- Drop existing admin policies and recreate with correct emails
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
DROP POLICY IF EXISTS "Admins can manage questions" ON questions;
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admins can manage user subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can view all quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Admins can manage topics" ON topics;
DROP POLICY IF EXISTS "Admins can manage topic categories" ON topic_categories;

-- User profiles admin policies
CREATE POLICY "Admins can view all user profiles"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND (
        up.email = 'reubensunday1220@gmail.com' OR 
        up.email = 'sophiareignsacademy@gmail.com' OR 
        up.email = 'gigsdev007@gmail.com'
      )
    )
  );

CREATE POLICY "Admins can update all user profiles"
  ON user_profiles FOR UPDATE
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND (
        up.email = 'reubensunday1220@gmail.com' OR 
        up.email = 'sophiareignsacademy@gmail.com' OR 
        up.email = 'gigsdev007@gmail.com'
      )
    )
  );

CREATE POLICY "Admins can insert user profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND (
        up.email = 'reubensunday1220@gmail.com' OR 
        up.email = 'sophiareignsacademy@gmail.com' OR 
        up.email = 'gigsdev007@gmail.com'
      )
    )
  );

-- Subjects admin policies
CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

-- Questions admin policies
CREATE POLICY "Admins can manage questions"
  ON questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

-- Topics admin policies
CREATE POLICY "Admins can manage topics"
  ON topics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

CREATE POLICY "Admins can manage topic categories"
  ON topic_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

-- Subscription plans admin policies
CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

-- User subscriptions admin policies
CREATE POLICY "Admins can manage user subscriptions"
  ON user_subscriptions FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

-- Quiz attempts admin policies
CREATE POLICY "Admins can view all quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

-- Update any existing subscription plans to have a default price
UPDATE subscription_plans 
SET price_ngn = 0 
WHERE price_ngn IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that tables were created
SELECT 'Tables created successfully:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('topics', 'topic_categories') 
AND table_schema = 'public';

-- Check that columns were added
SELECT 'Columns added successfully:' as status;
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE (table_name = 'questions' AND column_name IN ('topic_id', 'exam_type'))
   OR (table_name = 'subscription_plans' AND column_name = 'price_ngn');

SELECT 'Database setup completed successfully! 🎉' as result;