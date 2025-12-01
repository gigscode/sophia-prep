# Mode Selection Page

## Overview

The `ModeSelectionPage` component implements a multi-step wizard for configuring quiz sessions in the exam modes system. It guides users through selecting their exam type, quiz mode, selection method, and specific subject or year.

## Features

### Multi-Step Wizard Flow

1. **Exam Type Selection** - Choose between JAMB or WAEC
2. **Mode Selection** - Choose between Practice Mode or Exam Simulation
3. **Method Selection** - Choose between Subject-based or Year-based practice
4. **Specific Selection** - Select a specific subject or exam year

### Key Functionality

- **Progressive Disclosure**: Each step only shows relevant options based on previous selections
- **Back Navigation**: Users can navigate back through steps to change selections
- **State Management**: All selections are tracked in component state
- **Data Loading**: Subjects and years are loaded dynamically based on exam type
- **Validation**: Configuration is validated before starting the quiz
- **Summary Panel**: Shows current selections at all times
- **Error Handling**: Displays user-friendly error messages

## Requirements Coverage

This component satisfies the following requirements from the exam modes system specification:

- **1.1**: Display options to select WAEC or JAMB exam type
- **1.2**: Load subjects available for that exam type
- **1.3**: Reset subject and year selections when exam type changes
- **2.1**: Present options for practice mode and exam simulation mode
- **3.1**: Display a list of available subjects for the selected exam type
- **4.1**: Display available past exam years

## Usage

### Routing

The component is accessible at `/quiz/mode-selection` and is registered in `App.tsx`:

```typescript
<Route path="/quiz/mode-selection" element={<Layout showFooter={false}><ModeSelectionPage /></Layout>} />
```

### Navigation Flow

1. User navigates to `/quiz/mode-selection`
2. Completes the 4-step wizard
3. Clicks "Start Quiz" button
4. Quiz configuration is saved to `sessionStorage`
5. User is redirected to `/quiz/unified` (to be implemented in task 4)

## State Management

The component uses local state to track:

```typescript
interface ModeSelectionState {
  step: WizardStep;              // Current wizard step
  examType: ExamType | null;     // JAMB or WAEC
  mode: QuizMode | null;         // practice or exam
  selectionMethod: SelectionMethod | null;  // subject or year
  subjectSlug: string | null;    // Selected subject slug
  year: number | null;           // Selected exam year
}
```

## Data Loading

### Subjects

When the user reaches the subject selection step, subjects are loaded using:

```typescript
const data = await subjectService.getSubjectsByExamType(state.examType);
```

This filters subjects to only show those available for the selected exam type (JAMB, WAEC, or BOTH).

### Years

When the user reaches the year selection step, available years are loaded by querying distinct `exam_year` values:

```typescript
const { data } = await supabase
  .from('questions')
  .select('exam_year')
  .eq('exam_type', state.examType)
  .not('exam_year', 'is', null)
  .order('exam_year', { ascending: false });
```

## Quiz Configuration

When the user clicks "Start Quiz", a `QuizConfig` object is created and validated:

```typescript
const config: QuizConfig = {
  examType: state.examType,
  mode: state.mode,
  selectionMethod: state.selectionMethod,
  subjectSlug: state.subjectSlug || undefined,
  year: state.year || undefined,
};

const validationError = QuizConfigHelpers.validateConfig(config);
```

The configuration is then stored in `sessionStorage` for the unified quiz component to retrieve.

## Testing

The component has comprehensive unit tests covering:

- Initial render and exam type selection
- Navigation through all wizard steps
- Subject loading for subject-based selection
- Year loading for year-based selection
- Back navigation
- Selection reset when exam type changes
- Summary panel display

Run tests with:

```bash
npm test -- src/pages/ModeSelectionPage.test.tsx --run
```

## UI/UX Features

### Progress Indicator

A visual progress indicator shows the user's position in the wizard:
- Active step: Blue circle
- Completed steps: Green circle
- Future steps: Gray circle

### Summary Panel

A blue panel at the bottom shows all current selections:
- Exam Type
- Mode
- Method
- Subject/Year (when selected)

### Loading States

Loading spinners are shown while:
- Fetching subjects from the database
- Fetching available years from the database

### Error Handling

User-friendly error messages are displayed for:
- Failed data loading
- Incomplete selections
- Invalid configurations

## Accessibility

- Keyboard navigation supported
- Clear visual hierarchy
- Descriptive button labels
- Loading state announcements
- Error messages are clearly visible

## Future Enhancements

Potential improvements for future iterations:

1. Add keyboard shortcuts for navigation (e.g., Enter to proceed, Escape to go back)
2. Add animations for step transitions
3. Persist selections to localStorage for returning users
4. Add "Recently Used" configurations for quick access
5. Add tooltips explaining each mode and method
6. Add preview of question count for each selection
