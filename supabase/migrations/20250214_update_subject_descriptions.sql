-- ============================================================================
-- UPDATE SUBJECT DESCRIPTIONS - REMOVE JAMB/WAEC REFERENCES
-- ============================================================================
-- Date: 2025-02-14
-- Description: Update subject descriptions to be JAMB-only and remove practice references
--              since this is for CBT exam, not practice mode
-- ============================================================================

-- Update subject descriptions to remove JAMB/WAEC and practice references
UPDATE subjects 
SET description = CASE 
  WHEN name = 'English Language' THEN 'English Language for JAMB CBT exam'
  WHEN name = 'Mathematics' THEN 'Mathematics for JAMB CBT exam'
  WHEN name = 'Physics' THEN 'Physics for JAMB CBT exam'
  WHEN name = 'Chemistry' THEN 'Chemistry for JAMB CBT exam'
  WHEN name = 'Biology' THEN 'Biology for JAMB CBT exam'
  WHEN name = 'Agricultural Science' THEN 'Agricultural Science for JAMB CBT exam'
  WHEN name = 'Economics' THEN 'Economics for JAMB CBT exam'
  WHEN name = 'Commerce' THEN 'Commerce for JAMB CBT exam'
  WHEN name = 'Accounting' THEN 'Accounting for JAMB CBT exam'
  WHEN name = 'Literature in English' THEN 'Literature in English for JAMB CBT exam'
  WHEN name = 'Government' THEN 'Government for JAMB CBT exam'
  WHEN name = 'Christian Religious Studies' THEN 'Christian Religious Studies for JAMB CBT exam'
  WHEN name = 'Islamic Religious Studies' THEN 'Islamic Religious Studies for JAMB CBT exam'
  WHEN name = 'Geography' THEN 'Geography for JAMB CBT exam'
  WHEN name = 'Civic Education' THEN 'Civic Education for JAMB CBT exam'
  WHEN name = 'History' THEN 'History for JAMB CBT exam'
  WHEN name = 'Fine Arts' THEN 'Fine Arts for JAMB CBT exam'
  WHEN name = 'Music' THEN 'Music for JAMB CBT exam'
  WHEN name = 'French' THEN 'French for JAMB CBT exam'
  WHEN name = 'Hausa' THEN 'Hausa for JAMB CBT exam'
  WHEN name = 'Igbo' THEN 'Igbo for JAMB CBT exam'
  WHEN name = 'Yoruba' THEN 'Yoruba for JAMB CBT exam'
  ELSE CONCAT(name, ' for JAMB CBT exam')
END
WHERE description LIKE '%practice and past questions%' 
   OR description LIKE '%JAMB/WAEC%'
   OR description LIKE '%practice%'
   OR exam_type = 'JAMB';

-- Update any remaining descriptions that might have old patterns
UPDATE subjects 
SET description = REPLACE(description, 'practice and past questions (JAMB/WAEC)', 'for JAMB CBT exam')
WHERE description LIKE '%practice and past questions (JAMB/WAEC)%';

UPDATE subjects 
SET description = REPLACE(description, 'practice and past questions (JAMB)', 'for JAMB CBT exam')
WHERE description LIKE '%practice and past questions (JAMB)%';

UPDATE subjects 
SET description = REPLACE(description, '(JAMB/WAEC)', '')
WHERE description LIKE '%(JAMB/WAEC)%';

-- Ensure all JAMB subjects have consistent descriptions
UPDATE subjects 
SET description = CONCAT(name, ' for JAMB CBT exam')
WHERE exam_type = 'JAMB' 
  AND (description IS NULL OR description = '' OR description NOT LIKE '%for JAMB CBT exam%');

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Subject descriptions updated successfully';
  RAISE NOTICE 'All subjects now have JAMB-only CBT exam descriptions';
END $$;