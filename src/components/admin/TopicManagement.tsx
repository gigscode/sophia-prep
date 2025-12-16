import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Edit, Trash2, Search } from 'lucide-react';
import { topicsService, Topic, TopicCategory } from '../../services/topics-service';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { showToast } from '../ui/Toast';

export function TopicManagement() {
  const [subjects] = useState([
    { id: '1', name: 'Physics', slug: 'physics' },
    { id: '2', name: 'Mathematics', slug: 'mathematics' },
    { id: '3', name: 'Chemistry', slug: 'chemistry' },
    { id: '4', name: 'Biology', slug: 'biology' }
  ]);
  
  const [selectedSubject, setSelectedSubject] = useState('physics');
  const [categories, setCategories] = useState<TopicCategory[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadTopicsData = useCallback(async () => {
    setLoading(true);
    try {
      const [categoriesData, topicsData] = await Promise.all([
        topicsService.getTopicCategories(selectedSubject),
        topicsService.getTopics(selectedSubject)
      ]);
      
      setCategories(categoriesData);
      setTopics(topicsData);
    } catch (error) {
      console.error('Error loading topics data:', error);
      showToast('Failed to load topics data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedSubject) {
      loadTopicsData();
    }
  }, [selectedSubject, loadTopicsData]);

  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTopicsByCategory = () => {
    const grouped: Record<string, Topic[]> = {};
    
    filteredTopics.forEach(topic => {
      const categoryName = topic.category?.name || 'Uncategorized';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(topic);
    });
    
    return grouped;
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const topicsByCategory = getTopicsByCategory();

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
            Manage topics and categories for each subject
          </p>
        </div>
        <Button variant="primary">
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
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              options={subjects.map(subject => ({
                value: subject.slug,
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

      {/* Categories Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Categories Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(category => (
            <div key={category.id} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color_theme }}
                />
                <h4 className="font-medium">{category.name}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">{category.description}</p>
              <p className="text-xs text-gray-500">
                {topics.filter(t => t.category?.id === category.id).length} topics
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Topics by Category */}
      {Object.keys(topicsByCategory).length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No topics found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search criteria' : 'No topics available for this subject'}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(topicsByCategory).map(([categoryName, categoryTopics]) => (
            <Card key={categoryName} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{categoryName}</h3>
                <span className="text-sm text-gray-500">
                  {categoryTopics.length} topic{categoryTopics.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-3">
                {categoryTopics.map(topic => (
                  <div key={topic.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{topic.name}</h4>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{topic.estimated_study_time_minutes}min study time</span>
                        <span>{topic.estimated_questions_count || 0} questions</span>
                        <span>Order: {topic.sort_order}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" className="p-2">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" className="p-2 text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{topics.length}</div>
            <div className="text-sm text-gray-600">Total Topics</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {topics.reduce((sum, topic) => sum + (topic.estimated_questions_count || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Questions</div>
          </div>
        </div>
      </Card>
    </div>
  );
}