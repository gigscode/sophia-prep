-- Step 2: Generate slugs for any existing topics
-- Date: 2025-12-16
-- Description: Auto-generate slugs for topics that don't have them

-- Update existing topics to have slugs based on their names
UPDATE topics
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+',
        '-',
        'g'
    )
)
WHERE slug IS NULL OR slug = '';

-- Verify the update
SELECT 
    COUNT(*) as total_topics,
    COUNT(slug) as topics_with_slug,
    COUNT(*) - COUNT(slug) as topics_without_slug
FROM topics;

