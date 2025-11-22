import { useState, useEffect } from 'react';
import { adminSubjectService, type SubjectFilters, type SubjectInput } from '../../services/admin-subject-service';
import type { Subject } from '../../integrations/supabase/types';
import { Table } from '../ui/Table';
import { SearchBar } from '../ui/SearchBar';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { showToast } from '../ui/Toast';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

export function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SubjectFilters>({ status: 'all' });
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<SubjectInput>({
    name: '',
    slug: '',
    description: '',
    icon: 'BookOpen',
    color_theme: '#2563EB',
    exam_type: 'BOTH',
    subject_category: 'GENERAL',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchSubjects();
  }, [filters]);

  const fetchSubjects = async () => {
    setLoading(true);
    const fetchedSubjects = await adminSubjectService.getAllSubjects(filters);
    setSubjects(fetchedSubjects);
    setLoading(false);
  };

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search });
  };

  const handleFilterChange = (key: keyof SubjectFilters, value: string) => {
    setFilters({ ...filters, [key]: value as any });
  };

  const handleAdd = () => {
    setSelectedSubject(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: 'BookOpen',
      color_theme: '#2563EB',
      exam_type: 'BOTH',
      subject_category: 'GENERAL',
      is_active: true,
      sort_order: subjects.length,
    });
    setShowModal(true);
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      slug: subject.slug,
      description: subject.description || '',
      icon: subject.icon || 'BookOpen',
      color_theme: subject.color_theme || '#2563EB',
      exam_type: subject.exam_type,
      subject_category: subject.subject_category,
      is_active: subject.is_active,
      sort_order: subject.sort_order,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    let success = false;
    if (selectedSubject) {
      success = await adminSubjectService.updateSubject(selectedSubject.id, formData);
    } else {
      const created = await adminSubjectService.createSubject(formData);
      success = !!created;
    }

    if (success) {
      showToast(selectedSubject ? 'Subject updated successfully' : 'Subject created successfully', 'success');
      setShowModal(false);
      fetchSubjects();
    } else {
      showToast('Failed to save subject', 'error');
    }
  };

  const handleDelete = async () => {
    if (!subjectToDelete) return;

    const success = await adminSubjectService.deleteSubject(subjectToDelete);
    if (success) {
      showToast('Subject deleted successfully', 'success');
      setShowDeleteDialog(false);
      setSubjectToDelete(null);
      fetchSubjects();
    } else {
      showToast('Failed to delete subject. It may have existing topics.', 'error');
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    const success = await adminSubjectService.updateSubject(id, { is_active: !isActive });
    if (success) {
      showToast('Subject status updated successfully', 'success');
      fetchSubjects();
    } else {
      showToast('Failed to update subject status', 'error');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'slug', label: 'Slug', sortable: true },
    {
      key: 'subject_category',
      label: 'Category',
      render: (subject: Subject) => (
        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
          {subject.subject_category}
        </span>
      ),
    },
    {
      key: 'exam_type',
      label: 'Exam Type',
      render: (subject: Subject) => subject.exam_type,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (subject: Subject) => (
        <span className={`px-2 py-1 rounded text-xs ${subject.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {subject.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (subject: Subject) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(subject)} className="p-1 hover:bg-gray-100 rounded" title="Edit">
            <Edit className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={() => handleToggleStatus(subject.id, subject.is_active)}
            className="p-1 hover:bg-gray-100 rounded"
            title={subject.is_active ? 'Deactivate' : 'Activate'}
          >
            {subject.is_active ? <XCircle className="w-4 h-4 text-yellow-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
          </button>
          <button
            onClick={() => {
              setSubjectToDelete(subject.id);
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
        <h2 className="text-2xl font-bold">Subject Management</h2>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SearchBar value={filters.search || ''} onChange={handleSearch} placeholder="Search subjects..." />
        <Select
          value={filters.category || 'all'}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          options={[
            { value: 'all', label: 'All Categories' },
            { value: 'SCIENCE', label: 'Science' },
            { value: 'COMMERCIAL', label: 'Commercial' },
            { value: 'ARTS', label: 'Arts' },
            { value: 'GENERAL', label: 'General' },
            { value: 'LANGUAGE', label: 'Language' },
          ]}
        />
        <Select
          value={filters.examType || 'all'}
          onChange={(e) => handleFilterChange('examType', e.target.value)}
          options={[
            { value: 'all', label: 'All Exam Types' },
            { value: 'JAMB', label: 'JAMB' },
            { value: 'WAEC', label: 'WAEC' },
            { value: 'BOTH', label: 'Both' },
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
        <Table columns={columns} data={subjects} loading={loading} emptyMessage="No subjects found" />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedSubject ? 'Edit Subject' : 'Add Subject'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Mathematics"
          />
          <Input
            label="Slug *"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="e.g., mathematics"
            helperText="URL-friendly identifier (lowercase, no spaces)"
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the subject"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category *"
              value={formData.subject_category}
              onChange={(e) => setFormData({ ...formData, subject_category: e.target.value as any })}
              options={[
                { value: 'SCIENCE', label: 'Science' },
                { value: 'COMMERCIAL', label: 'Commercial' },
                { value: 'ARTS', label: 'Arts' },
                { value: 'GENERAL', label: 'General' },
                { value: 'LANGUAGE', label: 'Language' },
              ]}
            />
            <Select
              label="Exam Type *"
              value={formData.exam_type}
              onChange={(e) => setFormData({ ...formData, exam_type: e.target.value as any })}
              options={[
                { value: 'JAMB', label: 'JAMB' },
                { value: 'WAEC', label: 'WAEC' },
                { value: 'BOTH', label: 'Both' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="e.g., BookOpen"
              helperText="Lucide icon name"
            />
            <Input
              label="Color Theme"
              type="color"
              value={formData.color_theme}
              onChange={(e) => setFormData({ ...formData, color_theme: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium">Active</label>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {selectedSubject ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Subject"
        message="Are you sure you want to delete this subject? This action cannot be undone if there are no topics."
        type="warning"
        confirmText="Delete"
      />
    </div>
  );
}

