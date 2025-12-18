import { useState, useEffect } from 'react';
import { Plus, FileText, Download, Trash2, Eye, EyeOff, Search, Filter } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { showToast } from '../ui/Toast';
import { PDFUpload } from './PDFUpload';
import { pdfService, type Novel, type Syllabus } from '../../services/pdf-service';
import { adminSubjectService } from '../../services/admin-subject-service';
import type { Subject } from '../../integrations/supabase/types';

type PDFType = 'novels' | 'syllabus';

const PDF_TYPES = {
  novels: { label: 'Study Materials', singular: 'Study Material' },
  syllabus: { label: 'Syllabus Files', singular: 'Syllabus File' }
} as const;

export function PDFManagement() {
  const [activeTab, setActiveTab] = useState<PDFType>('novels');
  const [novels, setNovels] = useState<Novel[]>([]);
  const [syllabus, setSyllabus] = useState<Syllabus[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [novelsData, syllabusData, subjectsData] = await Promise.all([
        pdfService.getAllNovels(),
        pdfService.getAllSyllabus(),
        adminSubjectService.getAllSubjects()
      ]);

      setNovels(novelsData);
      setSyllabus(syllabusData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading PDF data:', error);
      showToast('Failed to load PDF data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get filtered subjects based on the active tab
  const getFilteredSubjects = () => {
    if (activeTab === 'novels') {
      // Filter subjects to only show those relevant for novels:
      // English, Literature in English, and Nigerian languages (Hausa, Igbo, Yoruba)
      return subjects.filter(subject => {
        const subjectName = subject.name.toLowerCase();
        return (
          subjectName.includes('english') ||
          subjectName.includes('literature') ||
          subjectName.includes('hausa') ||
          subjectName.includes('igbo') ||
          subjectName.includes('yoruba')
        );
      });
    }
    // For syllabus, show all subjects
    return subjects;
  };

  const handleUploadSuccess = () => {
    loadData();
    setShowUpload(false);
  };

  const handleDelete = async (type: PDFType, id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const success = type === 'novels' 
        ? await pdfService.deleteNovel(id)
        : await pdfService.deleteSyllabus(id);

      if (success) {
        showToast(`${type === 'novels' ? 'Novel' : 'Syllabus'} deleted successfully`, 'success');
        loadData();
      } else {
        showToast('Failed to delete file', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete file', 'error');
    }
  };

  const handleToggleActive = async (type: PDFType, id: string, currentStatus: boolean) => {
    try {
      const success = await pdfService.toggleActive(type, id, !currentStatus);
      if (success) {
        showToast(`${type === 'novels' ? 'Novel' : 'Syllabus'} ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
        loadData();
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Toggle active error:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const handleDownload = async (url: string, fileName: string, type: PDFType, id: string) => {
    try {
      // Increment download count
      await pdfService.incrementDownloadCount(type, id);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download file', 'error');
    }
  };

  // Filter data based on search and filters
  const getFilteredData = () => {
    const data = activeTab === 'novels' ? novels : syllabus;
    
    return data.filter(item => {
      // Search filter
      const matchesSearch = !searchTerm || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activeTab === 'novels' && (item as Novel).author?.toLowerCase().includes(searchTerm.toLowerCase()));

      // Subject filter
      const matchesSubject = !selectedSubject || item.subject_id === selectedSubject;

      // Active filter
      const matchesActive = showInactive || item.is_active;

      return matchesSearch && matchesSubject && matchesActive;
    });
  };

  const getSubjectName = (subjectId?: string) => {
    if (!subjectId) return 'No Subject';
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const filteredData = getFilteredData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">PDF Management</h2>
        <Button
          onClick={() => setShowUpload(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload {PDF_TYPES[activeTab].singular}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('novels')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'novels'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {PDF_TYPES.novels.label} ({novels.length})
          </button>
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'syllabus'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {PDF_TYPES.syllabus.label} ({syllabus.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${PDF_TYPES[activeTab].label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Subject Filter */}
          <Select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            options={[
              { value: '', label: 'All Subjects' },
              ...getFilteredSubjects().map(s => ({ value: s.id, label: s.name }))
            ]}
          />

          {/* Show Inactive */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show inactive</span>
          </label>

          {/* Results count */}
          <div className="text-sm text-gray-500 flex items-center">
            <Filter className="w-4 h-4 mr-1" />
            {filteredData.length} of {activeTab === 'novels' ? novels.length : syllabus.length} items
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredData.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {PDF_TYPES[activeTab].label.toLowerCase()} found
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedSubject || !showInactive
              ? 'Try adjusting your filters'
              : `Upload your first ${PDF_TYPES[activeTab].singular.toLowerCase()} to get started`
            }
          </p>
          {!searchTerm && !selectedSubject && (
            <Button
              onClick={() => setShowUpload(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload {PDF_TYPES[activeTab].singular}
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredData.map((item) => (
              <li key={item.id} className="p-4 sm:px-6 sm:py-4">
                {/* Mobile-first layout */}
                <div className="space-y-3">
                  {/* Header with icon and title */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${item.is_active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <FileText className={`w-5 h-5 sm:w-6 sm:h-6 ${item.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 line-clamp-2">
                            {item.title}
                          </h3>
                          {!item.is_active && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="ml-11 sm:ml-14 space-y-1">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      {activeTab === 'novels' && (item as Novel).author && (
                        <span>by {(item as Novel).author}</span>
                      )}
                      {activeTab === 'syllabus' && (item as Syllabus).exam_year && (
                        <span>Year: {(item as Syllabus).exam_year}</span>
                      )}
                      <span>{getSubjectName(item.subject_id)}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>{pdfService.formatFileSize(item.file_size || 0)}</span>
                      <span>{item.download_count} downloads</span>
                    </div>
                    
                    {activeTab === 'novels' && (item as Novel).description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                        {(item as Novel).description}
                      </p>
                    )}
                  </div>

                  {/* Action buttons - Mobile optimized */}
                  <div className="ml-11 sm:ml-14 flex flex-wrap gap-2">
                    {/* Download */}
                    {item.pdf_url && (
                      <button
                        onClick={() => handleDownload(item.pdf_url!, item.file_name || item.title, activeTab, item.id)}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors touch-target"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    )}

                    {/* Toggle Active */}
                    <button
                      onClick={() => handleToggleActive(activeTab, item.id, item.is_active)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors touch-target ${
                        item.is_active
                          ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span className="hidden sm:inline">
                        {item.is_active ? 'Deactivate' : 'Activate'}
                      </span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(activeTab, item.id, item.title)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors touch-target"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <PDFUpload
          type={activeTab}
          subjects={getFilteredSubjects()}
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}