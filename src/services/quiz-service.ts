import jambData from '../../data/jamb-waec-questions.json';
import extra from '../../data/extra-quizzes.json';

type RawBank = Record<string, any[]>;

export interface QuizQuestion {
  id: string;
  text: string;
  options: { key: string; text: string }[];
  correct: string;
  explanation?: string;
}

function normalizeEntry(entry: any, idPrefix = ''): QuizQuestion {
  const id = entry.id || `${idPrefix}${Math.random().toString(36).slice(2, 9)}`;
  const text = entry.question_text || entry.question || entry.text || '';
  const explanation = entry.explanation || entry.explain || entry.explanation_text || '';
  const correct = (entry.correct_answer || entry.answer || entry.correct || '').toString();
  const options = [] as { key: string; text: string }[];

  // Support different field names
  if (entry.option_a) {
    options.push({ key: 'A', text: entry.option_a });
    options.push({ key: 'B', text: entry.option_b });
    options.push({ key: 'C', text: entry.option_c });
    options.push({ key: 'D', text: entry.option_d });
  } else if (entry.options && Array.isArray(entry.options)) {
    entry.options.forEach((o: any, i: number) => {
      options.push({ key: String.fromCharCode(65 + i), text: o.text || o });
    });
  } else {
    // Fallback simple split if available
    if (entry.answers && Array.isArray(entry.answers)) {
      entry.answers.forEach((a: any, i: number) => options.push({ key: String.fromCharCode(65 + i), text: a }));
    }
  }

  return { id, text, options, correct, explanation };
}

export const quizService = {
  async getQuestionsForSubject(subjectSlug: string): Promise<QuizQuestion[]> {
    const key = subjectSlug.toLowerCase();
    const result: QuizQuestion[] = [];

    // jambData is structured by subject keys
    const jdata: RawBank = (jambData as any) || {};
    if (jdata[key] && Array.isArray(jdata[key])) {
      jdata[key].forEach((e: any, i: number) => result.push(normalizeEntry(e, `j-${key}-${i}-`)));
    }

    // extra-quizzes.json contains array of items with 'subject' field
    (extra as any[]).forEach((e: any, i: number) => {
      if ((e.subject || '').toLowerCase() === key) {
        result.push(normalizeEntry(e, `x-${key}-${i}-`));
      }
    });

    return result;
  },

  async getRandomQuestions(count = 10): Promise<QuizQuestion[]> {
    const jdata: RawBank = (jambData as any) || {};
    let pool: QuizQuestion[] = [];
    Object.keys(jdata).forEach(subject => {
      jdata[subject].forEach((e: any, i: number) => pool.push(normalizeEntry(e, `j-${subject}-${i}-`)));
    });
    (extra as any[]).forEach((e: any, i: number) => pool.push(normalizeEntry(e, `x-${i}-`)));

    // shuffle and slice
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, count);
  }
};
