DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'log_migration_operation'
  ) THEN
    PERFORM log_migration_operation(
      'add_metadata_and_exam_items',
      'START_MIGRATION',
      'STARTED',
      0,
      NULL,
      '{"description": "Add metadata to questions and create exam_items"}'::jsonb
    );
  END IF;
END $$;

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS exam_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('ESSAY','PRACTICAL')),
  prompt TEXT NOT NULL,
  expected_structure TEXT,
  mark_weighting INTEGER DEFAULT 0,
  time_minutes INTEGER DEFAULT 0,
  bloom_level TEXT,
  related_past JSONB DEFAULT '[]'::jsonb,
  exam_types TEXT[] DEFAULT ARRAY['JAMB','WAEC'],
  "references" JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_items_subject ON exam_items(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_items_topic ON exam_items(topic_id);
CREATE INDEX IF NOT EXISTS idx_exam_items_type ON exam_items(item_type);
CREATE INDEX IF NOT EXISTS idx_exam_items_active ON exam_items(is_active) WHERE is_active = TRUE;

ALTER TABLE exam_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active exam items"
  ON exam_items FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Authenticated users can view all exam items"
  ON exam_items FOR SELECT
  TO authenticated
  USING (TRUE);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'log_migration_operation'
  ) THEN
    PERFORM log_migration_operation(
      'add_metadata_and_exam_items',
      'ALTER_AND_CREATE',
      'COMPLETED',
      0,
      NULL,
      '{"description": "Added questions.metadata and created exam_items table"}'::jsonb
    );
  END IF;
END $$;