import { useState, useEffect } from 'react';
import { subjectCombinationService } from '../services/subject-combination-service';
import type { ExamType, CombinationType, Subject } from '../integrations/supabase/types';
import { subjectService } from '../services/subject-service';
import * as LucideIcons from 'lucide-react';
import { BookOpen } from 'lucide-react';

interface SubjectSelectionWizardProps {
  userId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function SubjectSelectionWizard({ userId, onComplete, onCancel }: SubjectSelectionWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [combinationType, setCombinationType] = useState<CombinationType | null>(null);
  const [mandatorySubjects, setMandatorySubjects] = useState<Subject[]>([]);
  const [optionalSubjects, setOptionalSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [languageSubjects, setLanguageSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (step === 2 && examType && combinationType) {
      loadSubjects();
    }
  }, [step, examType, combinationType]);

  useEffect(() => {
    loadLanguageSubjects();
  }, []);

  const loadSubjects = async () => {
    if (!examType || !combinationType) return;

    try {
      setLoading(true);
      setError(null);
      const { mandatory, optional } = await subjectCombinationService.getSubjectsForCombination(
        combinationType,
        examType
      );
      setMandatorySubjects(mandatory);
      setOptionalSubjects(optional);
      
      // Pre-select mandatory subjects
      setSelectedSubjects(mandatory.map(s => s.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const loadLanguageSubjects = async () => {
    try {
      const languages = await subjectService.getLanguageSubjects();
      setLanguageSubjects(languages);
    } catch (err) {
      console.error('Failed to load language subjects:', err);
    }
  };

  const handleExamTypeSelect = (type: ExamType) => {
    setExamType(type);
    setStep(2);
  };

  const handleCombinationTypeSelect = (type: CombinationType) => {
    setCombinationType(type);
  };

  const toggleSubject = (subjectId: string, isMandatory: boolean) => {
    if (isMandatory) return; // Cannot deselect mandatory subjects

    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  const handleSave = async () => {
    if (!examType || !combinationType) return;

    try {
      setSaving(true);
      setError(null);

      await subjectCombinationService.saveUserCombination(
        userId,
        examType,
        combinationType,
        selectedSubjects
      );

      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save combination');
    } finally {
      setSaving(false);
    }
  };

  const canProceedToStep3 = () => {
    if (examType === 'JAMB') {
      return selectedSubjects.length === 4;
    }
    return selectedSubjects.length >= 1; // WAEC requires at least English
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              1. Exam Type
            </span>
            <span className={`text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              2. Combination
            </span>
            <span className={`text-sm font-medium ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              3. Subjects
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Exam Type Selection */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Select Your Exam Type</h2>
            <p className="text-gray-600 mb-6">
              Choose the examination you're preparing for
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleExamTypeSelect('JAMB')}
                className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left"
              >
                <h3 className="text-xl font-semibold mb-2">JAMB</h3>
                <p className="text-gray-600 text-sm">
                  Joint Admissions and Matriculation Board - University entrance exam
                </p>
                <p className="text-sm text-blue-600 mt-2">4 subjects required</p>
              </button>
              <button
                onClick={() => handleExamTypeSelect('WAEC')}
                className="p-6 border-2 border-gray-300 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all text-left"
              >
                <h3 className="text-xl font-semibold mb-2">WAEC</h3>
                <p className="text-gray-600 text-sm">
                  West African Examinations Council - Secondary school leaving exam
                </p>
                <p className="text-sm text-green-600 mt-2">Up to 9 subjects</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Combination Type Selection */}
        {step === 2 && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="mb-4 text-blue-600 hover:text-blue-700"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold mb-4">Select Your Combination</h2>
            <p className="text-gray-600 mb-6">
              Choose the subject combination that matches your career path
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => handleCombinationTypeSelect('SCIENCE')}
                className={`p-6 border-2 rounded-lg transition-all text-left ${
                  combinationType === 'SCIENCE'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-600 hover:bg-blue-50'
                }`}
              >
                <h3 className="text-lg font-semibold mb-2">Science</h3>
                <p className="text-sm text-gray-600">
                  Physics, Chemistry, Biology, Mathematics
                </p>
              </button>
              <button
                onClick={() => handleCombinationTypeSelect('COMMERCIAL')}
                className={`p-6 border-2 rounded-lg transition-all text-left ${
                  combinationType === 'COMMERCIAL'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-600 hover:bg-blue-50'
                }`}
              >
                <h3 className="text-lg font-semibold mb-2">Commercial</h3>
                <p className="text-sm text-gray-600">
                  Commerce, Accounting, Economics
                </p>
              </button>
              <button
                onClick={() => handleCombinationTypeSelect('ARTS')}
                className={`p-6 border-2 rounded-lg transition-all text-left ${
                  combinationType === 'ARTS'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-600 hover:bg-blue-50'
                }`}
              >
                <h3 className="text-lg font-semibold mb-2">Arts</h3>
                <p className="text-sm text-gray-600">
                  Literature, Government, CRS/IRS
                </p>
              </button>
            </div>
            {combinationType && (
              <button
                onClick={() => setStep(3)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue to Subject Selection
              </button>
            )}
          </div>
        )}

        {/* Step 3: Subject Selection */}
        {step === 3 && (
          <div>
            <button
              onClick={() => setStep(2)}
              className="mb-4 text-blue-600 hover:text-blue-700"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold mb-4">Select Your Subjects</h2>
            
            {loading ? (
              <div className="text-center py-8">Loading subjects...</div>
            ) : error ? (
              <div className="text-red-600 mb-4">{error}</div>
            ) : (
              <>
                {/* Mandatory Subjects */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Mandatory Subjects</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mandatorySubjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="p-4 border-2 border-blue-600 bg-blue-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded flex items-center justify-center text-white"
                              style={{ backgroundColor: subject.color_theme }}
                            >
                              {(() => {
                                const lookup = (name?: string) => {
                                  if (!name) return null;
                                  if ((LucideIcons as any)[name]) return (LucideIcons as any)[name];
                                  const pascal = name.split(/[-_\s]+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
                                  if ((LucideIcons as any)[pascal]) return (LucideIcons as any)[pascal];
                                  const capFirst = name.charAt(0).toUpperCase() + name.slice(1);
                                  if ((LucideIcons as any)[capFirst]) return (LucideIcons as any)[capFirst];
                                  return null;
                                };

                                const IconComp = lookup(subject.icon) || BookOpen;
                                return <IconComp className="w-5 h-5" />;
                              })()}
                            </div>
                          <div>
                            <div className="font-medium">{subject.name}</div>
                            <div className="text-xs text-gray-600">Required</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Subjects */}
                {optionalSubjects.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Optional Subjects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {optionalSubjects.map((subject) => {
                        const isSelected = selectedSubjects.includes(subject.id);
                        return (
                          <button
                            key={subject.id}
                            onClick={() => toggleSubject(subject.id, false)}
                            className={`p-4 border-2 rounded-lg transition-all text-left ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-300 hover:border-blue-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded flex items-center justify-center text-white"
                                style={{ backgroundColor: subject.color_theme }}
                              >
                                {(() => {
                                  const lookup = (name?: string) => {
                                    if (!name) return null;
                                    if ((LucideIcons as any)[name]) return (LucideIcons as any)[name];
                                    const pascal = name.split(/[-_\s]+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
                                    if ((LucideIcons as any)[pascal]) return (LucideIcons as any)[pascal];
                                    const capFirst = name.charAt(0).toUpperCase() + name.slice(1);
                                    if ((LucideIcons as any)[capFirst]) return (LucideIcons as any)[capFirst];
                                    return null;
                                  };

                                  const IconComp = lookup(subject.icon) || BookOpen;
                                  return <IconComp className="w-5 h-5" />;
                                })()}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{subject.name}</div>
                                <div className="text-xs text-gray-600">
                                  {isSelected ? 'Selected' : 'Click to select'}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="text-blue-600">✓</div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Nigerian Languages */}
                {languageSubjects.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Nigerian Languages (Optional)</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Available for all combinations
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {languageSubjects.map((subject) => {
                        const isSelected = selectedSubjects.includes(subject.id);
                        return (
                          <button
                            key={subject.id}
                            onClick={() => toggleSubject(subject.id, false)}
                            className={`p-4 border-2 rounded-lg transition-all text-left ${
                              isSelected
                                ? 'border-green-600 bg-green-50'
                                : 'border-gray-300 hover:border-green-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded flex items-center justify-center text-white"
                                style={{ backgroundColor: subject.color_theme }}
                              >
                                {(() => {
                                  const lookup = (name?: string) => {
                                    if (!name) return null;
                                    if ((LucideIcons as any)[name]) return (LucideIcons as any)[name];
                                    const pascal = name.split(/[-_\s]+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
                                    if ((LucideIcons as any)[pascal]) return (LucideIcons as any)[pascal];
                                    const capFirst = name.charAt(0).toUpperCase() + name.slice(1);
                                    if ((LucideIcons as any)[capFirst]) return (LucideIcons as any)[capFirst];
                                    return null;
                                  };

                                  const IconComp = lookup(subject.icon) || BookOpen;
                                  return <IconComp className="w-5 h-5" />;
                                })()}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{subject.name}</div>
                                {isSelected && (
                                  <div className="text-xs text-green-600">Selected</div>
                                )}
                              </div>
                              {isSelected && (
                                <div className="text-green-600">✓</div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selection Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      Selected: {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''}
                    </span>
                    {examType === 'JAMB' && (
                      <span className={`text-sm ${selectedSubjects.length === 4 ? 'text-green-600' : 'text-orange-600'}`}>
                        {selectedSubjects.length === 4 ? '✓ Complete' : `Need ${4 - selectedSubjects.length} more`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={onCancel}
                    className="flex-1 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!canProceedToStep3() || saving}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Combination'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
