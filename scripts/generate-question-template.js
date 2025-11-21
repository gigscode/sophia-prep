#!/usr/bin/env node
/**
 * Question Template Generator
 * 
 * Generates question templates in the correct format for import
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

// Question template structure
const questionTemplate = {
  question_text: "Your question here?",
  option_a: "Option A",
  option_b: "Option B",
  option_c: "Option C",
  option_d: "Option D",
  correct_answer: "A", // A, B, C, or D
  explanation: "Explanation of why this is the correct answer.",
  difficulty_level: "MEDIUM", // EASY, MEDIUM, or HARD
  exam_year: 2023, // or null
  exam_type: "JAMB", // JAMB, WAEC, or null
  topic: "Topic Name"
};

// Sample questions for different subjects
const sampleQuestions = {
  mathematics: [
    {
      question_text: "If 3x + 5 = 20, what is the value of x?",
      option_a: "3",
      option_b: "5",
      option_c: "7",
      option_d: "15",
      correct_answer: "B",
      explanation: "3x + 5 = 20 → 3x = 15 → x = 5",
      difficulty_level: "EASY",
      exam_year: 2023,
      exam_type: "JAMB",
      topic: "Algebra"
    },
    {
      question_text: "What is the value of sin 30°?",
      option_a: "0.5",
      option_b: "0.707",
      option_c: "0.866",
      option_d: "1",
      correct_answer: "A",
      explanation: "sin 30° = 1/2 = 0.5",
      difficulty_level: "EASY",
      exam_year: 2023,
      exam_type: "JAMB",
      topic: "Trigonometry"
    },
    {
      question_text: "Find the area of a circle with radius 7 cm. (Take π = 22/7)",
      option_a: "44 cm²",
      option_b: "88 cm²",
      option_c: "154 cm²",
      option_d: "308 cm²",
      correct_answer: "C",
      explanation: "Area = πr² = (22/7) × 7² = (22/7) × 49 = 154 cm²",
      difficulty_level: "MEDIUM",
      exam_year: 2023,
      exam_type: "JAMB",
      topic: "Mensuration"
    }
  ],
  english: [
    {
      question_text: "Choose the word that is most nearly opposite in meaning to 'BENEVOLENT'.",
      option_a: "Kind",
      option_b: "Generous",
      option_c: "Malevolent",
      option_d: "Charitable",
      correct_answer: "C",
      explanation: "Benevolent means kind and generous. The opposite is malevolent, which means wishing harm to others.",
      difficulty_level: "MEDIUM",
      exam_year: 2023,
      exam_type: "JAMB",
      topic: "Vocabulary"
    },
    {
      question_text: "Identify the part of speech of the underlined word: 'She runs QUICKLY.'",
      option_a: "Noun",
      option_b: "Verb",
      option_c: "Adjective",
      option_d: "Adverb",
      correct_answer: "D",
      explanation: "'Quickly' modifies the verb 'runs' and describes how she runs, making it an adverb.",
      difficulty_level: "EASY",
      exam_year: 2023,
      exam_type: "JAMB",
      topic: "Parts of Speech"
    }
  ],
  physics: [
    {
      question_text: "What is the SI unit of force?",
      option_a: "Joule",
      option_b: "Newton",
      option_c: "Watt",
      option_d: "Pascal",
      correct_answer: "B",
      explanation: "The SI unit of force is the Newton (N), named after Sir Isaac Newton.",
      difficulty_level: "EASY",
      exam_year: 2023,
      exam_type: "JAMB",
      topic: "Units and Measurements"
    },
    {
      question_text: "A car accelerates from rest to 20 m/s in 5 seconds. What is its acceleration?",
      option_a: "2 m/s²",
      option_b: "4 m/s²",
      option_c: "5 m/s²",
      option_d: "10 m/s²",
      correct_answer: "B",
      explanation: "Acceleration = (final velocity - initial velocity) / time = (20 - 0) / 5 = 4 m/s²",
      difficulty_level: "MEDIUM",
      exam_year: 2023,
      exam_type: "JAMB",
      topic: "Kinematics"
    }
  ],
  chemistry: [
    {
      question_text: "What is the chemical symbol for Gold?",
      option_a: "Go",
      option_b: "Gd",
      option_c: "Au",
      option_d: "Ag",
      correct_answer: "C",
      explanation: "The chemical symbol for Gold is Au, derived from its Latin name 'Aurum'.",
      difficulty_level: "EASY",
      exam_year: 2023,
      exam_type: "JAMB",
      topic: "Chemical Symbols"
    },
    {
      question_text: "Which of the following is a strong acid?",
      option_a: "Acetic acid",
      option_b: "Carbonic acid",
      option_c: "Hydrochloric acid",
      option_d: "Citric acid",
      correct_answer: "C",
      explanation: "Hydrochloric acid (HCl) is a strong acid that completely dissociates in water.",
      difficulty_level: "MEDIUM",
      exam_year: 2023,
      exam_type: "JAMB",
      topic: "Acids and Bases"
    }
  ],
  biology: [
    {
      question_text: "What is the powerhouse of the cell?",
      option_a: "Nucleus",
      option_b: "Ribosome",
      option_c: "Mitochondrion",
      option_d: "Chloroplast",
      correct_answer: "C",
      explanation: "Mitochondria are called the powerhouse of the cell because they produce ATP through cellular respiration.",
      difficulty_level: "EASY",
      exam_year: 2023,
      exam_type: "JAMB",
      topic: "Cell Biology"
    }
  ]
};

function generateTemplate(subject, count = 10) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    questions.push({ ...questionTemplate });
  }
  return questions;
}

function saveSampleQuestions() {
  const outputPath = join(process.cwd(), 'data', 'sample-questions-template.json');
  writeFileSync(outputPath, JSON.stringify(sampleQuestions, null, 2));
  console.log(`✅ Sample questions saved to: ${outputPath}`);
  console.log(`\n📊 Question counts:`);
  Object.keys(sampleQuestions).forEach(subject => {
    console.log(`  ${subject}: ${sampleQuestions[subject].length} questions`);
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  saveSampleQuestions();
}

export { questionTemplate, sampleQuestions, generateTemplate };

