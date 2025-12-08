# Requirements Document

## Introduction

This specification addresses the removal of the topic selection feature from the Sophia Prep quiz system. Currently, questions are stored with a mandatory `topic_id` foreign key, requiring an intermediary topic layer between subjects and questions. This creates unnecessary complexity for the quiz flow where users only need to select by subject or exam year. The system should be simplified to allow direct querying of questions by subject and exam type without requiring topics as an intermediary.

## Glossary

- **Quiz System**: The component responsible for loading and displaying questions to users
- **Question Service**: The service layer that queries questions from the database
- **Topic**: An intermediary categorization layer between subjects and questions (to be made optional)
- **Subject**: A main exam subject (e.g., Mathematics, English, Physics)
- **Exam Type**: Either JAMB or WAEC examination
- **Quiz Mode**: Either practice (untimed with feedback) or exam (timed simulation)
- **Selection Method**: How questions are filtered - by subject or by year

## Requirements

### Requirement 1

**User Story:** As a student, I want to start a quiz by selecting a subject and exam type, so that I can practice questions without needing to understand topic categorizations.

#### Acceptance Criteria

1. WHEN a user selects a subject and exam type THEN the Quiz System SHALL retrieve all active questions for that subject and exam type
2. WHEN questions are queried by subject THEN the Question Service SHALL return questions regardless of topic assignment
3. WHEN a user starts a quiz THEN the Quiz System SHALL not require topic selection
4. WHEN questions are displayed THEN the Quiz System SHALL show questions from the selected subject without topic filtering

### Requirement 2

**User Story:** As a developer, I want the database schema to support optional topic categorization, so that questions can be imported and queried without mandatory topic assignment.

#### Acceptance Criteria

1. WHEN a question is inserted into the database THEN the system SHALL allow null values for the topic_id field
2. WHEN the questions table is modified THEN the system SHALL maintain backward compatibility with existing questions that have topic assignments
3. WHEN a topic is deleted THEN the system SHALL set the topic_id to null for associated questions rather than cascading delete
4. WHEN querying questions THEN the system SHALL support filtering by subject_id directly

### Requirement 3

**User Story:** As a developer, I want the Question Service to query questions efficiently by subject, so that quiz loading performance remains optimal.

#### Acceptance Criteria

1. WHEN questions are queried by subject slug THEN the Question Service SHALL use a direct subject-to-questions relationship
2. WHEN the Question Service loads questions THEN the system SHALL apply exam_type and exam_year filters at the database level
3. WHEN multiple filters are applied THEN the Question Service SHALL combine them in a single database query
4. WHEN questions are normalized THEN the Question Service SHALL preserve exam metadata (year, type)

### Requirement 4

**User Story:** As a database administrator, I want to add a subject_id column to questions, so that questions can be directly associated with subjects without requiring topics.

#### Acceptance Criteria

1. WHEN the migration is applied THEN the questions table SHALL have a subject_id column
2. WHEN existing questions have topic assignments THEN the migration SHALL backfill subject_id from the topic's subject_id
3. WHEN the subject_id column is added THEN the system SHALL create an index on subject_id for query performance
4. WHEN a subject is deleted THEN the system SHALL handle the foreign key relationship appropriately

### Requirement 5

**User Story:** As a content administrator, I want to import questions with direct subject assignment, so that I can add questions without creating topics first.

#### Acceptance Criteria

1. WHEN importing questions THEN the Import Questions Page SHALL allow subject selection without requiring topic selection
2. WHEN a question is imported with only a subject THEN the system SHALL save the question with a null topic_id
3. WHEN the import form is displayed THEN the system SHALL make the topic field optional
4. WHEN questions are imported THEN the system SHALL validate that either subject_id or topic_id is provided

### Requirement 6

**User Story:** As a developer, I want the admin question management interface to support both topic-based and subject-based question organization, so that existing workflows remain functional.

#### Acceptance Criteria

1. WHEN viewing questions in admin THEN the Admin Question Management SHALL display both subject and topic information when available
2. WHEN creating a question in admin THEN the system SHALL allow topic selection to be optional
3. WHEN editing a question in admin THEN the system SHALL allow removing topic assignment
4. WHEN filtering questions in admin THEN the system SHALL support filtering by subject with or without topic

### Requirement 7

**User Story:** As a student taking a quiz, I want questions to load quickly regardless of how they are categorized, so that my quiz experience is smooth.

#### Acceptance Criteria

1. WHEN a quiz is started THEN the Question Service SHALL load questions in under 2 seconds for typical query sizes
2. WHEN questions are queried THEN the system SHALL use database indexes for subject_id, exam_type, and exam_year
3. WHEN the quiz loads THEN the system SHALL fetch questions in a single database query when possible
4. WHEN questions are filtered THEN the system SHALL apply all filters at the database level rather than in application code
