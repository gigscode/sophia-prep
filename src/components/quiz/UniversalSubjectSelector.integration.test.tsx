import { describe, it, expect } from 'vitest';
import { universalValidationService } from '../../services/universal-validation-service';
import { jambValidationService } from '../../services/jamb-validation-service';
import { waecValidationService } from '../../services/waec-validation-service';
import type { ExamTypeRecord, SubjectWithDetails } from '../../types/database';

const mockJAMBExamType: ExamTypeRecord = {
  id: '1',
  name: 'JAMB',
  slug: 'jamb',
  description: 'Joint Admissions and Matriculation Board',
  is_active: true,
  sort_order: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockWAECExamType: ExamTypeRecord = {
  id: '2',
  name: 'WAEC',
  slug: 'waec',
  description: 'West African Examinations Council',
  is_active: true,
  sort_order: 2,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockSubjects: SubjectWithDetails[] = [
  {
    id: '1',
    name: 'English Language',
    slug: 'english',
    category_name: 'Language',
    category_slug: 'language',
    exam_types: ['JAMB', 'WAEC'],
    exam_type_slugs: ['jamb', 'waec'],
    is_mandatory: true,
    is_active: true,
    sort_order: 1
  },
  {
    id: '2',
    name: 'Mathematics',
    slug: 'mathematics',
    category_name: 'Science',
    category_slug: 'science',
    exam_types: ['JAMB', 'WAEC'],
    exam_type_slugs: ['jamb', 'waec'],
    is_mandatory: false,
    is_active: true,
    sort_order: 2
  },
  {
    id: '3',
    name: 'Physics',
    slug: 'physics',
    category_name: 'Science',
    category_slug: 'science',
    exam_types: ['JAMB', 'WAEC'],
    exam_type_slugs: ['jamb', 'waec'],
    is_mandatory: false,
    is_active: true,
    sort_order: 3
  },
  {
    id: '4',
    name: 'Chemistry',
    slug: 'chemistry',
    category_name: 'Science',
    category_slug: 'science',
    exam_types: ['JAMB', 'WAEC'],
    exam_type_slugs: ['jamb', 'waec'],
    is_mandatory: false,
    is_active: true,
    sort_order: 4
  }
];

describe('Universal Subject Selection Integration', () => {
  describe('Universal Validation Service', () => {
    it('should provide JAMB requirements correctly', () => {
      const requirements = universalValidationService.getValidationRequirements(mockJAMBExamType);
      
      expect(requirements.title).toBe('JAMB Requirements');
      expect(requirements.minSubjects).toBe(4);
      expect(requirements.maxSubjects).toBe(4);
      expect(requirements.mandatorySubjects).toContain('english');
    });

    it('should provide WAEC requirements correctly', () => {
      const requirements = universalValidationService.getValidationRequirements(mockWAECExamType);
      
      expect(requirements.title).toBe('WAEC Requirements');
      expect(requirements.minSubjects).toBe(6);
      expect(requirements.maxSubjects).toBe(9);
    });
  });

  describe('JAMB Validation Service', () => {
    it('should validate real-time status correctly for empty selection', () => {
      const status = jambValidationService.validateInRealTime([], mockSubjects);
      
      expect(status.status).toBe('incomplete');
      expect(status.progress).toBe(0);
      expect(status.nextStep).toContain('English');
    });

    it('should validate real-time status correctly for partial selection', () => {
      const status = jambValidationService.validateInRealTime(['1', '2'], mockSubjects); // English + Math
      
      expect(status.status).toBe('incomplete');
      expect(status.progress).toBe(50); // 2/4 = 50%
      expect(status.message).toContain('2 more');
    });

    it('should validate real-time status correctly for complete valid selection', () => {
      const status = jambValidationService.validateInRealTime(['1', '2', '3', '4'], mockSubjects);
      
      expect(status.status).toBe('valid');
      expect(status.progress).toBe(100);
      expect(status.message).toContain('Perfect');
    });

    it('should validate real-time status correctly for excess selection', () => {
      const status = jambValidationService.validateInRealTime(['1', '2', '3', '4', '1'], mockSubjects);
      
      expect(status.status).toBe('invalid');
      expect(status.message).toContain('Remove');
    });
  });

  describe('WAEC Validation Service', () => {
    it('should validate real-time status correctly for empty selection', () => {
      const status = waecValidationService.validateInRealTime([], mockSubjects);
      
      expect(status.status).toBe('incomplete');
      expect(status.progress).toBe(0);
      expect(status.nextStep).toContain('core subjects');
    });

    it('should validate real-time status correctly for minimum valid selection', () => {
      const sixSubjects = ['1', '2', '3', '4', '1', '2']; // 6 subjects (with duplicates for test)
      const status = waecValidationService.validateInRealTime(sixSubjects, mockSubjects);
      
      expect(status.status).toBe('valid');
      expect(status.progress).toBe(100);
    });

    it('should validate real-time status correctly for excess selection', () => {
      const tenSubjects = Array(10).fill('1').map((_, i) => i.toString());
      const status = waecValidationService.validateInRealTime(tenSubjects, mockSubjects);
      
      expect(status.status).toBe('invalid');
      expect(status.message).toContain('Remove');
    });
  });

  describe('Subject Compatibility', () => {
    it('should validate subject compatibility correctly', () => {
      const compatibility = universalValidationService.validateSubjectCompatibility(
        ['1', '2', '3', '4'], // English, Math, Physics, Chemistry
        mockSubjects
      );
      
      expect(compatibility.isCompatible).toBe(true);
      expect(compatibility.conflicts).toHaveLength(0);
    });

    it('should provide recommendations for science subjects', () => {
      const compatibility = universalValidationService.validateSubjectCompatibility(
        ['3', '4'], // Physics, Chemistry (no Math)
        mockSubjects
      );
      
      // Check that recommendations are provided (the exact text may vary)
      expect(compatibility.recommendations.length).toBeGreaterThan(0);
      expect(compatibility.isCompatible).toBe(true);
    });
  });
});