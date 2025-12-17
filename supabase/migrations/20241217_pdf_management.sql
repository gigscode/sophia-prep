-- PDF Management System for Novels and Syllabus
-- Migration: 20241217_pdf_management.sql

-- Create storage buckets for PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('novels', 'novels', true),
  ('syllabus', 'syllabus', true)
ON CONFLICT (id) DO NOTHING;

-- Novels table
CREATE TABLE IF NOT EXISTS novels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  pdf_url TEXT, -- Supabase storage URL
  file_name TEXT, -- Original file name
  file_size BIGINT, -- File size in bytes
  subject_id UUID REFERENCES subjects(id),
  upload_date TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Syllabus table  
CREATE TABLE IF NOT EXISTS syllabus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  exam_year INTEGER,
  pdf_url TEXT, -- Supabase storage URL
  file_name TEXT, -- Original file name
  file_size BIGINT, -- File size in bytes
  upload_date TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Storage policies for novels bucket
CREATE POLICY "Public read access for novels" ON storage.objects
  FOR SELECT USING (bucket_id = 'novels');

CREATE POLICY "Admin upload access for novels" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'novels' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Admin delete access for novels" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'novels' AND 
    auth.role() = 'authenticated'
  );

-- Storage policies for syllabus bucket
CREATE POLICY "Public read access for syllabus" ON storage.objects
  FOR SELECT USING (bucket_id = 'syllabus');

CREATE POLICY "Admin upload access for syllabus" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'syllabus' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Admin delete access for syllabus" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'syllabus' AND 
    auth.role() = 'authenticated'
  );

