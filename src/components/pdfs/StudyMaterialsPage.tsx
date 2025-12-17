import { useState, useEffect } from 'react';
import { FileText, Download, Search, Filter, BookOpen, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { pdfService, type Novel, type Syllabus } from '../../services/pdf-service';
import { adminSubjectService } from '../../services/admin-subject-service';
import type { Subject } from '../../integrations/supabase/types';
import { Select } from '../ui/Select';
import { showToast } from '../ui/Toast';

type PDFType = 'novels' | 'syllabus';

export function StudyMaterialsPage() {
  const [activeTab, setActiveTab] = useState<PDFType>('novels');
  const [novels, setNovels] = useState<Novel[]>([]);
  const [syllabus, setSyllabus] = useState<Syllabus[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [novelsData, syllabusData, subjectsData] = await Promise.all([
        pdfService.getActiveNovels(),
        pdfService.getActiveSyllabus(),
        adminSubjectService.getAllSubjects()
      ]);

      setNovels(novelsData);
      setSyllabus(syllabusData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading study materials:', error);
      showToast('Failed to load study materials', 'error');
    } finally {
      setLoading(false);
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
      
      showToast('Download started', 'success');
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

      return matchesSearch && matchesSubject;
    });
  };

  const getSubjectName = (subjectId?: string) => {
    if (!subjectId) return 'General';
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const filteredData = getFilteredData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Study Materials</h1>
          <p className="text-xl text-gray-600">
            Access study materials and syllabus files to enhance your preparation
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('novels')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'novels'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="w-5 h-5 inline-block mr-2" />
                Study Materials ({novels.length})
              </button>
              <button
                onClick={() => setActiveTab('syllabus')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'syllabus'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-5 h-5 inline-block mr-2" />
                Syllabus Files ({syllabus.length})
              </button>
            </nav>
          </div>

          {/* Filters */}
          <div className="p-6 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'novels' ? 'study materials' : 'syllabus files'}...`}
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
                  ...subjects.map(s => ({ value: s.id, label: s.name }))
                ]}
              />

              {/* Results count */}
              <div className="text-sm text-gray-500 flex items-center">
                <Filter className="w-4 h-4 mr-1" />
                {filteredData.length} of {activeTab === 'novels' ? novels.length : syllabus.length} items
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-lg shadow-sm"
          >
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No {activeTab === 'novels' ? 'study materials' : 'syllabus files'} found
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedSubject
                ? 'Try adjusting your search filters'
                : `No ${activeTab === 'novels' ? 'study materials' : 'syllabus files'} are currently available`
              }
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredData.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {item.title}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-gray-500 mb-3">
                      {activeTab === 'novels' && (item as Novel).author && (
                        <p>by {(item as Novel).author}</p>
                      )}
                      {activeTab === 'syllabus' && (item as Syllabus).exam_year && (
                        <p>Year: {(item as Syllabus).exam_year}</p>
                      )}
                      <p>{getSubjectName(item.subject_id)}</p>
                      <p>{pdfService.formatFileSize(item.file_size || 0)}</p>
                    </div>
                    
                    {activeTab === 'novels' && (item as Novel).description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {(item as Novel).description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {item.download_count} downloads
                      </span>
                      
                      {item.pdf_url && (
                        <button
                          onClick={() => handleDownload(item.pdf_url!, item.file_name || item.title, activeTab, item.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}