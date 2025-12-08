import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminQuestionService, type QuestionFilters, type QuestionInput } from '../../services/admin-question-service';
import { adminSubjectService } from '../../services/admin-subject-service';
import { adminTopicService } from '../../services/admin-topic-service';
import type { Question, Subject, Topic } from '../../integrations/supabase/types';
import { Table } from '../ui/Table';
import { Pagination } from '../ui/Pagination';
import { SearchBar } from '../ui/SearchBar';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Modal } from '../ui/Modal';
import { showToast } from '../ui/Toast';
import { Upload, Trash2, Plus, Edit } from 'lucide-react';
import { QuestionForm } from './QuestionForm';

// Extended question type with subject and topic names for display
type QuestionWithDetails = Question & {
  subject_name?: string;
  topic_name?: string;
};

export function QuestionManagement() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<QuestionFilters>({ status: 'all' });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    bySubject: Record<string, number>;
    byExamType: Record<string, number>;
    byYear: Record<number, number>;
  } | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const itemsPerPage = 50;

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const { questions: fetchedQuestions, total: fetchedTotal } = await adminQuestionService.getAllQuestions(
      filters,
      currentPage,
      itemsPerPage
    );
    
    // Enrich questions with subject and topic names
    const enrichedQuestions: QuestionWithDetails[] = fetchedQuestions.map(q => {
      const subject = subjects.find(s => s.id === q.subject_id);
      const topic = topics.find(t => t.id === q.topic_id);
      return {
        ...q,
        subject_name: subject?.name,
        topic_name: topic?.name
      };
    });
    
    setQuestions(enrichedQuestions);
    setTotal(fetchedTotal);
    setLoading(false);
  }, [filters, currentPage, itemsPerPage, subjects, topics]);

  const fetchStats = useCallback(async () => {
    const statistics = await adminQuestionService.getQuestionStatistics();
    setStats(statistics);
  }, []);

  const fetchSubjectsAndTopics = useCallback(async () => {
    const [fetchedSubjects, fetchedTopics] = await Promise.all([
      adminSubjectService.getAllSubjects(),
      adminTopicService.getAllTopics()
    ]);
    setSubjects(fetchedSubjects);
    setTopics(fetchedTopics);
  }, []);

  useEffect(() => {
    fetchSubjectsAndTopics();
  }, [fetchSubjectsAndTopics]);

  useEffect(() => {
    if (subjects.length > 0 || topics.length > 0) {
      fetchQuestions();
      fetchStats();
    }
  }, [fetchQuestions, fetchStats, subjects.length, topics.length]);

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search });
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof QuestionFilters, value: string) => {
    const newFilters = { ...filters };
    if (key === 'examType') {
      newFilters[key] = value === 'all' ? 'all' : value as 'JAMB' | 'WAEC';
    } else if (key === 'status') {
      newFilters[key] = value === 'all' ? 'all' : value as 'active' | 'inactive';
    } else if (key === 'year') {
      newFilters[key] = value === 'all' ? 'all' : parseInt(value);
    } else if (key === 'subjectId') {
      newFilters[key] = value === 'all' ? undefined : value;
    } else {
      newFilters[key] = value;
    }
    setFilters(newFilters);
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
    navigate('/admin/import-questions');
  };

  const handleCreate = () => {
    setEditingQuestion(null);
    setShowFormModal(true);
  };

  const handleEdit = async (questionId: string) => {
    const question = await adminQuestionService.getQuestionById(questionId);
    if (question) {
      setEditingQuestion(question);
      setShowFormModal(true);
    } else {
      showToast('Failed to load question', 'error');
    }
  };

  const handleFormSubmit = async (data: QuestionInput) => {
    setIsSubmitting(true);
    try {
      if (editingQuestion) {
        // Update existing question
        const success = await adminQuestionService.updateQuestion(editingQuestion.id, data);
        if (success) {
          showToast('Question updated successfully', 'success');
          setShowFormModal(false);
          setEditingQuestion(null);
          fetchQuestions();
          fetchStats();
        } else {
          showToast('Failed to update question', 'error');
        }
      } else {
        // Create new question
        const created = await adminQuestionService.createQuestion(data);
        if (created) {
          showToast('Question created successfully', 'success');
          setShowFormModal(false);
          fetchQuestions();
          fetchStats();
        } else {
          showToast('Failed to create question', 'error');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setShowFormModal(false);
    setEditingQuestion(null);
  };

  const columns = [
    {
      key: 'question_text',
      label: 'Question',
      render: (q: QuestionWithDetails) => (
        <div className="max-w-md truncate" title={q.question_text}>
          {q.question_text}
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (q: QuestionWithDetails) => (
        <div className="text-sm">
          <div className="font-medium">{q.subject_name || 'N/A'}</div>
          {q.topic_name && (
            <div className="text-gray-500 text-xs">{q.topic_name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'exam_type',
      label: 'Exam Type',
      render: (q: QuestionWithDetails) => q.exam_type || 'N/A',
    },
    {
      key: 'exam_year',
      label: 'Year',
      render: (q: QuestionWithDetails) => q.exam_year || 'N/A',
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (q: QuestionWithDetails) => (
        <span className={`px-2 py-1 rounded text-xs ${q.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {q.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (q: QuestionWithDetails) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(q.id)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-blue-600" />
          </button>
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
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Question Management</h2>
        <div className="flex space-x-2">
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Question
          </Button>
          <Button onClick={handleImport} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import Questions
          </Button>
        </div>
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
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <SearchBar value={filters.search || ''} onChange={handleSearch} placeholder="Search questions..." className="md:col-span-2" />
        <Select
          value={filters.subjectId || 'all'}
          onChange={(e) => handleFilterChange('subjectId', e.target.value)}
          options={[
            { value: 'all', label: 'All Subjects' },
            ...subjects.map(s => ({ value: s.id, label: s.name }))
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={handleFormCancel}
        title={editingQuestion ? 'Edit Question' : 'Create New Question'}
        size="xl"
      >
        <QuestionForm
          question={editingQuestion}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isSubmitting={isSubmitting}
        />
      </Modal>

    </div>
  );
}
