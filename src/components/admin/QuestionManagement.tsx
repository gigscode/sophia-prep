import { useState, useEffect } from 'react';
import { adminQuestionService, type QuestionFilters } from '../../services/admin-question-service';
import type { Question } from '../../integrations/supabase/types';
import { Table } from '../ui/Table';
import { Pagination } from '../ui/Pagination';
import { SearchBar } from '../ui/SearchBar';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { showToast } from '../ui/Toast';
import { Upload, Trash2, BarChart3 } from 'lucide-react';

export function QuestionManagement() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<QuestionFilters>({ status: 'all' });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const itemsPerPage = 50;

  useEffect(() => {
    fetchQuestions();
    fetchStats();
  }, [currentPage, filters]);

  const fetchQuestions = async () => {
    setLoading(true);
    const { questions: fetchedQuestions, total: fetchedTotal } = await adminQuestionService.getAllQuestions(
      filters,
      currentPage,
      itemsPerPage
    );
    setQuestions(fetchedQuestions);
    setTotal(fetchedTotal);
    setLoading(false);
  };

  const fetchStats = async () => {
    const statistics = await adminQuestionService.getQuestionStatistics();
    setStats(statistics);
  };

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search });
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof QuestionFilters, value: string) => {
    setFilters({ ...filters, [key]: value as any });
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!questionToDelete) return;

    const success = await adminQuestionService.deleteQuestion(questionToDelete);
    if (success) {
      showToast('Question deleted successfully', 'success');
      setShowDeleteDialog(false);
      setQuestionToDelete(null);
      fetchQuestions();
      fetchStats();
    } else {
      showToast('Failed to delete question', 'error');
    }
  };

  const handleImport = () => {
    showToast('Import functionality coming soon. Use server-side import for now.', 'info');
  };

  const columns = [
    {
      key: 'question_text',
      label: 'Question',
      render: (q: Question) => (
        <div className="max-w-md truncate" title={q.question_text}>
          {q.question_text}
        </div>
      ),
    },
    {
      key: 'difficulty_level',
      label: 'Difficulty',
      render: (q: Question) => (
        <span className={`px-2 py-1 rounded text-xs ${
          q.difficulty_level === 'EASY' ? 'bg-green-100 text-green-800' :
          q.difficulty_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {q.difficulty_level || 'N/A'}
        </span>
      ),
    },
    {
      key: 'exam_type',
      label: 'Exam Type',
      render: (q: Question) => q.exam_type || 'N/A',
    },
    {
      key: 'exam_year',
      label: 'Year',
      render: (q: Question) => q.exam_year || 'N/A',
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (q: Question) => (
        <span className={`px-2 py-1 rounded text-xs ${q.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {q.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (q: Question) => (
        <button
          onClick={() => {
            setQuestionToDelete(q.id);
            setShowDeleteDialog(true);
          }}
          className="p-1 hover:bg-gray-100 rounded"
          title="Delete"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Question Management</h2>
        <Button onClick={handleImport} variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Import Questions
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Questions</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">JAMB Questions</div>
            <div className="text-2xl font-bold">{stats.byExamType.JAMB || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">WAEC Questions</div>
            <div className="text-2xl font-bold">{stats.byExamType.WAEC || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Easy Questions</div>
            <div className="text-2xl font-bold">{stats.byDifficulty.EASY || 0}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SearchBar value={filters.search || ''} onChange={handleSearch} placeholder="Search questions..." className="md:col-span-2" />
        <Select
          value={filters.difficulty || 'all'}
          onChange={(e) => handleFilterChange('difficulty', e.target.value)}
          options={[
            { value: 'all', label: 'All Difficulties' },
            { value: 'EASY', label: 'Easy' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'HARD', label: 'Hard' },
          ]}
        />
        <Select
          value={filters.examType || 'all'}
          onChange={(e) => handleFilterChange('examType', e.target.value)}
          options={[
            { value: 'all', label: 'All Exam Types' },
            { value: 'JAMB', label: 'JAMB' },
            { value: 'WAEC', label: 'WAEC' },
          ]}
        />
        <Select
          value={filters.status || 'all'}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={questions} loading={loading} emptyMessage="No questions found" />
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(total / itemsPerPage)}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={total}
        />
      </div>

      {/* Delete Dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        type="warning"
        confirmText="Delete"
      />
    </div>
  );
}

