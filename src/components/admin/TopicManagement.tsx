import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Edit, Trash2, Search, X, Check } from 'lucide-react';
import { adminTopicService, type TopicInput } from '../../services/admin-topic-service';
import { adminSubjectService } from '../../services/admin-subject-service';
import type { Topic, Subject } from '../../integrations/supabase/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { showToast } from '../ui/Toast';

export function TopicManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [formData, setFormData] = useState<TopicInput>({
    subject_id: '',
    name: '',
    description: '',
    order_index: 0,
    is_active: true
  });

  // Load subjects on mount
  useEffect(() => {
    const loadSubjects = async () => {
      const subjectsData = await adminSubjectService.getAllSubjects({ status: 'all' });
      setSubjects(subjectsData);
      if (subjectsData.length > 0) {
        setSelectedSubjectId(subjectsData[0].id);
      }
    };
    loadSubjects();
  }, []);

  // Load topics when subject changes
  const loadTopics = useCallback(async () => {
    if (!selectedSubjectId) return;

    setLoading(true);
    try {
      const topicsData = await adminTopicService.getAllTopics(selectedSubjectId);
      setTopics(topicsData);
    } catch (error) {
      console.error('Error loading topics:', error);
      showToast('Failed to load topics', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  // CRUD Handlers
  const handleAddTopic = () => {
    setEditingTopic(null);
    setFormData({
      subject_id: selectedSubjectId,
      name: '',
      description: '',
      order_index: topics.length,
      is_active: true
    });
    setShowModal(true);
  };

  const handleEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({
      subject_id: topic.subject_id,
      name: topic.name,
      description: topic.description || '',
      order_index: topic.order_index,
      is_active: topic.is_active
    });
    setShowModal(true);
  };

  const handleDeleteTopic = async (topic: Topic) => {
    if (!confirm(`Are you sure you want to delete "${topic.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const success = await adminTopicService.deleteTopic(topic.id);
      if (success) {
        showToast('Topic deleted successfully', 'success');
        loadTopics();
      } else {
        showToast('Failed to delete topic', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to delete topic', 'error');
    }
  };

  const handleToggleStatus = async (topic: Topic) => {
    try {
      const success = await adminTopicService.toggleTopicStatus(topic.id, !topic.is_active);
      if (success) {
        showToast(`Topic ${!topic.is_active ? 'activated' : 'deactivated'} successfully`, 'success');
        loadTopics();
      } else {
        showToast('Failed to update topic status', 'error');
      }
    } catch (error) {
      showToast('Failed to update topic status', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Topic name is required', 'error');
      return;
    }

    try {
      if (editingTopic) {
        const success = await adminTopicService.updateTopic(editingTopic.id, formData);
        if (success) {
          showToast('Topic updated successfully', 'success');
          setShowModal(false);
          loadTopics();
        } else {
          showToast('Failed to update topic', 'error');
        }
      } else {
        const newTopic = await adminTopicService.createTopic(formData);
        if (newTopic) {
          showToast('Topic created successfully', 'success');
          setShowModal(false);
          loadTopics();
        } else {
          showToast('Failed to create topic', 'error');
        }
      }
    } catch (error) {
      showToast('An error occurred', 'error');
    }
  };

  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(searchTerm.toLowerCase())
  );



  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Topic Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage topics for each subject
          </p>
        </div>
        <Button variant="primary" onClick={handleAddTopic}>
          <Plus className="w-4 h-4 mr-2" />
          Add Topic
        </Button>
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <Select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              options={subjects.map(subject => ({
                value: subject.id,
                label: subject.name
              }))}
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Topics
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Topics List */}
      {filteredTopics.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No topics found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search criteria' : 'No topics available for this subject'}
          </p>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {selectedSubject?.name} Topics
            </h3>
            <span className="text-sm text-gray-500">
              {filteredTopics.length} topic{filteredTopics.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {filteredTopics.map(topic => (
              <div key={topic.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">{topic.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      topic.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {topic.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {topic.description && (
                    <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Order: {topic.order_index}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    className="p-2"
                    onClick={() => handleToggleStatus(topic)}
                    title={topic.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <Check className={`w-4 h-4 ${topic.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    className="p-2"
                    onClick={() => handleEditTopic(topic)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="p-2 text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteTopic(topic)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{topics.length}</div>
            <div className="text-sm text-gray-600">Total Topics</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {topics.filter(t => t.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Active Topics</div>
          </div>
        </div>
      </Card>

      {/* Add/Edit Topic Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingTopic ? 'Edit Topic' : 'Add New Topic'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <Select
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    options={subjects.map(subject => ({
                      value: subject.id,
                      label: subject.name
                    }))}
                    required
                  />
                </div>

                {/* Topic Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter topic name"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter topic description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                {/* Order Index */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Index
                  </label>
                  <Input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    {editingTopic ? 'Update Topic' : 'Create Topic'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}