import { supabase } from '../integrations/supabase/client';

export interface Novel {
  id: string;
  title: string;
  author?: string;
  description?: string;
  pdf_url?: string;
  file_name?: string;
  file_size?: number;
  subject_id?: string;
  upload_date: string;
  is_active: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface Syllabus {
  id: string;
  title: string;
  subject_id?: string;
  exam_year?: number;
  pdf_url?: string;
  file_name?: string;
  file_size?: number;
  upload_date: string;
  is_active: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface UploadResult {
  success: boolean;
  data?: Novel | Syllabus;
  error?: string;
}

export class PDFService {
  // Novel Management
  async getAllNovels(): Promise<Novel[]> {
    try {
      const { data, error } = await supabase.rpc('get_all_novels' as any);
      if (error) throw error;
      return (data as Novel[]) ?? [];
    } catch (error) {
      console.error('Error fetching novels:', error);
      return [];
    }
  }

  async getActiveNovels(): Promise<Novel[]> {
    try {
      const { data, error } = await supabase.rpc('get_active_novels' as any);
      if (error) throw error;
      return (data as Novel[]) ?? [];
    } catch (error) {
      console.error('Error fetching active novels:', error);
      return [];
    }
  }

  async uploadNovel(
    file: File,
    metadata: {
      title: string;
      author?: string;
      description?: string;
      subject_id?: string;
    }
  ): Promise<UploadResult> {
    try {
      // Validate file type
      if (file.type !== 'application/pdf') {
        return { success: false, error: 'Only PDF files are allowed' };
      }

      // Generate unique filename
      const fileExt = 'pdf';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `novels/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('novels')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('novels')
        .getPublicUrl(filePath);

      // Save metadata to database using raw SQL to avoid type issues
      const { data: novelData, error: dbError } = await supabase
        .rpc('insert_novel', {
          p_title: metadata.title,
          p_author: metadata.author,
          p_description: metadata.description,
          p_subject_id: metadata.subject_id,
          p_pdf_url: urlData.publicUrl,
          p_file_name: file.name,
          p_file_size: file.size,
        } as any);

      if (dbError) throw dbError;

      return { success: true, data: novelData as Novel };
    } catch (error: unknown) {
      console.error('Error uploading novel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }

  async deleteNovel(id: string): Promise<boolean> {
    try {
      // Get novel data first to extract file path
      const { data: novels } = await supabase.rpc('get_all_novels' as any);
      const novel = ((novels as unknown) as Novel[])?.find(n => n.id === id);

      // Delete from storage if file exists
      if (novel?.pdf_url) {
        const urlParts = novel.pdf_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `novels/${fileName}`;
        
        await supabase.storage.from('novels').remove([filePath]);
      }

      // Delete from database
      const { data, error } = await supabase.rpc('delete_novel', { novel_id: id } as any);
      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error deleting novel:', error);
      return false;
    }
  }

  // Syllabus Management
  async getAllSyllabus(): Promise<Syllabus[]> {
    try {
      const { data, error } = await supabase.rpc('get_all_syllabus' as any);
      if (error) throw error;
      return (data as Syllabus[]) ?? [];
    } catch (error) {
      console.error('Error fetching syllabus:', error);
      return [];
    }
  }

  async getActiveSyllabus(): Promise<Syllabus[]> {
    try {
      const { data, error } = await supabase.rpc('get_active_syllabus' as any);
      if (error) throw error;
      return (data as Syllabus[]) ?? [];
    } catch (error) {
      console.error('Error fetching active syllabus:', error);
      return [];
    }
  }

  async uploadSyllabus(
    file: File,
    metadata: {
      title: string;
      subject_id?: string;
      exam_year?: number;
    }
  ): Promise<UploadResult> {
    try {
      // Validate file type
      if (file.type !== 'application/pdf') {
        return { success: false, error: 'Only PDF files are allowed' };
      }

      // Generate unique filename
      const fileExt = 'pdf';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `syllabus/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('syllabus')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('syllabus')
        .getPublicUrl(filePath);

      // Save metadata to database using raw SQL to avoid type issues
      const { data: syllabusData, error: dbError } = await supabase
        .rpc('insert_syllabus', {
          p_title: metadata.title,
          p_subject_id: metadata.subject_id,
          p_exam_year: metadata.exam_year,
          p_pdf_url: urlData.publicUrl,
          p_file_name: file.name,
          p_file_size: file.size,
        } as any);

      if (dbError) throw dbError;

      return { success: true, data: syllabusData as Syllabus };
    } catch (error: unknown) {
      console.error('Error uploading syllabus:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }

  async deleteSyllabus(id: string): Promise<boolean> {
    try {
      // Get syllabus data first to extract file path
      const { data: syllabusData } = await supabase.rpc('get_all_syllabus' as any);
      const syllabus = ((syllabusData as unknown) as Syllabus[])?.find(s => s.id === id);

      // Delete from storage if file exists
      if (syllabus?.pdf_url) {
        const urlParts = syllabus.pdf_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `syllabus/${fileName}`;
        
        await supabase.storage.from('syllabus').remove([filePath]);
      }

      // Delete from database
      const { data, error } = await supabase.rpc('delete_syllabus', { syllabus_id: id } as any);
      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error deleting syllabus:', error);
      return false;
    }
  }

  // Utility functions
  async incrementDownloadCount(type: 'novels' | 'syllabus', id: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_download_count', {
        table_name: type,
        record_id: id
      } as any);

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing download count:', error);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async toggleActive(type: 'novels' | 'syllabus', id: string, isActive: boolean): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('toggle_pdf_active', {
        table_name: type,
        record_id: id,
        new_status: isActive
      } as unknown);

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error(`Error toggling ${type} active status:`, error);
      return false;
    }
  }
}

export const pdfService = new PDFService();