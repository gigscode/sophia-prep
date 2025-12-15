-- FIXED STEP 4B: Create indexes (without the problematic category_id index)
-- Run this instead of the original step 4B

CREATE INDEX IF NOT EXISTS idx_topic_categories_subject_id ON topic_categories(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
-- Skip the category_id index for now since the column might not exist
CREATE INDEX IF NOT EXISTS idx_topics_slug ON topics(slug);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type);

SELECT 'Step 4B fixed - indexes created (skipping category_id)!' as result;