-- RLS policies for novels table
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for active novels" ON novels
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access for novels" ON novels
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS policies for syllabus table
ALTER TABLE syllabus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for active syllabus" ON syllabus
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access for syllabus" ON syllabus
  FOR ALL USING (auth.role() = 'authenticated');

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_novels_subject_id ON novels(subject_id);
CREATE INDEX IF NOT EXISTS idx_novels_active ON novels(is_active);
CREATE INDEX IF NOT EXISTS idx_syllabus_subject_id ON syllabus(subject_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_year ON syllabus(exam_year);
CREATE INDEX IF NOT EXISTS idx_syllabus_active ON syllabus(is_active);

-- Function to update download count
CREATE OR REPLACE FUNCTION increment_download_count(table_name TEXT, record_id UUID)
RETURNS VOID AS $$
BEGIN
  IF table_name = 'novels' THEN
    UPDATE novels SET download_count = download_count + 1 WHERE id = record_id;
  ELSIF table_name = 'syllabus' THEN
    UPDATE syllabus SET download_count = download_count + 1 WHERE id = record_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all novels
CREATE OR REPLACE FUNCTION get_all_novels()
RETURNS TABLE (
  id UUID,
  title TEXT,
  author TEXT,
  description TEXT,
  pdf_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  subject_id UUID,
  upload_date TIMESTAMP,
  is_active BOOLEAN,
  download_count INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT n.id, n.title, n.author, n.description, n.pdf_url, n.file_name, 
         n.file_size, n.subject_id, n.upload_date, n.is_active, 
         n.download_count, n.created_at, n.updated_at
  FROM novels n
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active novels
CREATE OR REPLACE FUNCTION get_active_novels()
RETURNS TABLE (
  id UUID,
  title TEXT,
  author TEXT,
  description TEXT,
  pdf_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  subject_id UUID,
  upload_date TIMESTAMP,
  is_active BOOLEAN,
  download_count INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT n.id, n.title, n.author, n.description, n.pdf_url, n.file_name, 
         n.file_size, n.subject_id, n.upload_date, n.is_active, 
         n.download_count, n.created_at, n.updated_at
  FROM novels n
  WHERE n.is_active = true
  ORDER BY n.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all syllabus
CREATE OR REPLACE FUNCTION get_all_syllabus()
RETURNS TABLE (
  id UUID,
  title TEXT,
  subject_id UUID,
  exam_year INTEGER,
  pdf_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  upload_date TIMESTAMP,
  is_active BOOLEAN,
  download_count INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.title, s.subject_id, s.exam_year, s.pdf_url, s.file_name, 
         s.file_size, s.upload_date, s.is_active, s.download_count, 
         s.created_at, s.updated_at
  FROM syllabus s
  ORDER BY s.exam_year DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active syllabus
CREATE OR REPLACE FUNCTION get_active_syllabus()
RETURNS TABLE (
  id UUID,
  title TEXT,
  subject_id UUID,
  exam_year INTEGER,
  pdf_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  upload_date TIMESTAMP,
  is_active BOOLEAN,
  download_count INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.title, s.subject_id, s.exam_year, s.pdf_url, s.file_name, 
         s.file_size, s.upload_date, s.is_active, s.download_count, 
         s.created_at, s.updated_at
  FROM syllabus s
  WHERE s.is_active = true
  ORDER BY s.exam_year DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to insert novel
CREATE OR REPLACE FUNCTION insert_novel(
  p_title TEXT,
  p_author TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_subject_id UUID DEFAULT NULL,
  p_pdf_url TEXT DEFAULT NULL,
  p_file_name TEXT DEFAULT NULL,
  p_file_size BIGINT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  author TEXT,
  description TEXT,
  pdf_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  subject_id UUID,
  upload_date TIMESTAMP,
  is_active BOOLEAN,
  download_count INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO novels (title, author, description, subject_id, pdf_url, file_name, file_size)
  VALUES (p_title, p_author, p_description, p_subject_id, p_pdf_url, p_file_name, p_file_size)
  RETURNING novels.id INTO new_id;
  
  RETURN QUERY
  SELECT n.id, n.title, n.author, n.description, n.pdf_url, n.file_name, 
         n.file_size, n.subject_id, n.upload_date, n.is_active, 
         n.download_count, n.created_at, n.updated_at
  FROM novels n
  WHERE n.id = new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to insert syllabus
CREATE OR REPLACE FUNCTION insert_syllabus(
  p_title TEXT,
  p_subject_id UUID DEFAULT NULL,
  p_exam_year INTEGER DEFAULT NULL,
  p_pdf_url TEXT DEFAULT NULL,
  p_file_name TEXT DEFAULT NULL,
  p_file_size BIGINT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  subject_id UUID,
  exam_year INTEGER,
  pdf_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  upload_date TIMESTAMP,
  is_active BOOLEAN,
  download_count INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO syllabus (title, subject_id, exam_year, pdf_url, file_name, file_size)
  VALUES (p_title, p_subject_id, p_exam_year, p_pdf_url, p_file_name, p_file_size)
  RETURNING syllabus.id INTO new_id;
  
  RETURN QUERY
  SELECT s.id, s.title, s.subject_id, s.exam_year, s.pdf_url, s.file_name, 
         s.file_size, s.upload_date, s.is_active, s.download_count, 
         s.created_at, s.updated_at
  FROM syllabus s
  WHERE s.id = new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete novel
CREATE OR REPLACE FUNCTION delete_novel(novel_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  novel_url TEXT;
  file_path TEXT;
BEGIN
  -- Get the PDF URL first
  SELECT pdf_url INTO novel_url FROM novels WHERE id = novel_id;
  
  -- Extract file path and delete from storage if exists
  IF novel_url IS NOT NULL THEN
    file_path := 'novels/' || split_part(novel_url, '/', -1);
    -- Note: Storage deletion needs to be handled by the client
  END IF;
  
  -- Delete from database
  DELETE FROM novels WHERE id = novel_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete syllabus
CREATE OR REPLACE FUNCTION delete_syllabus(syllabus_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  syllabus_url TEXT;
  file_path TEXT;
BEGIN
  -- Get the PDF URL first
  SELECT pdf_url INTO syllabus_url FROM syllabus WHERE id = syllabus_id;
  
  -- Extract file path and delete from storage if exists
  IF syllabus_url IS NOT NULL THEN
    file_path := 'syllabus/' || split_part(syllabus_url, '/', -1);
    -- Note: Storage deletion needs to be handled by the client
  END IF;
  
  -- Delete from database
  DELETE FROM syllabus WHERE id = syllabus_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle active status
CREATE OR REPLACE FUNCTION toggle_pdf_active(
  table_name TEXT,
  record_id UUID,
  new_status BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  IF table_name = 'novels' THEN
    UPDATE novels 
    SET is_active = new_status, updated_at = NOW() 
    WHERE id = record_id;
  ELSIF table_name = 'syllabus' THEN
    UPDATE syllabus 
    SET is_active = new_status, updated_at = NOW() 
    WHERE id = record_id;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;