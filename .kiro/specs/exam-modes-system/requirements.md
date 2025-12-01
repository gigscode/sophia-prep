# Requirements Document

## Introduction

This document specifies the requirements for a comprehensive exam modes system that supports both WAEC and JAMB examinations with practice and simulation modes. The system enables students to prepare for standardized exams through untimed practice sessions with immediate feedback or timed exam simulations that replicate real test conditions. Users can select questions either by subject or by specific past-year papers.

## Glossary

- **Quiz System**: The application component responsible for presenting questions, managing user responses, and tracking quiz attempts
- **Practice Mode**: An untimed quiz session where explanations are shown immediately after each answer
- **Exam Simulation Mode**: A timed quiz session that replicates official exam conditions with no explanations until completion
- **WAEC**: West African Examinations Council - a standardized examination system
- **JAMB**: Joint Admissions and Matriculation Board - a Nigerian university entrance examination
- **Subject Selection**: A quiz configuration where users choose a specific subject to practice
- **Year Selection**: A quiz configuration where users choose questions from a specific past exam year
- **Timer Configuration**: A data structure storing official exam durations per exam type, subject, and year
- **Quiz Attempt**: A record of a user's quiz session including responses, score, and timing data
- **Explanation**: Educational content explaining why an answer is correct or incorrect
- **Auto-submit**: Automatic submission of a quiz when the timer expires

## Requirements

### Requirement 1

**User Story:** As a student, I want to select between WAEC and JAMB exam types, so that I can practice questions relevant to my target examination.

#### Acceptance Criteria

1. WHEN a user accesses the quiz system THEN the Quiz System SHALL display options to select WAEC or JAMB exam type
2. WHEN a user selects an exam type THEN the Quiz System SHALL load subjects available for that exam type
3. WHEN a user changes exam type THEN the Quiz System SHALL reset subject and year selections to default values

### Requirement 2

**User Story:** As a student, I want to choose between practice mode and exam simulation mode, so that I can either learn with feedback or test myself under exam conditions.

#### Acceptance Criteria

1. WHEN a user selects an exam type THEN the Quiz System SHALL present options for practice mode and exam simulation mode
2. WHEN a user selects practice mode THEN the Quiz System SHALL configure the session with no time limit and immediate explanation display
3. WHEN a user selects exam simulation mode THEN the Quiz System SHALL configure the session with official exam timing and delayed explanation display

### Requirement 3

**User Story:** As a student, I want to practice questions by subject, so that I can focus on specific areas where I need improvement.

#### Acceptance Criteria

1. WHEN a user selects subject-based practice THEN the Quiz System SHALL display a list of available subjects for the selected exam type
2. WHEN a user selects a subject THEN the Quiz System SHALL load questions tagged with that subject
3. WHEN a user optionally selects a year filter THEN the Quiz System SHALL load questions matching both subject and year criteria

### Requirement 4

**User Story:** As a student, I want to practice questions from specific past years, so that I can familiarize myself with historical exam patterns.

#### Acceptance Criteria

1. WHEN a user selects year-based practice THEN the Quiz System SHALL display available past exam years
2. WHEN a user selects a year THEN the Quiz System SHALL load all questions from that specific exam paper
3. WHEN a user selects a year for exam simulation THEN the Quiz System SHALL apply the official time limit for that year's paper

### Requirement 5

**User Story:** As a student using practice mode, I want to see explanations immediately after answering each question, so that I can learn from my mistakes in real-time.

#### Acceptance Criteria

1. WHEN a user answers a question in practice mode THEN the Quiz System SHALL display whether the answer is correct or incorrect
2. WHEN a user answers a question in practice mode THEN the Quiz System SHALL display the explanation for that question
3. WHEN a user views an explanation in practice mode THEN the Quiz System SHALL provide a control to proceed to the next question
4. WHEN a user is in practice mode THEN the Quiz System SHALL allow manual submission at any time

### Requirement 6

**User Story:** As a student using exam simulation mode, I want the quiz to be timed according to official exam durations, so that I can practice time management skills.

