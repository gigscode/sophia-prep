import { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { showToast } from '../ui/Toast';
import { pdfService } from '../../services/pdf-service';
import type { Subject } from '../../integrations/supabase/types';

interface PDFUploadProps {
  type: 'novels' | 'syllabus';
  subjects: Subject[];
  onUploadSuccess: () => void;
  onClose: () => void;
}

const PDF_TYPES = {
  novels: { label: 'Study Material', field: 'study material' },
  syllabus: { label: 'Syllabus File', field: 'syllabus file' }
} as const;

export function PDFUpload({ type, subjects, onUploadSuccess, onClose }: PDFUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [examYear, setExamYear] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      showToast('Please select a PDF file', 'error');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
      showToast('File size must be less than 50MB', 'error');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      // Auto-fill title from filename
      const fileName = selectedFile.name.replace('.pdf', '');
      setTitle(fileName);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      showToast('Please select a file and enter a title', 'error');
      return;
    }

    setUploading(true);

    try {
      let result;
      
      if (type === 'novels') {
        result = await pdfService.uploadNovel(file, {
          title: title.trim(),
          author: author.trim() || undefined,
          description: description.trim() || undefined,
          subject_id: subjectId || undefined,
        });
      } else {
        result = await pdfService.uploadSyllabus(file, {
          title: title.trim(),
          subject_id: subjectId || undefined,
          exam_year: examYear ? parseInt(examYear) : undefined,
        });
      }

      if (result.success) {
        showToast(`${PDF_TYPES[type].label} uploaded successfully`, 'success');
        onUploadSuccess();
        onClose();
      } else {
        showToast(result.error || 'Upload failed', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    return pdfService.formatFileSize(bytes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            Upload {PDF_TYPES[type].label}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium mb-2">PDF File</label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : file
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={removeFile}
                      className="p-1 hover:bg-red-100 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      Drop your PDF file here
                    </p>
                    <p className="text-sm text-gray-500">or click to browse</p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="mt-3"
                  >
                    Choose File
                  </Button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">
              Maximum file size: 50MB. Only PDF files are allowed.
            </p>
          </div>

          {/* Metadata Form */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter ${PDF_TYPES[type].field} title`}
              />
            </div>

            {/* Author (novels only) */}
            {type === 'novels' && (
              <div>
                <label className="block text-sm font-medium mb-2">Author</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter author name"
                />
              </div>
            )}

            {/* Description (novels only) */}
            {type === 'novels' && (
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter description"
                />
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <Select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                options={[
                  { value: '', label: 'Select Subject (Optional)' },
                  ...subjects.map(s => ({ value: s.id, label: s.name }))
                ]}
              />
            </div>

            {/* Exam Year (syllabus only) */}
            {type === 'syllabus' && (
              <div>
                <label className="block text-sm font-medium mb-2">Exam Year</label>
                <input
                  type="number"
                  value={examYear}
                  onChange={(e) => setExamYear(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 2024"
                  min="2000"
                  max="2030"
                />
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || !title.trim() || uploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {PDF_TYPES[type].label}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}