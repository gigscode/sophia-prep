/**
 * Question Content Validator
 * 
 * Validates that question content matches the assigned subject to prevent
 * misassigned questions like Literature questions being assigned to Mathematics.
 */

export interface SubjectKeywords {
  subject: string;
  slug: string;
  keywords: string[];
  patterns: RegExp[];
  exclusions?: string[]; // Keywords that indicate this is NOT the subject
}

/**
 * Subject-specific keywords and patterns for content validation
 */
export const SUBJECT_VALIDATION_RULES: SubjectKeywords[] = [
  {
    subject: 'Mathematics',
    slug: 'mathematics',
    keywords: [
      'solve', 'calculate', 'equation', 'formula', 'find the value', 'factorize',
      'algebra', 'geometry', 'trigonometry', 'calculus', 'derivative', 'integral',
      'function', 'polynomial', 'logarithm', 'exponential', 'sine', 'cosine', 'tangent',
      'angle', 'triangle', 'circle', 'square', 'rectangle', 'radius', 'diameter',
      'area', 'volume', 'perimeter', 'circumference', 'hypotenuse', 'theorem',
      'fraction', 'decimal', 'percentage', 'ratio', 'proportion', 'probability',
      'statistics', 'mean', 'median', 'mode', 'standard deviation', 'variance',
      'matrix', 'vector', 'coordinate', 'graph', 'plot', 'axis', 'slope',
      'arithmetic', 'geometric', 'sequence', 'series', 'limit', 'infinity'
    ],
    patterns: [
      /\d+[\+\-\*\/]\d+/,           // Mathematical operations: 2+3, 5*7
      /x\s*[\+\-\*\/=]/,            // Variables in equations: x + 5, x =
      /\d+x/,                       // Algebraic terms: 2x, 5x
      /\^\d+/,                      // Exponents: ^2, ^3
      /\d+\.\d+/,                   // Decimals: 3.14, 2.5
      /\d+%/,                       // Percentages: 50%, 25%
      /\d+°/,                       // Degrees: 90°, 45°
      /\d+\s*cm\b/,                 // Units: cm, m, km
      /\d+\s*m\b/,
      /\d+\s*km\b/,
      /sin\s*\(/,                   // Trigonometric functions
      /cos\s*\(/,
      /tan\s*\(/,
      /log\s*\(/,                   // Logarithmic functions
      /\d+\s*=\s*\d+/,             // Equations: 5 = 5
      /\(\s*\d+\s*,\s*\d+\s*\)/    // Coordinates: (2, 3)
    ],
    exclusions: ['novel', 'character', 'story', 'author', 'narrator', 'passage', 'literature']
  },
  {
    subject: 'English Language',
    slug: 'english',
    keywords: [
      'grammar', 'sentence', 'verb', 'noun', 'adjective', 'adverb', 'pronoun',
      'preposition', 'conjunction', 'article', 'subject', 'predicate', 'object',
      'passive', 'active', 'plural', 'singular', 'tense', 'past tense', 'present tense',
      'future tense', 'gerund', 'participle', 'infinitive', 'clause', 'phrase',
      'syllable', 'vowel', 'consonant', 'phoneme', 'morpheme', 'syntax', 'semantics',
      'punctuation', 'comma', 'period', 'semicolon', 'apostrophe', 'quotation',
      'homophone', 'synonym', 'antonym', 'metaphor', 'simile', 'alliteration',
      'choose the correct', 'identify the', 'complete the sentence', 'fill in the blank'
    ],
    patterns: [
      /choose the correct/i,
      /identify the/i,
      /complete the sentence/i,
      /fill in.*blank/i,
      /______/,                     // Fill in the blank markers
      /what is the.*of.*word/i,
      /past tense of/i,
      /plural of/i,
      /correct pronunciation/i
    ],
    exclusions: ['solve', 'calculate', 'equation', 'formula', 'novel', 'character', 'plot']
  },
  {
    subject: 'Literature in English',
    slug: 'literature',
    keywords: [
      'novel', 'character', 'narrator', 'protagonist', 'antagonist', 'plot', 'theme',
      'author', 'writer', 'story', 'setting', 'conflict', 'climax', 'resolution',
      'metaphor', 'symbolism', 'irony', 'allegory', 'personification', 'simile',
      'alliteration', 'rhyme', 'meter', 'stanza', 'verse', 'prose', 'poetry',
      'drama', 'tragedy', 'comedy', 'soliloquy', 'monologue', 'dialogue',
      'flashback', 'foreshadowing', 'mood', 'tone', 'style', 'genre',
      'literary device', 'figurative language', 'imagery', 'allusion'
    ],
    patterns: [
      /in the novel/i,
      /the author/i,
      /the character/i,
      /the protagonist/i,
      /the narrator/i,
      /the story/i,
      /the poem/i,
      /the play/i,
      /literary work/i
    ],
    exclusions: ['solve', 'calculate', 'equation', 'formula', 'grammar', 'tense']
  },
  {
    subject: 'Physics',
    slug: 'physics',
    keywords: [
      'force', 'energy', 'power', 'work', 'motion', 'velocity', 'acceleration',
      'momentum', 'friction', 'gravity', 'mass', 'weight', 'density', 'pressure',
      'temperature', 'heat', 'light', 'sound', 'wave', 'frequency', 'amplitude',
      'electricity', 'current', 'voltage', 'resistance', 'circuit', 'magnetic',
      'atom', 'electron', 'proton', 'neutron', 'nuclear', 'radioactive',
      'optics', 'lens', 'mirror', 'reflection', 'refraction', 'spectrum'
    ],
    patterns: [
      /\d+\s*N\b/,                  // Newtons (force)
      /\d+\s*J\b/,                  // Joules (energy)
      /\d+\s*W\b/,                  // Watts (power)
      /\d+\s*m\/s/,                 // Velocity units
      /\d+\s*Hz/,                   // Frequency
      /\d+\s*V\b/,                  // Volts
      /\d+\s*A\b/,                  // Amperes
      /\d+\s*Ω/,                    // Ohms
      /F\s*=\s*ma/,                 // Physics formulas
      /E\s*=\s*mc/
    ],
    exclusions: ['novel', 'character', 'story', 'author', 'grammar', 'tense']
  },
  {
    subject: 'Chemistry',
    slug: 'chemistry',
    keywords: [
      'element', 'compound', 'molecule', 'atom', 'ion', 'electron', 'proton', 'neutron',
      'periodic table', 'atomic number', 'mass number', 'isotope', 'bond', 'ionic',
      'covalent', 'metallic', 'reaction', 'equation', 'catalyst', 'acid', 'base',
      'pH', 'oxidation', 'reduction', 'organic', 'inorganic', 'hydrocarbon',
      'alcohol', 'ester', 'ether', 'aldehyde', 'ketone', 'carboxylic acid',
      'mole', 'molarity', 'concentration', 'solution', 'solvent', 'solute'
    ],
    patterns: [
      /H2O|CO2|NaCl|HCl|H2SO4/,    // Chemical formulas
      /\d+\s*mol/,                  // Moles
      /\d+\s*g\/mol/,               // Molar mass
      /pH\s*=\s*\d+/,               // pH values
      /\[.*\]/,                     // Chemical concentrations
    ],
    exclusions: ['novel', 'character', 'story', 'author', 'grammar', 'tense']
  },
  {
    subject: 'Biology',
    slug: 'biology',
    keywords: [
      'cell', 'organism', 'tissue', 'organ', 'system', 'DNA', 'RNA', 'gene',
      'chromosome', 'protein', 'enzyme', 'hormone', 'metabolism', 'photosynthesis',
      'respiration', 'mitosis', 'meiosis', 'evolution', 'natural selection',
      'ecosystem', 'habitat', 'species', 'population', 'community', 'food chain',
      'producer', 'consumer', 'decomposer', 'bacteria', 'virus', 'fungi',
      'plant', 'animal', 'vertebrate', 'invertebrate', 'mammal', 'reptile'
    ],
    patterns: [
      /ATP|DNA|RNA/,                // Biological molecules
      /mitochondria|nucleus|ribosome/i, // Cell organelles
    ],
    exclusions: ['novel', 'character', 'story', 'author', 'grammar', 'tense', 'solve', 'calculate']
  }
];

/**
 * Validates if question content matches the assigned subject
 */
export class QuestionContentValidator {
  /**
   * Analyzes question content and returns subject match scores
   */
  analyzeQuestionContent(questionText: string, options: string[]): {
    subjectScores: Record<string, number>;
    bestMatch: string | null;
    confidence: number;
  } {
    const fullText = [questionText, ...options].join(' ').toLowerCase();
    const subjectScores: Record<string, number> = {};

    // Calculate scores for each subject
    SUBJECT_VALIDATION_RULES.forEach(rule => {
      let score = 0;

      // Check for exclusion keywords (negative score)
      if (rule.exclusions) {
        const exclusionMatches = rule.exclusions.filter(keyword => 
          fullText.includes(keyword.toLowerCase())
        ).length;
        score -= exclusionMatches * 2; // Heavy penalty for exclusions
      }

      // Check for subject keywords (positive score)
      const keywordMatches = rule.keywords.filter(keyword => 
        fullText.includes(keyword.toLowerCase())
      ).length;
      score += keywordMatches;

      // Check for subject patterns (higher weight)
      const patternMatches = rule.patterns.filter(pattern => 
        pattern.test(fullText)
      ).length;
      score += patternMatches * 2;

      subjectScores[rule.slug] = Math.max(0, score); // Don't allow negative scores
    });

    // Find best match
    const maxScore = Math.max(...Object.values(subjectScores));
    const bestMatch = maxScore > 0 
      ? Object.keys(subjectScores).find(subject => subjectScores[subject] === maxScore) || null
      : null;

    // Calculate confidence (0-1)
    const totalScore = Object.values(subjectScores).reduce((sum, score) => sum + score, 0);
    const confidence = totalScore > 0 ? maxScore / totalScore : 0;

    return {
      subjectScores,
      bestMatch,
      confidence
    };
  }

  /**
   * Validates if a question matches the assigned subject
   */
  validateQuestionSubjectMatch(
    questionText: string, 
    options: string[], 
    assignedSubjectSlug: string,
    minConfidence: number = 0.3
  ): {
    isValid: boolean;
    confidence: number;
    suggestedSubject: string | null;
    warning: string | null;
  } {
    const analysis = this.analyzeQuestionContent(questionText, options);
    
    const assignedScore = analysis.subjectScores[assignedSubjectSlug] || 0;
    const isValid = analysis.bestMatch === assignedSubjectSlug && analysis.confidence >= minConfidence;
    
    let warning: string | null = null;
    
    if (!isValid) {
      if (analysis.bestMatch && analysis.bestMatch !== assignedSubjectSlug) {
        const suggestedSubjectName = SUBJECT_VALIDATION_RULES.find(
          rule => rule.slug === analysis.bestMatch
        )?.subject || analysis.bestMatch;
        
        warning = `Question content appears to be ${suggestedSubjectName} (confidence: ${(analysis.confidence * 100).toFixed(1)}%) but is assigned to ${assignedSubjectSlug}`;
      } else if (assignedScore === 0) {
        warning = `Question content does not match ${assignedSubjectSlug} subject keywords`;
      } else {
        warning = `Low confidence match for ${assignedSubjectSlug} (${(analysis.confidence * 100).toFixed(1)}%)`;
      }
    }

    return {
      isValid,
      confidence: analysis.confidence,
      suggestedSubject: analysis.bestMatch,
      warning
    };
  }

  /**
   * Batch validate multiple questions
   */
  validateQuestionBatch(
    questions: Array<{
      questionText: string;
      options: string[];
      assignedSubjectSlug: string;
    }>,
    minConfidence: number = 0.3
  ): {
    validQuestions: number;
    invalidQuestions: number;
    warnings: string[];
    suggestions: Array<{
      questionPreview: string;
      currentSubject: string;
      suggestedSubject: string;
      confidence: number;
    }>;
  } {
    let validQuestions = 0;
    let invalidQuestions = 0;
    const warnings: string[] = [];
    const suggestions: Array<{
      questionPreview: string;
      currentSubject: string;
      suggestedSubject: string;
      confidence: number;
    }> = [];

    questions.forEach((question, index) => {
      const validation = this.validateQuestionSubjectMatch(
        question.questionText,
        question.options,
        question.assignedSubjectSlug,
        minConfidence
      );

      if (validation.isValid) {
        validQuestions++;
      } else {
        invalidQuestions++;
        
        if (validation.warning) {
          warnings.push(`Question ${index + 1}: ${validation.warning}`);
        }

        if (validation.suggestedSubject && validation.suggestedSubject !== question.assignedSubjectSlug) {
          suggestions.push({
            questionPreview: question.questionText.substring(0, 100),
            currentSubject: question.assignedSubjectSlug,
            suggestedSubject: validation.suggestedSubject,
            confidence: validation.confidence
          });
        }
      }
    });

    return {
      validQuestions,
      invalidQuestions,
      warnings,
      suggestions
    };
  }
}

export const questionContentValidator = new QuestionContentValidator();