#### Acceptance Criteria

1. WHEN a user starts an exam simulation THEN the Quiz System SHALL retrieve the official duration from the Timer Configuration
2. WHEN an exam simulation is active THEN the Quiz System SHALL display a countdown timer showing remaining time
3. WHEN the timer reaches zero THEN the Quiz System SHALL automatically submit the quiz via Auto-submit
4. WHEN a user attempts manual submission during exam simulation THEN the Quiz System SHALL prevent submission until the timer expires

### Requirement 7

**User Story:** As a student using exam simulation mode, I want explanations hidden until I complete the exam, so that I experience realistic exam conditions.

#### Acceptance Criteria

1. WHEN a user answers a question in exam simulation mode THEN the Quiz System SHALL record the answer without displaying correctness feedback
2. WHEN a user answers a question in exam simulation mode THEN the Quiz System SHALL not display explanations
3. WHEN an exam simulation completes via Auto-submit THEN the Quiz System SHALL display all questions with correct answers and explanations
4. WHEN a user reviews completed exam simulation THEN the Quiz System SHALL show which answers were correct and incorrect with explanations

### Requirement 8

**User Story:** As a student, I want my quiz attempts saved with detailed information, so that I can track my progress over time.

#### Acceptance Criteria

1. WHEN a user completes a quiz THEN the Quiz System SHALL create a Quiz Attempt record with exam type, subject, year, score, and timestamp
2. WHEN a user completes a quiz THEN the Quiz System SHALL store an array of question responses including question ID, user answer, correct answer, and explanation
3. WHEN a Quiz Attempt is created THEN the Quiz System SHALL persist the data to the database immediately
4. WHEN a user views their history THEN the Quiz System SHALL retrieve and display all past Quiz Attempt records

### Requirement 9

**User Story:** As a system administrator, I want exam durations stored in a configurable lookup table, so that timing rules can be easily updated without code changes.

#### Acceptance Criteria

1. WHEN the system initializes THEN the Quiz System SHALL load Timer Configuration data from the database
2. WHEN a Timer Configuration is queried THEN the Quiz System SHALL return duration based on exam type, subject, and year parameters
3. WHEN a Timer Configuration does not exist for specific parameters THEN the Quiz System SHALL return a default duration value
4. WHERE Timer Configuration is updated THEN the Quiz System SHALL apply new durations to subsequent quiz sessions without requiring application restart

### Requirement 10

**User Story:** As a student, I want consistent naming across the interface, so that I can easily understand the difference between practice and exam modes.

#### Acceptance Criteria

1. WHEN the Quiz System displays mode options THEN the Quiz System SHALL use the term "Practice" for untimed sessions
2. WHEN the Quiz System displays mode options THEN the Quiz System SHALL use the term "Exam" or "Simulation" for timed sessions
3. WHEN the Quiz System displays quiz results THEN the Quiz System SHALL label the mode consistently with the selection interface

### Requirement 11

**User Story:** As a student, I want the interface to prevent accidental early submission during timed exams, so that I don't lose my progress.

#### Acceptance Criteria

1. WHEN an exam simulation timer is active THEN the Quiz System SHALL disable manual submit controls
2. WHEN an exam simulation timer expires THEN the Quiz System SHALL enable the submit control and trigger Auto-submit
3. WHEN a user is in practice mode THEN the Quiz System SHALL enable manual submit controls at all times

### Requirement 12

**User Story:** As an administrator uploading questions, I want to specify exam type and year for each question, so that the quiz system can filter questions appropriately for different modes.

#### Acceptance Criteria

1. WHEN an administrator imports questions THEN the Quiz System SHALL accept exam_type field with values JAMB or WAEC
2. WHEN an administrator imports questions THEN the Quiz System SHALL accept exam_year field with numeric year values
3. WHEN an administrator imports questions without exam_type or exam_year THEN the Quiz System SHALL store the question with null values for those fields
4. WHEN the Quiz System queries questions THEN the Quiz System SHALL filter by exam_type and exam_year when those parameters are provided
