-- ============================================================================
-- SOPHIA PREP - SEED SUBJECTS (SIMPLE VERSION)
-- ============================================================================
-- This script ONLY inserts the 21 JAMB/WAEC subjects
-- No procedural code - just INSERT and SELECT
-- Requirements: 1.1, 1.2, 1.3
-- ============================================================================

-- Insert all 21 JAMB/WAEC subjects
INSERT INTO subjects (name, slug, description, icon, color_theme, exam_type, subject_category, is_mandatory, is_active, sort_order)
VALUES
  ('English Language', 'english-language', 'Compulsory for all JAMB and WAEC candidates', 'book-open', '#1E40AF', 'BOTH', 'GENERAL', TRUE, TRUE, 1),
  ('Mathematics', 'mathematics', 'Core subject for Science and Commercial combinations', 'calculator', '#7C3AED', 'BOTH', 'GENERAL', FALSE, TRUE, 2),
  ('Physics', 'physics', 'Core science subject covering mechanics, electricity, and waves', 'atom', '#DC2626', 'BOTH', 'SCIENCE', FALSE, TRUE, 3),
  ('Chemistry', 'chemistry', 'Study of matter, chemical reactions, and compounds', 'flask', '#059669', 'BOTH', 'SCIENCE', FALSE, TRUE, 4),
  ('Biology', 'biology', 'Life sciences covering plants, animals, and human biology', 'dna', '#10B981', 'BOTH', 'SCIENCE', FALSE, TRUE, 5),
  ('Further Mathematics', 'further-mathematics', 'Advanced mathematics for science students', 'sigma', '#6366F1', 'BOTH', 'SCIENCE', FALSE, TRUE, 6),
  ('Geography', 'geography', 'Available for multiple combinations', 'map', '#F59E0B', 'BOTH', 'GENERAL', FALSE, TRUE, 7),
  ('Food & Nutrition', 'food-nutrition', 'Study of food science, nutrition, and dietetics', 'utensils', '#EC4899', 'WAEC', 'SCIENCE', FALSE, TRUE, 8),
  ('Commerce', 'commerce', 'Business and trade fundamentals', 'briefcase', '#3B82F6', 'BOTH', 'COMMERCIAL', FALSE, TRUE, 9),
  ('Accounting', 'accounting', 'Financial accounting and bookkeeping principles', 'receipt', '#8B5CF6', 'BOTH', 'COMMERCIAL', FALSE, TRUE, 10),
  ('Economics', 'economics', 'Study of production, distribution, and consumption', 'trending-up', '#EF4444', 'BOTH', 'COMMERCIAL', FALSE, TRUE, 11),
  ('Marketing', 'marketing', 'Principles of marketing and consumer behavior', 'megaphone', '#F97316', 'WAEC', 'COMMERCIAL', FALSE, TRUE, 12),
  ('Civic Education', 'civic-education', 'General knowledge and citizenship education', 'landmark', '#14B8A6', 'WAEC', 'GENERAL', FALSE, TRUE, 13),
  ('Literature in English', 'literature-in-english', 'Study of prose, poetry, and drama', 'book', '#A855F7', 'BOTH', 'ARTS', FALSE, TRUE, 14),
  ('Government', 'government', 'Political science and governance systems', 'building-columns', '#0EA5E9', 'BOTH', 'ARTS', FALSE, TRUE, 15),
  ('CRS/IRS', 'crs-irs', 'Christian Religious Studies / Islamic Religious Studies', 'church', '#84CC16', 'BOTH', 'ARTS', FALSE, TRUE, 16),
  ('Music', 'music', 'Music theory, history, and performance', 'music', '#F43F5E', 'WAEC', 'ARTS', FALSE, TRUE, 17),
  ('History', 'history', 'World and African history', 'scroll', '#78716C', 'WAEC', 'ARTS', FALSE, TRUE, 18),
  ('Yoruba', 'yoruba', 'Yoruba language and literature', 'language', '#22C55E', 'BOTH', 'LANGUAGE', FALSE, TRUE, 19),
  ('Hausa', 'hausa', 'Hausa language and literature', 'language', '#06B6D4', 'BOTH', 'LANGUAGE', FALSE, TRUE, 20),
  ('Igbo', 'igbo', 'Igbo language and literature', 'language', '#F59E0B', 'BOTH', 'LANGUAGE', FALSE, TRUE, 21)
ON CONFLICT (slug) DO NOTHING;

-- Verification: Show summary
SELECT 
  'SUMMARY' as info,
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

-- Verification: List all subjects
SELECT 
  sort_order,
  name,
  exam_type,
  subject_category,
  CASE WHEN is_mandatory THEN 'YES' ELSE 'NO' END as mandatory
FROM subjects
ORDER BY sort_order;
