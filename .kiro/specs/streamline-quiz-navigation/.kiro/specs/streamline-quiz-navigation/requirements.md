# Requirements Document

## Introduction

This feature addresses a user experience issue where users selecting a quiz mode and subject from the `/subjects` page are forced to re-select the same information on the `/quiz/mode-selection` page. The current navigation flow creates unnecessary repetition, requiring users to make the same selections twice. This feature will streamline the quiz navigation flow by preserving user selections when navigating from the subjects page directly to the quiz interface.

## Glossary

- **Quiz System**: The application component responsible for managing quiz sessions, including practice mode and exam simulation mode
- **Subjects Page**: The page located at `/subjects` where users browse and select subjects for study
- **Mode Selection Page**: The page located at `/quiz/mode-selection` where users configure quiz parameters including exam type, mode, and subject
- **Unified Quiz**: The main quiz interface located at `/quiz/unified` that displays questions and manages quiz sessions
- **Legacy Routes**: The deprecated routes `/quiz/practice` and `/quiz/cbt` that redirect to the mode selection page
- **Query Parameters**: URL parameters that specify quiz configuration (subject, year, type)
- **Quiz Mode**: Either "practice" (untimed with immediate feedback) or "exam" (timed simulation)

## Requirements

### Requirement 1

**User Story:** As a user browsing subjects, I want to start a quiz directly from the subjects page without re-selecting my choices, so that I can begin practicing immediately.

#### Acceptance Criteria

1. WHEN a user clicks the "Practice" button on a subject card THEN the Quiz System SHALL navigate directly to the quiz interface with the selected subject and practice mode pre-configured
2. WHEN a user clicks the "Quiz" button on a subject card THEN the Quiz System SHALL navigate directly to the quiz interface with the selected subject and exam mode pre-configured
3. WHEN navigating from the subjects page THEN the Quiz System SHALL preserve all query parameters including subject slug, year, and type
4. WHEN the quiz interface loads with pre-configured parameters THEN the Quiz System SHALL display the correct subject name and mode in the interface
5. WHEN a user navigates to legacy routes with query parameters THEN the Quiz System SHALL extract and preserve those parameters through the navigation flow

### Requirement 2

**User Story:** As a user, I want the mode selection page to remain available for manual configuration, so that I can still customize my quiz settings when needed.

#### Acceptance Criteria

1. WHEN a user navigates to `/quiz/mode-selection` without pre-selected parameters THEN the Mode Selection Page SHALL display the full configuration wizard
2. WHEN a user navigates to `/quiz` THEN the Quiz System SHALL display the quiz mode selector page
3. WHEN a user completes the mode selection wizard THEN the Quiz System SHALL navigate to the unified quiz with the configured parameters
4. WHEN a user accesses the mode selection page from the home page THEN the Mode Selection Page SHALL function identically to the current implementation

### Requirement 3

**User Story:** As a developer, I want the navigation logic to be maintainable and clear, so that future modifications are straightforward.

#### Acceptance Criteria

1. WHEN legacy routes receive requests THEN the Quiz System SHALL handle the redirect logic in a centralized location
2. WHEN query parameters are present on legacy routes THEN the Quiz System SHALL transform them into the unified quiz configuration format
3. WHEN the unified quiz loads THEN the Quiz System SHALL validate the configuration parameters before starting the quiz
4. WHEN invalid parameters are detected THEN the Quiz System SHALL redirect the user to the mode selection page with an appropriate error message
