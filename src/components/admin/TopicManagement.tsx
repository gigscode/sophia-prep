import { useState, useEffect } from 'react';
import { adminTopicService, type TopicInput } from '../../services/admin-topic-service';
import { adminSubjectService } from '../../services/admin-subject-service';
import type { Topic, Subject } from '../../integrations/supabase/types';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { showToast } from '../ui/Toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

export function TopicManagement() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<TopicInput>({
    subject_id: '',
    name: '',
    description: '',
    order_index: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchSubjects();
    fetchTopics();
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    const fetchedSubjects = await adminSubjectService.getAllSubjects();
    setSubjects(fetchedSubjects);
  };

  const fetchTopics = async () => {
    setLoading(true);
    const fetchedTopics = await adminTopicService.getAllTopics(
      selectedSubject === 'all' ? undefined : selectedSubject
    );
    setTopics(fetchedTopics);
    setLoading(false);
  };

  const handleAdd = () => {
    setSelectedTopic(null);
    setFormData({
      subject_id: selectedSubject === 'all' ? subjects[0]?.id || '' : selectedSubject,
      name: '',
      description: '',
      order_index: topics.length,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (topic: Topic) => {
    setSelectedTopic(topic);
    setFormData({
      subject_id: topic.subject_id,
      name: topic.name,
      description: topic.description || '',
      order_index: topic.order_index,
      is_active: topic.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject_id) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    let success = false;
    if (selectedTopic) {
      success = await adminTopicService.updateTopic(selectedTopic.id, formData);
    } else {
      const created = await adminTopicService.createTopic(formData);
      success = !!created;
    }

    if (success) {
      showToast(selectedTopic ? 'Topic updated successfully' : 'Topic created successfully', 'success');
      setShowModal(false);
      fetchTopics();
    } else {
      showToast('Failed to save topic', 'error');
    }
  };

  const handleDelete = async () => {
    if (!topicToDelete) return;

    const success = await adminTopicService.deleteTopic(topicToDelete);
    if (success) {
      showToast('Topic deleted successfully', 'success');
      setShowDeleteDialog(false);
      setTopicToDelete(null);
      fetchTopics();
    } else {
      showToast('Failed to delete topic. It may have existing questions.', 'error');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'subject_id',
      label: 'Subject',
      render: (topic: Topic) => {
        const subject = subjects.find(s => s.id === topic.subject_id);
        return subject?.name || 'Unknown';
      },
    },
    { key: 'order_index', label: 'Order', sortable: true },
    {
      key: 'is_active',
      label: 'Status',
      render: (topic: Topic) => (
        <span className={`px-2 py-1 rounded text-xs ${topic.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {topic.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (topic: Topic) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(topic)} className="p-1 hover:bg-gray-100 rounded" title="Edit">
            <Edit className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={() => {
              setTopicToDelete(topic.id);
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
        <h2 className="text-2xl font-bold">Topic Management</h2>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Topic
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Select
          label="Filter by Subject"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          options={[
            { value: 'all', label: 'All Subjects' },
            ...subjects.map(s => ({ value: s.id, label: s.name })),
          ]}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={topics} loading={loading} emptyMessage="No topics found" />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedTopic ? 'Edit Topic' : 'Add Topic'}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Subject *"
            value={formData.subject_id}
            onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
            options={subjects.map(s => ({ value: s.id, label: s.name }))}
          />
          <Input
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Algebra"
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the topic"
          />
          <Input
            label="Order Index"
            type="number"
            value={formData.order_index}
            onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
          />
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
              {selectedTopic ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Topic"
        message="Are you sure you want to delete this topic? This action cannot be undone if there are no questions."
        type="warning"
        confirmText="Delete"
      />
    </div>
  );
}

