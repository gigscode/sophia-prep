-- Check what columns actually exist in the topics table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'topics' 
ORDER BY ordinal_position;

-- Check what columns exist in topic_categories table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'topic_categories' 
ORDER BY ordinal_position;

-- Check what policies already exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('topics', 'topic_categories');