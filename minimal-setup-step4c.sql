-- STEP 4C: Create triggers and RLS
-- Run this after 4B works

-- Create triggers
DROP TRIGGER IF EXISTS update_topics_updated_at ON topics;
CREATE TRIGGER update_topics_updated_at 
  BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_topic_categories_updated_at ON topic_categories;
CREATE TRIGGER update_topic_categories_updated_at 
  BEFORE UPDATE ON topic_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Topics are viewable by everyone"
  ON topics FOR SELECT
  USING (is_active = true);

CREATE POLICY "Topic categories are viewable by everyone"
  ON topic_categories FOR SELECT
  USING (is_active = true);

SELECT 'Step 4C completed - triggers and RLS setup!' as result;