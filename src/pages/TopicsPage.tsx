import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, BarChart3, Play, Search, Filter } from 'lucide-react';
import { topicsService, Topic, TopicCategory } from '../services/topics-service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function TopicsPage() {
  const { subjectSlug } = useParams<{ subjectSlug: string }>();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState<TopicCategory[]>([]);
  const [topicsByCategory, setTopicsByCategory] = useState<Record<string, Topic[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    if (subjectSlug) {
      loadTopics();
    }
  }, [subjectSlug]);

  const loadTopics = async () => {
    if (!subjectSlug) return;
    
    setLoading(true);
    try {
      const [categoriesData, topicsData] = await Promise.all([
        topicsService.getTopicCategories(subjectSlug),
        topicsService.getTopicsByCategory(subjectSlug)
      ]);
      
      setCategories(categoriesData);
      setTopicsByCategory(topicsData);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTopicsByCategory = () => {
    const filtered: Record<string, Topic[]> = {};
    
    Object.entries(topicsByCategory).forEach(([categorySlug, topics]) => {
      // Filter by category
      if (selectedCategory !== 'all' && categorySlug !== selectedCategory) {
        return;
      }
      
      // Filter by search term and difficulty
      const filteredTopics = topics.filter(topic => {
        const matchesSearch = topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            topic.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDifficulty = selectedDifficulty === 'all' || 
                                topic.difficulty_level === selectedDifficulty;
        
        return matchesSearch && matchesDifficulty;
      });
      
      if (filteredTopics.length > 0) {
        filtered[categorySlug] = filteredTopics;
      }
    });
    
    return filtered;
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'BASIC': return 'text-green-600 bg-green-50';
      case 'INTERMEDIATE': return 'text-yellow-600 bg-yellow-50';
      case 'ADVANCED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleTopicClick = (topic: Topic) => {
    // Navigate to practice mode with this specific topic
    navigate(`/practice?subject=${subjectSlug}&topic=${topic.slug}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const filteredData = filteredTopicsByCategory();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {subjectSlug?.charAt(0).toUpperCase() + subjectSlug?.slice(1)} Topics
        </h1>
        <p className="text-gray-600">
          Choose a topic to start practicing questions
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </Select>

          {/* Difficulty Filter */}
          <Select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="all">All Difficulties</option>
            <option value="BASIC">Basic</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </Select>
        </div>
      </Card>

      {/* Topics by Category */}
      {Object.keys(filteredData).length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No topics found</h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(filteredData).map(([categorySlug, topics]) => {
            const category = categories.find(c => c.slug === categorySlug);
            
            return (
              <div key={categorySlug}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category?.color_theme || '#3B82F6' }}
                  />
                  <h2 className="text-2xl font-bold text-gray-900">
                    {category?.name || 'Uncategorized'}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {topics.length} topic{topics.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {category?.description && (
                  <p className="text-gray-600 mb-6">{category.description}</p>
                )}

                {/* Topics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {topics.map(topic => (
                    <Card 
                      key={topic.id}
                      className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleTopicClick(topic)}
                    >
                      {/* Topic Header */}
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 leading-tight">
                          {topic.name}
                        </h3>
                        {topic.difficulty_level && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(topic.difficulty_level)}`}>
                            {topic.difficulty_level.toLowerCase()}
                          </span>
                        )}
                      </div>

                      {/* Topic Description */}
                      {topic.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {topic.description}
                        </p>
                      )}

                      {/* Topic Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{topic.estimated_study_time_minutes}min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          <span>{topic.estimated_questions_count || 0} questions</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button 
                        variant="primary" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTopicClick(topic);
                        }}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Practice
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}