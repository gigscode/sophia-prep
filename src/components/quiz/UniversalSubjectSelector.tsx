import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, AlertCircle, Info, TrendingUp } from 'lucide-react';
import { updatedSubjectService } from '../../services/updated-subject-service';
import { universalValidationService } from '../../services/universal-validation-service';
import type { SubjectWithDetails, ExamTypeRecord } from '../../types/database';
import type { JAMBValidationResult } from '../../services/jamb-validation-service';
import type { WAECValidationResult } from '../../services/waec-validation-service';
import type { UniversalValidationResult } from '../../services/universal-validation-service';
import * as LucideIcons from 'lucide-react';

interface UniversalSubjectSelectorProps {
  examType: ExamTypeRecord;
  selectedSubjects: string[];
  onSubjectsChange: (subjects: string[]) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

interface SubjectsByCategory {
  [categorySlug: string]: {
    categoryName: string;
    categoryColor?: string;
    subjects: SubjectWithDetails[];
  };
}

export function UniversalSubjectSelector({
  examType,
  selectedSubjects,
  onSubjectsChange,
  onValidationChange
}: UniversalSubjectSelectorProps) {
  const [subjects, setSubjects] = useState<SubjectWithDetails[]>([]);
  const [subjectsByCategory, setSubjectsByCategory] = useState<SubjectsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [jambValidation, setJambValidation] = useState<JAMBValidationResult | null>(null);
  const [waecValidation, setWaecValidation] = useState<WAECValidationResult | null>(null);
  const [universalValidation, setUniversalValidation] = useState<UniversalValidationResult | null>(null);
  const [realTimeStatus, setRealTimeStatus] = useState<{
    status: 'incomplete' | 'invalid' | 'valid';
    message: string;
    progress: number;
    nextStep?: string;
    categoryBalance?: string;
  } | null>(null);

  useEffect(() => {
    loadSubjects();
  }, [examType]);

  useEffect(() => {
    validateSelection();
  }, [selectedSubjects, subjects, examType]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const subjectsData = await updatedSubjectService.getSubjectsByExamType(examType.slug);
      setSubjects(subjectsData);
      
      // Group subjects by category
      const grouped: SubjectsByCategory = {};
      subjectsData.forEach(subject => {
        const categorySlug = subject.category_slug || 'general';
        const categoryName = subject.category_name || 'General';
        const categoryColor = subject.category_color;
        
        if (!grouped[categorySlug]) {
          grouped[categorySlug] = {
            categoryName,
            categoryColor,
            subjects: []
          };
        }
        grouped[categorySlug].subjects.push(subject);
      });
      
      setSubjectsByCategory(grouped);
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setError('Failed to load subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateSelection = async () => {
    // Use universal validation service for all exam types
    const universalResult = await universalValidationService.validateSubjectSelection(
      examType,
      selectedSubjects,
      subjects
    );
    
    setUniversalValidation(universalResult);
    setRealTimeStatus(universalResult.realTimeStatus);
    
    // Set specific validation results for detailed feedback
    const isJAMB = examType.slug.toLowerCase() === 'jamb';
    const isWAEC = examType.slug.toLowerCase() === 'waec';
    
    if (isJAMB && universalResult.validationDetails) {
      setJambValidation(universalResult.validationDetails as JAMBValidationResult);
    } else if (isWAEC && universalResult.validationDetails) {
      setWaecValidation(universalResult.validationDetails as WAECValidationResult);
    }
    
    // Combine all error types for display
    const allErrors = [
      ...universalResult.errors,
      ...universalResult.warnings
    ];
    
    setValidationErrors(allErrors);
    onValidationChange?.(universalResult.isValid, allErrors);
  };

  const toggleSubject = (subjectId: string) => {
    const newSelection = selectedSubjects.includes(subjectId)
      ? selectedSubjects.filter(id => id !== subjectId)
      : [...selectedSubjects, subjectId];
    
    onSubjectsChange(newSelection);
  };

  const getSubjectIcon = (subject: SubjectWithDetails) => {
    if (!subject.icon) return BookOpen;
    
    const lookup = (name: string) => {
      if ((LucideIcons as any)[name]) return (LucideIcons as any)[name];
      const pascal = name.split(/[-_\s]+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
      if ((LucideIcons as any)[pascal]) return (LucideIcons as any)[pascal];
      const capFirst = name.charAt(0).toUpperCase() + name.slice(1);
      if ((LucideIcons as any)[capFirst]) return (LucideIcons as any)[capFirst];
      return null;
    };

    return lookup(subject.icon) || BookOpen;
  };

  const getCategoryColor = (categorySlug: string) => {
    switch (categorySlug.toLowerCase()) {
      case 'science':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'commercial':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'arts':
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'language':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getExamTypeRequirements = () => {
    // Use universal validation service to get requirements
    return universalValidationService.getValidationRequirements(examType);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subjects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold text-lg mb-4">{error}</p>
          <button
            onClick={loadSubjects}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const requirements = getExamTypeRequirements();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Select Subjects</h2>
        <p className="text-gray-600 mb-4">{requirements.description}</p>
        
        {/* Requirements Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">{requirements.title}</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                {requirements.requirements.map((req, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Universal Validation Feedback */}
        {universalValidation && (
          <div className={`border rounded-lg p-4 mb-4 ${
            universalValidation.isValid 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {universalValidation.isValid ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${
                  universalValidation.isValid ? 'text-green-900' : 'text-red-900'
                }`}>
                  {universalValidation.examType} Validation
                </h3>
                <p className={`text-sm mb-2 ${
                  universalValidation.isValid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {universalValidation.message}
                </p>
                
                {universalValidation.errors.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-red-800 mb-1">Errors:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {universalValidation.errors.map((error, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {universalValidation.warnings.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-orange-800 mb-1">Warnings:</p>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {universalValidation.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {universalValidation.suggestions.length > 0 && (
                  <div>
                    <p className={`text-sm font-medium mb-1 ${
                      universalValidation.isValid ? 'text-green-800' : 'text-blue-800'
                    }`}>
                      Suggestions:
                    </p>
                    <ul className={`text-sm space-y-1 ${
                      universalValidation.isValid ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {universalValidation.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                            universalValidation.isValid ? 'bg-green-600' : 'bg-blue-600'
                          }`}></div>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Real-time Status */}
        {realTimeStatus && (
          <div className={`border rounded-lg p-4 mb-4 ${
            realTimeStatus.status === 'valid' 
              ? 'bg-green-50 border-green-200' 
              : realTimeStatus.status === 'invalid'
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {realTimeStatus.status === 'valid' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {realTimeStatus.status === 'invalid' && <AlertCircle className="w-5 h-5 text-red-600" />}
                {realTimeStatus.status === 'incomplete' && <TrendingUp className="w-5 h-5 text-blue-600" />}
                <span className={`font-medium ${
                  realTimeStatus.status === 'valid' 
                    ? 'text-green-800' 
                    : realTimeStatus.status === 'invalid'
                      ? 'text-red-800'
                      : 'text-blue-800'
                }`}>
                  {realTimeStatus.message}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-600">
                {Math.round(realTimeStatus.progress)}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  realTimeStatus.status === 'valid' 
                    ? 'bg-green-500' 
                    : realTimeStatus.status === 'invalid'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                }`}
                style={{ width: `${realTimeStatus.progress}%` }}
              />
            </div>
            
            {realTimeStatus.nextStep && (
              <p className={`text-sm ${
                realTimeStatus.status === 'valid' 
                  ? 'text-green-700' 
                  : realTimeStatus.status === 'invalid'
                    ? 'text-red-700'
                    : 'text-blue-700'
              }`}>
                Next: {realTimeStatus.nextStep}
              </p>
            )}
          </div>
        )}

        {/* JAMB Specific Feedback */}
        {jambValidation && examType.slug.toLowerCase() === 'jamb' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-900 mb-2">JAMB Selection Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-blue-800">Subject Count:</span>
                <span className={`font-medium ${jambValidation.subjectCount === 4 ? 'text-green-600' : 'text-orange-600'}`}>
                  {jambValidation.subjectCount}/4
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-800">English Included:</span>
                <span className={`font-medium ${jambValidation.hasEnglish ? 'text-green-600' : 'text-red-600'}`}>
                  {jambValidation.hasEnglish ? 'Yes ✓' : 'No ✗'}
                </span>
              </div>
              {jambValidation.suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-blue-800 font-medium mb-1">Suggestions:</p>
                  <ul className="text-blue-700 space-y-1">
                    {jambValidation.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WAEC Specific Feedback */}
        {waecValidation && examType.slug.toLowerCase() === 'waec' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-green-900 mb-2">WAEC Selection Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-green-800">Subject Count:</span>
                <span className={`font-medium ${
                  waecValidation.subjectCount >= 6 && waecValidation.subjectCount <= 9 
                    ? 'text-green-600' 
                    : 'text-orange-600'
                }`}>
                  {waecValidation.subjectCount} (6-9 allowed)
                </span>
              </div>
              
              {Object.keys(waecValidation.categoryDistribution).length > 0 && (
                <div>
                  <span className="text-green-800">Category Distribution:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {Object.entries(waecValidation.categoryDistribution).map(([category, count]) => (
                      <span key={category} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {category}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {realTimeStatus?.categoryBalance && (
                <div className="flex items-center justify-between">
                  <span className="text-green-800">Balance:</span>
                  <span className="text-green-700 text-sm">{realTimeStatus.categoryBalance}</span>
                </div>
              )}
              
              {waecValidation.suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-green-800 font-medium mb-1">Suggestions:</p>
                  <ul className="text-green-700 space-y-1">
                    {waecValidation.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selection Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">
              Selected: {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''}
            </span>
            {validationErrors.length === 0 && selectedSubjects.length > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Valid Selection</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subjects by Category */}
      <div className="space-y-6">
        {Object.entries(subjectsByCategory).map(([categorySlug, categoryData]) => (
          <div key={categorySlug} className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-gray-900">
                {categoryData.categoryName}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(categorySlug)}`}>
                {categoryData.subjects.length} subject{categoryData.subjects.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryData.subjects.map((subject) => {
                const isSelected = selectedSubjects.includes(subject.id);
                const isMandatory = subject.is_mandatory;
                const IconComponent = getSubjectIcon(subject);
                
                return (
                  <button
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    disabled={isMandatory && isSelected}
                    className={`
                      p-4 border-2 rounded-lg transition-all text-left hover:shadow-md
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      }
                      ${isMandatory && isSelected ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: subject.color_theme || '#6B7280' }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {subject.name}
                          </h4>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          {isMandatory && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded">
                              Mandatory
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {subject.category_name}
                          </span>
                        </div>
                        
                        {subject.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {subject.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(subjectsByCategory).length === 0 && (
        <div className="text-center py-8">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No subjects available for {examType.name}.</p>
          <button
            onClick={loadSubjects}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}