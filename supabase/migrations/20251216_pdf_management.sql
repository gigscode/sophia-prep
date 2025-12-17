-- PDF Management System for Novels and Syllabus
-- This migration creates tables and policies for managing PDF uploads

-- Create enum for PDF types
CREATE TYPE pdf_type AS ENUM ('novel', 'syllabus');

-- Create pdfs table
CREATE TABLE IF NOT EXISTS pdfs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  pdf_type pdf_type NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pdfs_type ON pdfs(pdf_type);
CREATE INDEX IF NOT EXISTS idx_pdfs_subject ON pdfs(subject_id);
CREATE INDEX IF NOT EXISTS idx_pdfs_active ON pdfs(is_active);
CREATE INDEX IF NOT EXISTS idx_pdfs_created ON pdfs(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pdfs_updated_at 
    BEFORE UPDATE ON pdfs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE pdfs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active PDFs
CREATE POLICY "Anyone can view active PDFs" ON pdfs
    FOR SELECT USING (is_active = true);

-- Policy: Only admins can insert PDFs
CREATE POLICY "Only admins can insert PDFs" ON pdfs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND is_admin = true
        )
    );

-- Policy: Only admins can update PDFs
CREATE POLICY "Only admins can update PDFs" ON pdfs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND is_admin = true
        )
    );

-- Policy: Only admins can delete PDFs
CREATE POLICY "Only admins can delete PDFs" ON pdfs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND is_admin = true
        )
    );

-- Create storage bucket for PDFs (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for PDF bucket
CREATE POLICY "Anyone can view PDFs" ON storage.objects
    FOR SELECT USING (bucket_id = 'pdfs');

CREATE POLICY "Only admins can upload PDFs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pdfs' AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY "Only admins can update PDFs" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'pdfs' AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY "Only admins can delete PDFs" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'pdfs' AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND is_admin = true
        )
    );

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_pdf_download_count(pdf_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE pdfs 
    SET download_count = download_count + 1 
    WHERE id = pdf_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION increment_pdf_download_count(UUID) TO authenticated;