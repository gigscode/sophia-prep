-- ============================================================================
-- SOPHIA PREP - SEED SUBJECTS ONLY
-- ============================================================================
-- This script ONLY inserts the 21 JAMB/WAEC subjects
-- Use this when your tables already exist
-- Requirements: 1.1, 1.2, 1.3
-- ============================================================================

-- Insert all 21 JAMB/WAEC subjects
INSERT INTO subjects (name, slug, description, icon, color_theme, exam_type, subject_category, is_mandatory, is_active, sort_order)
VALUES
  -- Mandatory subject
  ('English Language', 'english-language', 'Compulsory for all JAMB and WAEC candidates', 'book-open', '#1E40AF', 'BOTH', 'GENERAL', TRUE, TRUE, 1),
  
  -- General subjects
  ('Mathematics', 'mathematics', 'Core subject for Science and Commercial combinations', 'calculator', '#7C3AED', 'BOTH', 'GENERAL', FALSE, TRUE, 2),
  ('Geography', 'geography', 'Available for multiple combinations', 'map', '#F59E0B', 'BOTH', 'GENERAL', FALSE, TRUE, 7),
  ('Civic Education', 'civic-education', 'General knowledge and citizenship education', 'landmark', '#14B8A6', 'WAEC', 'GENERAL', FALSE, TRUE, 13),
  
  -- Science subjects
  ('Physics', 'physics', 'Core science subject covering mechanics, electricity, and waves', 'atom', '#DC2626', 'BOTH', 'SCIENCE', FALSE, TRUE, 3),
  ('Chemistry', 'chemistry', 'Study of matter, chemical reactions, and compounds', 'flask', '#059669', 'BOTH', 'SCIENCE', FALSE, TRUE, 4),
  ('Biology', 'biology', 'Life sciences covering plants, animals, and human biology', 'dna', '#10B981', 'BOTH', 'SCIENCE', FALSE, TRUE, 5),
  ('Further Mathematics', 'further-mathematics', 'Advanced mathematics for science students', 'sigma', '#6366F1', 'BOTH', 'SCIENCE', FALSE, TRUE, 6),
  ('Food & Nutrition', 'food-nutrition', 'Study of food science, nutrition, and dietetics', 'utensils', '#EC4899', 'WAEC', 'SCIENCE', FALSE, TRUE, 8),
  
  -- Commercial subjects
  ('Commerce', 'commerce', 'Business and trade fundamentals', 'briefcase', '#3B82F6', 'BOTH', 'COMMERCIAL', FALSE, TRUE, 9),
  ('Accounting', 'accounting', 'Financial accounting and bookkeeping principles', 'receipt', '#8B5CF6', 'BOTH', 'COMMERCIAL', FALSE, TRUE, 10),
  ('Economics', 'economics', 'Study of production, distribution, and consumption', 'trending-up', '#EF4444', 'BOTH', 'COMMERCIAL', FALSE, TRUE, 11),
  ('Marketing', 'marketing', 'Principles of marketing and consumer behavior', 'megaphone', '#F97316', 'WAEC', 'COMMERCIAL', FALSE, TRUE, 12),
  
  -- Arts subjects
  ('Literature in English', 'literature-in-english', 'Study of prose, poetry, and drama', 'book', '#A855F7', 'BOTH', 'ARTS', FALSE, TRUE, 14),
  ('Government', 'government', 'Political science and governance systems', 'building-columns', '#0EA5E9', 'BOTH', 'ARTS', FALSE, TRUE, 15),
  ('CRS/IRS', 'crs-irs', 'Christian Religious Studies / Islamic Religious Studies', 'church', '#84CC16', 'BOTH', 'ARTS', FALSE, TRUE, 16),
  ('Music', 'music', 'Music theory, history, and performance', 'music', '#F43F5E', 'WAEC', 'ARTS', FALSE, TRUE, 17),
  ('History', 'history', 'World and African history', 'scroll', '#78716C', 'WAEC', 'ARTS', FALSE, TRUE, 18),
  
  -- Nigerian languages
  ('Yoruba', 'yoruba', 'Yoruba language and literature', 'language', '#22C55E', 'BOTH', 'LANGUAGE', FALSE, TRUE, 19),
  ('Hausa', 'hausa', 'Hausa language and literature', 'language', '#06B6D4', 'BOTH', 'LANGUAGE', FALSE, TRUE, 20),
  ('Igbo', 'igbo', 'Igbo language and literature', 'language', '#F59E0B', 'BOTH', 'LANGUAGE', FALSE, TRUE, 21)
ON CONFLICT (slug) DO NOTHING;

-- Quick verification
SELECT 
  '✅ VERIFICATION RESULTS' as status,
  COUNT(*) as total_subjects,
  COUNT(*) FILTER (WHERE subject_category = 'GENERAL') as general,
  COUNT(*) FILTER (WHERE subject_category = 'SCIENCE') as science,
  COUNT(*) FILTER (WHERE subject_category = 'COMMERCIAL') as commercial,
  COUNT(*) FILTER (WHERE subject_category = 'ARTS') as arts,
  COUNT(*) FILTER (WHERE subject_category = 'LANGUAGE') as language,
  COUNT(*) FILTER (WHERE exam_type = 'BOTH') as both_exams,
  COUNT(*) FILTER (WHERE exam_type = 'WAEC') as waec_only,
  COUNT(*) FILTER (WHERE is_mandatory = TRUE) as mandatory
FROM subjects;

-- List all subjects
SELECT 
  sort_order,
  name,
  exam_type,
  subject_category,
  CASE WHEN is_mandatory THEN '⭐ MANDATORY' ELSE '' END as status
FROM subjects
ORDER BY sort_order;
