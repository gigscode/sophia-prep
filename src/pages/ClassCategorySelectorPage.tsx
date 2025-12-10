import { useLocation, useNavigate } from 'react-router-dom';
import { ClassCategorySelector } from '../components/quiz/ClassCategorySelector';
import type { ExamType } from '../types/quiz-config';

export function ClassCategorySelectorPage() {
  const location = useLocation();
  const navigate = useNavigate();

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

