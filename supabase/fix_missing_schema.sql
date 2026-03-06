-- ============================================================================
-- SOPHIA PREP - DATABASE SCHEMA FIX (REVISED)
-- ============================================================================
-- This script fixes the missing 'subjects_with_details' view and ensures 
-- correct relationships to the 'subjects' table, cleaning up any 
-- orphaned 'subjects_new' references.

-- 1. CLEANUP ORPHANED TABLES FROM PREVIOUS REFACTOR ATTEMPTS
-- We drop these to ensure they are recreated with correct constraints
DROP VIEW IF EXISTS subjects_with_details CASCADE;
DROP TABLE IF EXISTS subject_exam_types CASCADE;
DROP TABLE IF EXISTS exam_types CASCADE;
DROP TABLE IF EXISTS subject_categories CASCADE;

-- Also drop subjects_new if it exists as we should stick to 'subjects'
DROP TABLE IF EXISTS subjects_new CASCADE;

-- 2. EXAM TYPES TABLE
CREATE TABLE exam_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  full_name TEXT,
  duration_minutes INTEGER,
  total_questions INTEGER,
  passing_score INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUBJECT CATEGORIES TABLE
CREATE TABLE subject_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color_theme TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENSURE SUBJECTS TABLE HAS CATEGORY_ID
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subjects' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE subjects ADD COLUMN category_id UUID REFERENCES subject_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. SUBJECT-EXAM TYPE JUNCTION TABLE
-- Crucial: Explicitly reference the 'subjects' table, not 'subjects_new'
CREATE TABLE subject_exam_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam_type_id UUID NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT FALSE,
  max_questions INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, exam_type_id)
);

-- 6. SEED INITIAL DATA
INSERT INTO exam_types (name, slug, description, full_name, duration_minutes, total_questions, passing_score)
VALUES ('JAMB', 'jamb', 'Joint Admissions and Matriculation Board', 'Joint Admissions and Matriculation Board', 180, 180, 180)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subject_categories (name, slug, description, color_theme, icon) VALUES
('SCIENCE', 'science', 'Science and Technology subjects', 'blue', 'flask'),
('COMMERCIAL', 'commercial', 'Business and Commercial subjects', 'green', 'briefcase'),
('ARTS', 'arts', 'Arts and Humanities subjects', 'purple', 'book'),
('LANGUAGE', 'language', 'Language subjects', 'orange', 'globe'),
('GENERAL', 'general', 'General subjects required by all', 'gray', 'star')
ON CONFLICT (slug) DO NOTHING;

-- Map existing categories to UUIDs
UPDATE subjects s
SET category_id = sc.id
FROM subject_categories sc
WHERE s.subject_category = sc.name
AND s.category_id IS NULL;

-- Link existing subjects to JAMB exam type
INSERT INTO subject_exam_types (subject_id, exam_type_id, is_mandatory)
SELECT s.id, et.id, s.is_mandatory
FROM subjects s
CROSS JOIN exam_types et
WHERE et.slug = 'jamb'
ON CONFLICT DO NOTHING;

-- 7. CREATE THE MISSING VIEW
CREATE OR REPLACE VIEW subjects_with_details AS
SELECT 
  s.id,
  s.name,
  s.slug,
  s.description,
  s.icon,
  s.color_theme,
  sc.name as category_name,
  sc.slug as category_slug,
  sc.color_theme as category_color,
  ARRAY_AGG(DISTINCT et.name) FILTER (WHERE et.name IS NOT NULL) as exam_types,
  ARRAY_AGG(DISTINCT et.slug) FILTER (WHERE et.slug IS NOT NULL) as exam_type_slugs,
  s.is_mandatory,
  s.is_active,
  s.sort_order
FROM subjects s
LEFT JOIN subject_categories sc ON s.category_id = sc.id
LEFT JOIN subject_exam_types set ON s.id = set.subject_id
LEFT JOIN exam_types et ON set.exam_type_id = et.id
WHERE s.is_active = true
GROUP BY s.id, s.name, s.slug, s.description, s.icon, s.color_theme, 
         sc.name, sc.slug, sc.color_theme, s.is_mandatory, s.is_active, s.sort_order;

-- 8. JAMB VALIDATION FUNCTION
CREATE OR REPLACE FUNCTION validate_jamb_subject_selection(
  p_selected_subject_ids UUID[]
)
RETURNS TABLE (
  is_valid BOOLEAN,
  message TEXT,
  subject_count INTEGER,
  has_english BOOLEAN,
  missing_subjects TEXT[],
  extra_subjects TEXT[]
) AS $$
DECLARE
  english_subject_id UUID;
  subject_count INTEGER;
  has_english BOOLEAN := FALSE;
BEGIN
  SELECT id INTO english_subject_id FROM subjects WHERE slug = 'english' AND is_active = true;
  subject_count := array_length(p_selected_subject_ids, 1);
  has_english := english_subject_id = ANY(p_selected_subject_ids);
  
  IF subject_count IS NULL OR subject_count = 0 THEN
    RETURN QUERY SELECT FALSE, 'No subjects selected'::TEXT, 0, FALSE, ARRAY['English Language']::TEXT[], ARRAY[]::TEXT[];
  ELSIF subject_count > 4 THEN
    RETURN QUERY SELECT FALSE, 'JAMB allows maximum 4 subjects only'::TEXT, subject_count, has_english, ARRAY[]::TEXT[], ARRAY['Remove ' || (subject_count - 4) || ' subjects']::TEXT[];
  ELSIF subject_count < 4 THEN
    RETURN QUERY SELECT FALSE, 'JAMB requires exactly 4 subjects'::TEXT, subject_count, has_english, ARRAY['Add ' || (4 - subject_count) || ' more subjects']::TEXT[], ARRAY[]::TEXT[];
  ELSIF NOT has_english THEN
    RETURN QUERY SELECT FALSE, 'English Language is mandatory for all JAMB candidates'::TEXT, subject_count, has_english, ARRAY['English Language']::TEXT[], ARRAY[]::TEXT[];
  ELSE
    RETURN QUERY SELECT TRUE, 'Valid JAMB subject combination'::TEXT, subject_count, has_english, ARRAY[]::TEXT[], ARRAY[]::TEXT[];
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. NOTIFY COMPLETION
DO $$ BEGIN
  RAISE NOTICE 'Database schema fix applied successfully.';
END $$;
