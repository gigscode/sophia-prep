import { useLocation } from 'react-router-dom';
import { ClassCategorySelector } from '../components/quiz/ClassCategorySelector';
import { useNavigation } from '../hooks/useNavigation';
import type { ExamType } from '../types/quiz-config';

export function ClassCategorySelectorPage() {
  const location = useLocation();
  const { navigate } = useNavigation();

  // Get exam type from location state
  const examType = (location.state as { examType?: ExamType })?.examType;

  // If no exam type provided, redirect to quiz mode selector
  if (!examType) {
    navigate('/quiz');
    return null;
  }

  return (
    <ClassCategorySelector
      examType={examType}
      onBack={() => navigate('/quiz')}
    />
  );
}

export default ClassCategorySelectorPage;

