-- STEP 4B: Just create indexes
-- Run this after 4A works

CREATE INDEX IF NOT EXISTS idx_topic_categories_subject_id ON topic_categories(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_category_id ON topics(category_id);
CREATE INDEX IF NOT EXISTS idx_topics_slug ON topics(slug);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type);

SELECT 'Step 4B completed - indexes created!' as result;