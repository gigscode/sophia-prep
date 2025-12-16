#!/usr/bin/env node

/**
 * Generate Question Template (No Difficulty)
 * 
 * This script generates a template JSON file with sample questions for each subject.
 * Difficulty feature has been removed.
 */

const fs = require('fs');
const path = require('path');

// Template structure for a question (difficulty removed)
const questionTemplate = {
  id: "unique-question-id",
  subject: "mathematics", // physics, chemistry, biology, english, etc.
  topic: "algebra", // optional topic classification
  question_text: "What is 2 + 2?",
  option_a: "3",
  option_b: "4", 
  option_c: "5",
  option_d: "6",
  correct_answer: "B", // A, B, C, or D
  explanation: "Explanation of why this is the correct answer.",
  exam_year: 2023, // or null
  exam_type: "JAMB", // JAMB, WAEC, or null
};

// Sample questions for each subject (difficulty removed)
const sampleQuestions = {
  mathematics: [
    {
      id: "math-001",
      subject: "mathematics",
      topic: "algebra",
      question_text: "Solve for x: 3x + 5 = 20",
      option_a: "3",
      option_b: "5",
      option_c: "7",
      option_d: "10",
      correct_answer: "B",
      explanation: "3x + 5 = 20 → 3x = 15 → x = 5",
      exam_year: 2023,
      exam_type: "JAMB",
    },
    {
      id: "math-002", 
      subject: "mathematics",
      topic: "trigonometry",
      question_text: "What is the value of sin 30°?",
      option_a: "0.5",
      option_b: "0.707",
      option_c: "0.866", 
      option_d: "1.0",
      correct_answer: "A",
      explanation: "sin 30° = 1/2 = 0.5",
      exam_year: 2023,
      exam_type: "JAMB",
    },
    {
      id: "math-003",
      subject: "mathematics", 
      topic: "geometry",
      question_text: "What is the area of a circle with radius 7 cm? (Use π = 22/7)",
      option_a: "44 cm²",
      option_b: "88 cm²",
      option_c: "154 cm²",
      option_d: "308 cm²",
      correct_answer: "C",
      explanation: "Area = πr² = (22/7) × 7² = (22/7) × 49 = 154 cm²",
      exam_year: 2023,
      exam_type: "JAMB",
    }
  ],

  english: [
    {
      id: "eng-001",
      subject: "english",
      topic: "vocabulary",
      question_text: "Choose the word that is most nearly opposite in meaning to 'benevolent':",
      option_a: "kind",
      option_b: "generous", 
      option_c: "malevolent",
      option_d: "helpful",
      correct_answer: "C",
      explanation: "Benevolent means kind and generous. The opposite is malevolent, which means wishing harm to others.",
      exam_year: 2023,
      exam_type: "JAMB",
    },
    {
      id: "eng-002",
      subject: "english",
      topic: "grammar",
      question_text: "In the sentence 'She runs quickly', what part of speech is 'quickly'?",
      option_a: "noun",
      option_b: "verb",
      option_c: "adjective",
      option_d: "adverb",
      correct_answer: "D",
      explanation: "'Quickly' modifies the verb 'runs' and describes how she runs, making it an adverb.",
      exam_year: 2023,
      exam_type: "JAMB",
    }
  ],

  physics: [
    {
      id: "phy-001",
      subject: "physics",
      topic: "mechanics",
      question_text: "What is the SI unit of force?",
      option_a: "Joule",
      option_b: "Newton", 
      option_c: "Watt",
      option_d: "Pascal",
      correct_answer: "B",
      explanation: "The SI unit of force is the Newton (N), named after Sir Isaac Newton.",
      exam_year: 2023,
      exam_type: "JAMB",
    },
    {
      id: "phy-002",
      subject: "physics",
      topic: "kinematics", 
      question_text: "A car accelerates from rest to 20 m/s in 5 seconds. What is its acceleration?",
      option_a: "2 m/s²",
      option_b: "4 m/s²",
      option_c: "5 m/s²",
      option_d: "10 m/s²",
      correct_answer: "B",
      explanation: "Acceleration = (final velocity - initial velocity) / time = (20 - 0) / 5 = 4 m/s²",
      exam_year: 2023,
      exam_type: "JAMB",
    }
  ],

  chemistry: [
    {
      id: "chem-001",
      subject: "chemistry",
      topic: "periodic-table",
      question_text: "What is the chemical symbol for Gold?",
      option_a: "Go",
      option_b: "Gd",
      option_c: "Au", 
      option_d: "Ag",
      correct_answer: "C",
      explanation: "The chemical symbol for Gold is Au, derived from its Latin name 'Aurum'.",
      exam_year: 2023,
      exam_type: "JAMB",
    },
    {
      id: "chem-002",
      subject: "chemistry",
      topic: "acids-bases",
      question_text: "Which of the following is a strong acid?",
      option_a: "Acetic acid (CH₃COOH)",
      option_b: "Carbonic acid (H₂CO₃)",
      option_c: "Hydrochloric acid (HCl)",
      option_d: "Citric acid",
      correct_answer: "C",
      explanation: "Hydrochloric acid (HCl) is a strong acid that completely dissociates in water.",
      exam_year: 2023,
      exam_type: "JAMB",
    }
  ],

  biology: [
    {
      id: "bio-001",
      subject: "biology",
      topic: "cell-biology",
      question_text: "Which organelle is known as the 'powerhouse of the cell'?",
      option_a: "Nucleus",
      option_b: "Ribosome",
      option_c: "Mitochondria",
      option_d: "Endoplasmic reticulum",
      correct_answer: "C",
      explanation: "Mitochondria are called the powerhouse of the cell because they produce ATP through cellular respiration.",
      exam_year: 2023,
      exam_type: "JAMB",
    }
  ]
};

function generateTemplate() {
  const outputDir = path.join(__dirname, '..', 'data');
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write template structure
  const templatePath = path.join(outputDir, 'question-template.json');
  fs.writeFileSync(templatePath, JSON.stringify(questionTemplate, null, 2));
  console.log(`✅ Question template written to: ${templatePath}`);

  // Write sample questions
  const samplesPath = path.join(outputDir, 'sample-questions.json');
  fs.writeFileSync(samplesPath, JSON.stringify(sampleQuestions, null, 2));
  console.log(`✅ Sample questions written to: ${samplesPath}`);

  console.log('\n📝 Template Generation Complete!');
  console.log('\nNext steps:');
  console.log('1. Use the template structure to create your question files');
  console.log('2. Ensure all questions follow the same format');
  console.log('3. Import questions using the import script');
}

if (require.main === module) {
  generateTemplate();
}

module.exports = { questionTemplate, sampleQuestions, generateTemplate };