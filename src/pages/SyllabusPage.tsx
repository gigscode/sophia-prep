import { useState, useEffect } from 'react';
import { BookOpen, Download, Search, Filter, Calendar, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/layout';
import { pdfService, type Syllabus } from '../services/pdf-service';
import { adminSubjectService } from '../services/admin-subject-service';
import type { Subject } from '../integrations/supabase/types';
import { Select } from '../components/ui/Select';
import { showToast } from '../components/ui/Toast';

export function SyllabusPage() {
  const [syllabus, setSyllabus] = useState<Syllabus[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [syllabusData, subjectsData] = await Promise.all([
        pdfService.getActiveSyllabus(),
        adminSubjectService.getAllSubjects()
      ]);

      setSyllabus(syllabusData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading syllabus:', error);
      showToast('Failed to load syllabus files', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, fileName: string, id: string) => {
    try {
      // Increment download count
      await pdfService.incrementDownloadCount('syllabus', id);
      
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
    return syllabus.filter(item => {
      // Search filter
      const matchesSearch = !searchTerm || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase());

      // Subject filter
      const matchesSubject = !selectedSubject || item.subject_id === selectedSubject;

      // Year filter
      const matchesYear = !selectedYear || item.exam_year?.toString() === selectedYear;

      return matchesSearch && matchesSubject && matchesYear;
    });
  };

  const getSubjectName = (subjectId?: string) => {
    if (!subjectId) return 'General';
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  // Get available years for filter (starting from 2026)
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const startYear = 2026;
    const endYear = Math.max(currentYear + 5, startYear + 10); // Show at least 10 years from 2026
    
    // Generate years from 2026 onwards
    const generatedYears = [];
    for (let year = startYear; year <= endYear; year++) {
      generatedYears.push(year);
    }
    
    // Also include any years from database that are 2026 or later
    const dbYears = syllabus
      .map(item => item.exam_year)
      .filter((year): year is number => year !== null && year !== undefined && year >= startYear);
    
    // Combine and deduplicate
    const allYears = [...new Set([...generatedYears, ...dbYears])];
    return allYears.sort((a, b) => b - a); // Sort descending (newest first)
  };

  const filteredData = getFilteredData();
  const availableYears = getAvailableYears();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Official Syllabus"
        description="Access official JAMB syllabi and curriculum documents"
        icon={<BookOpen className="w-8 h-8" />}
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search syllabus files..."
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

            {/* Year Filter */}
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              options={[
                { value: '', label: 'All Years' },
                ...availableYears.map(year => ({ value: year.toString(), label: year.toString() }))
              ]}
            />

            {/* Results count */}
            <div className="text-sm text-gray-500 flex items-center">
              <Filter className="w-4 h-4 mr-1" />
              {filteredData.length} of {syllabus.length} files
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
              No syllabus files found
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedSubject || selectedYear
                ? 'Try adjusting your search filters'
                : 'No syllabus files are currently available'
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
                  <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-gray-500 mb-3">
                      <p>{getSubjectName(item.subject_id)}</p>
                      {item.exam_year && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Year: {item.exam_year}</span>
                        </div>
                      )}
                      <p>{pdfService.formatFileSize(item.file_size || 0)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {item.download_count} downloads
                      </span>
                      
                      {item.pdf_url && (
                        <button
                          onClick={() => handleDownload(item.pdf_url!, item.file_name || item.title, item.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
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

