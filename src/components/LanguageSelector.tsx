import { useState, useEffect } from 'react';
import { subjectService } from '../services/subject-service';
import type { Subject } from '../integrations/supabase/types';

interface LanguageSelectorProps {
  selectedLanguages: string[]; // Array of subject IDs
  onLanguageToggle: (subjectId: string) => void;
  maxSelection?: number;
}

export function LanguageSelector({ 
  selectedLanguages, 
  onLanguageToggle,
  maxSelection 
}: LanguageSelectorProps) {
  const [languages, setLanguages] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subjectService.getLanguageSubjects();
      setLanguages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load languages');
    } finally {
      setLoading(false);
    }
  };

  const canSelectMore = !maxSelection || selectedLanguages.length < maxSelection;

  if (loading) {
    return <div className="text-center py-4">Loading languages...</div>;
  }

  if (error) {
    return <div className="text-red-600 py-4">{error}</div>;
  }

  if (languages.length === 0) {
    return <div className="text-gray-500 py-4">No language options available</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Nigerian Languages</h3>
      <p className="text-sm text-gray-600 mb-4">
        Select a Nigerian language (Yoruba, Hausa, or Igbo) - Available for all combinations
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {languages.map((language) => {
          const isSelected = selectedLanguages.includes(language.id);
          const canToggle = isSelected || canSelectMore;

          return (
            <button
              key={language.id}
              onClick={() => canToggle && onLanguageToggle(language.id)}
              disabled={!canToggle}
              className={`p-4 border-2 rounded-lg transition-all text-left ${
                isSelected
                  ? 'border-green-600 bg-green-50'
                  : canToggle
                  ? 'border-gray-300 hover:border-green-600'
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded flex items-center justify-center text-white text-lg"
                  style={{ backgroundColor: language.color_theme }}
                >
                  {language.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{language.name}</div>
                  {isSelected && (
                    <div className="text-xs text-green-600">Selected</div>
                  )}
                </div>
                {isSelected && (
                  <div className="text-green-600 text-xl">✓</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {maxSelection && (
        <p className="text-sm text-gray-500 mt-2">
          {selectedLanguages.length} of {maxSelection} selected
        </p>
      )}
    </div>
  );
}
