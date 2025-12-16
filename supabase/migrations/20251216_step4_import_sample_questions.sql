-- Step 4: Import Sample Questions from JSON files
-- Date: 2025-12-16
-- Description: Import sample questions for testing and initial content
-- NOTE: Run steps 1-3 first to ensure topics and slugs are set up

-- This migration imports a subset of questions from the JSON files
-- For full import, use the Node.js script: scripts/import-all-json-questions.js

-- Helper function to get subject_id by slug
CREATE OR REPLACE FUNCTION get_subject_id(subject_slug TEXT)
RETURNS UUID AS $$
DECLARE
  subject_uuid UUID;
BEGIN
  SELECT id INTO subject_uuid FROM subjects WHERE slug = subject_slug AND is_active = true LIMIT 1;
  RETURN subject_uuid;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get topic_id by subject and topic slug
CREATE OR REPLACE FUNCTION get_topic_id(subject_slug TEXT, topic_slug TEXT)
RETURNS UUID AS $$
DECLARE
  topic_uuid UUID;
BEGIN
  SELECT t.id INTO topic_uuid 
  FROM topics t
  JOIN subjects s ON t.subject_id = s.id
  WHERE s.slug = subject_slug AND t.slug = topic_slug AND t.is_active = true
  LIMIT 1;
  RETURN topic_uuid;
END;
$$ LANGUAGE plpgsql;

-- Mathematics Questions
INSERT INTO questions (subject_id, topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, exam_year, exam_type, is_active)
VALUES
  -- Algebra questions
  (get_subject_id('mathematics'), get_topic_id('mathematics', 'algebra'), 
   'If 2x + 3 = 11, find the value of x', '2', '3', '4', '5', 'C',
   '2x + 3 = 11, therefore 2x = 11 - 3 = 8, so x = 8/2 = 4', 2023, 'JAMB', true),
  
  (get_subject_id('mathematics'), get_topic_id('mathematics', 'algebra'),
   'Find the value of x in the equation: 5x - 7 = 2x + 8', '3', '4', '5', '6', 'C',
   '5x - 7 = 2x + 8, 5x - 2x = 8 + 7, 3x = 15, x = 5', 2022, 'JAMB', true),
  
  (get_subject_id('mathematics'), get_topic_id('mathematics', 'algebra'),
   'Solve for x: 3x + 5 = 20', '3', '5', '7', '10', 'B',
   '3x + 5 = 20 → 3x = 15 → x = 5', 2023, 'JAMB', true),

  -- Fractions questions
  (get_subject_id('mathematics'), get_topic_id('mathematics', 'fractions-decimals-approximations-and-percentages'),
   'Simplify: 3/4 + 1/2', '5/4', '4/6', '5/6', '1/4', 'A',
   '3/4 + 1/2 = 3/4 + 2/4 = 5/4', 2023, 'JAMB', true),

  -- Geometry questions
  (get_subject_id('mathematics'), get_topic_id('mathematics', 'geometry-and-trigonometry'),
   'What is the area of a rectangle with length 8cm and width 5cm?', '13 cm²', '26 cm²', '40 cm²', '80 cm²', 'C',
   'Area of rectangle = length × width = 8 × 5 = 40 cm²', 2023, 'JAMB', true),

  -- Trigonometry questions
  (get_subject_id('mathematics'), get_topic_id('mathematics', 'trigonometry'),
   'What is the value of sin 30°?', '0.5', '0.707', '0.866', '1.0', 'A',
   'sin 30° = 1/2 = 0.5', 2023, 'JAMB', true);

-- English Questions
INSERT INTO questions (subject_id, topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, exam_year, exam_type, is_active)
VALUES
  -- Vocabulary questions
  (get_subject_id('english'), get_topic_id('english', 'lexis-and-structure-synonyms-antonyms'),
   'Choose the word that best completes the sentence: ''The student was _____ for his outstanding performance.''', 
   'commended', 'condemned', 'commanded', 'commenced', 'A',
   '''Commended'' means praised, which fits the context of outstanding performance.', 2023, 'JAMB', true),

  -- Grammar questions
  (get_subject_id('english'), get_topic_id('english', 'grammar-mood-tense-aspect-number-agreement-concord-etc'),
   'In the sentence ''She had finished her homework before dinner,'' which tense is used?',
   'Simple past', 'Past perfect', 'Present perfect', 'Past continuous', 'B',
   'The past perfect (''had finished'') is used to describe an action completed before another past action (dinner).', 2023, 'JAMB', true),

  -- Word Classes
  (get_subject_id('english'), get_topic_id('english', 'word-classes-and-their-functions'),
   'Which of the following is a noun?', 'Run', 'Beautiful', 'Book', 'Quickly', 'C',
   'Book is a noun (a thing)', 2024, 'JAMB', true);

-- Physics Questions
INSERT INTO questions (subject_id, topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, exam_year, exam_type, is_active)
VALUES
  -- Energy questions
  (get_subject_id('physics'), get_topic_id('physics', 'work-energy-and-power'),
   'What is the formula for calculating kinetic energy?', 'KE = mv', 'KE = ½mv²', 'KE = mgh', 'KE = Fd', 'B',
   'Kinetic energy is calculated using KE = ½mv², where m is mass and v is velocity.', 2023, 'JAMB', true),

  -- Motion questions
  (get_subject_id('physics'), get_topic_id('physics', 'motion'),
   'An object moves at constant velocity 5 m/s for 10 s. What distance does it cover?',
   '50 m', '15 m', '5 m', '100 m', 'A',
   'Distance = speed × time = 5 m/s × 10 s = 50 m.', 2023, 'JAMB', true),

  -- Force questions
  (get_subject_id('physics'), get_topic_id('physics', 'equilibrium-of-forces'),
   'What is the unit of force?', 'Joule', 'Newton', 'Watt', 'Pascal', 'B',
   'Newton is the SI unit of force', 2023, 'JAMB', true);

-- Economics Questions
INSERT INTO questions (subject_id, topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, exam_year, exam_type, is_active)
VALUES
  (get_subject_id('economics'), get_topic_id('economics', 'theory-of-demand'),
   'If the price of a good falls and the quantity demanded rises, this is an example of which law?',
   'Law of Supply', 'Law of Demand', 'Gresham''s Law', 'Law of Diminishing Returns', 'B',
   'The Law of Demand states that, ceteris paribus, quantity demanded rises as price falls.', 2023, 'JAMB', true);

-- Clean up helper functions
DROP FUNCTION IF EXISTS get_subject_id(TEXT);
DROP FUNCTION IF EXISTS get_topic_id(TEXT, TEXT);

-- Verify the import
SELECT 
  s.name as subject,
  COUNT(q.id) as question_count
FROM subjects s
LEFT JOIN questions q ON s.id = q.subject_id
WHERE s.slug IN ('mathematics', 'physics', 'english', 'economics')
GROUP BY s.name
ORDER BY s.name;

-- Show sample questions
SELECT 
  s.name as subject,
  t.name as topic,
  LEFT(q.question_text, 50) || '...' as question_preview,
  q.exam_year,
  q.exam_type
FROM questions q
JOIN subjects s ON q.subject_id = s.id
LEFT JOIN topics t ON q.topic_id = t.id
WHERE q.is_active = true
ORDER BY s.name, t.name
LIMIT 20;

