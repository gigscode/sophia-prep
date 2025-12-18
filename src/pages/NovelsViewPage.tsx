import { useState, useEffect } from 'react';
import { FileText, Download, Search, Filter, BookOpen, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { pdfService, type Novel } from '../services/pdf-service';
import { adminSubjectService } from '../services/admin-subject-service';
import type { Subject } from '../integrations/supabase/types';
import { Select } from '../components/ui/Select';
import { showToast } from '../components/ui/Toast';

export function NovelsViewPage() {
  const [novels, setNovels] = useState<Novel[]>([]);
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
      const [novelsData, subjectsData] = await Promise.all([
        pdfService.getActiveNovels(),
        adminSubjectService.getAllSubjects()
      ]);

      setNovels(novelsData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading novels:', error);
      showToast('Failed to load novels', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, fileName: string, id: string) => {
    try {
      // Increment download count
      await pdfService.incrementDownloadCount('novels', id);
      
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
    return novels.filter(novel => {
      // Search filter
      const matchesSearch = !searchTerm || 
        novel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        novel.author?.toLowerCase().includes(searchTerm.toLowerCase());

      // Subject filter
      const matchesSubject = !selectedSubject || novel.subject_id === selectedSubject;

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
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">Novels</h1>
          </div>
          <p className="text-xl text-gray-600">
            Access prescribed novels, summaries, themes, and literary analyses
          </p>
        </motion.div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search novels by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              {filteredData.length} of {novels.length} novels
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
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No novels found
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedSubject
                ? 'Try adjusting your search filters'
                : 'No novels are currently available'
              }
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredData.map((novel, index) => (
              <motion.div
                key={novel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {novel.title}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-gray-500 mb-3">
                      {novel.author && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>by {novel.author}</span>
                        </div>
                      )}
                      <p>{getSubjectName(novel.subject_id)}</p>
                      <p>{pdfService.formatFileSize(novel.file_size || 0)}</p>
                    </div>
                    
                    {novel.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {novel.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {novel.download_count} downloads
                      </span>
                      
                      {novel.pdf_url && (
                        <button
                          onClick={() => handleDownload(novel.pdf_url!, novel.file_name || novel.title, novel.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
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