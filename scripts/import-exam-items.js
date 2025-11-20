#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

if (SUPABASE_KEY === process.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Using ANON key. Inserts will fail due to RLS. Set SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const SUBJECTS = [
  { slug: 'mathematics', type: 'SCIENCE' },
  { slug: 'english-language', type: 'ARTS' },
  { slug: 'biology', type: 'SCIENCE' },
  { slug: 'chemistry', type: 'SCIENCE' },
  { slug: 'physics', type: 'SCIENCE' }
];

async function getSubject(slug) {
  const { data, error } = await supabase.from('subjects').select('id, name').eq('slug', slug).single();
  if (error) throw error;
  return data;
}

async function getOrCreateTopic(subject_id, name) {
  const { data } = await supabase.from('topics').select('id').eq('subject_id', subject_id).eq('name', name).single();
  if (data?.id) return data.id;
  const { data: created, error } = await supabase.from('topics').insert({ subject_id, name, description: name, order_index: 0, is_active: true }).select('id').single();
  if (error) throw error;
  return created.id;
}

function buildItems(subject, topics) {
  const take = (label) => topics[label] || null;
  const essay = (prompt, topicLabel, marks, minutes, bloom, refs) => ({
    subject_id: subject.id,
    topic_id: take(topicLabel),
    item_type: 'ESSAY',
    prompt,
    expected_structure: 'Introduction, body, conclusion',
    mark_weighting: marks,
    time_minutes: minutes,
    bloom_level: bloom,
    related_past: [],
    exam_types: ['JAMB','WAEC'],
    references: refs,
    is_active: true
  });
  const practical = (prompt, topicLabel, marks, minutes, bloom, refs) => ({
    subject_id: subject.id,
    topic_id: take(topicLabel),
    item_type: 'PRACTICAL',
    prompt,
    expected_structure: 'Apparatus, procedure, observations, calculations, conclusion',
    mark_weighting: marks,
    time_minutes: minutes,
    bloom_level: bloom,
    related_past: [],
    exam_types: ['WAEC'],
    references: refs,
    is_active: true
  });

  const refsJ = [{ title: 'JAMB IBASS', url: 'https://www.jamb.gov.ng/', section: '' }];
  const refsW = [{ title: 'WAEC Syllabus', url: 'https://waecsyllabus.com/', section: '' }];

  const items = [];
  if (subject.slug === 'mathematics') {
    items.push(essay('Prove the angle sum of a triangle is 180°.', 'Geometry', 10, 15, 'Analyze', refsW));
    items.push(essay('Discuss applications of logarithms in computation.', 'Logarithms', 8, 12, 'Understand', refsJ));
    items.push(essay('Derive and apply AP nth-term formula to a dataset.', 'Sequences', 8, 12, 'Apply', refsJ));
    items.push(practical('Measure circle properties and estimate π using string and ruler.', 'Mensuration', 12, 20, 'Create', refsW));
    items.push(essay('Solve financial arithmetic with discount and tax scenarios.', 'Percentages', 8, 12, 'Apply', refsW));
  } else if (subject.slug === 'physics') {
    items.push(essay('Explain resonance and its applications in engineering.', 'Waves and Optics', 8, 12, 'Understand', refsW));
    items.push(practical('Determine resistivity of a wire using a metre bridge.', 'Electricity', 20, 30, 'Create', refsW));
    items.push(essay('Describe total internal reflection and fiber optics.', 'Waves and Optics', 8, 12, 'Analyze', refsW));
    items.push(practical('Verify Ohm’s law using measured V and I.', 'Electricity', 15, 25, 'Apply', refsW));
  } else if (subject.slug === 'chemistry') {
    items.push(essay('Explain acid-base titration curves and indicators.', 'Acids and Bases', 10, 15, 'Analyze', refsW));
    items.push(practical('Standardize NaOH and determine HCl concentration.', 'Analytical', 20, 30, 'Create', refsW));
    items.push(essay('Discuss periodic trends in atomic radius and ionization energy.', 'Periodic Table', 8, 12, 'Analyze', refsW));
    items.push(practical('Investigate rate of reaction versus temperature.', 'Kinetics', 15, 25, 'Apply', refsW));
  } else if (subject.slug === 'biology') {
    items.push(essay('Explain natural selection with population examples.', 'Evolution', 12, 18, 'Evaluate', refsW));
    items.push(practical('Effect of light intensity on photosynthesis in aquatic plants.', 'Photosynthesis', 20, 30, 'Create', refsW));
    items.push(essay('Describe nephron structure and function.', 'Excretion', 10, 15, 'Analyze', refsW));
    items.push(practical('Osmosis demonstration using plant tissues.', 'Cell Biology', 15, 25, 'Apply', refsW));
  } else if (subject.slug === 'english-language') {
    items.push(essay('Write an argumentative essay on social media in education.', 'Essay Writing', 20, 40, 'Create', refsW));
    items.push(essay('Summarize a passage in not more than 120 words.', 'Summary', 15, 25, 'Evaluate', refsW));
    items.push(essay('Analyze the use of personification in a poem.', 'Literature', 8, 12, 'Analyze', refsW));
    items.push(essay('Construct a coherent paragraph on reading culture.', 'Composition', 10, 20, 'Create', refsW));
  }
  return items;
}

async function main() {
  for (const s of SUBJECTS) {
    const subject = await getSubject(s.slug);
    const topicLabels = ['Algebra','Fractions','Mensuration','Functions','Simple Interest','Coordinate Geometry','Indices','Geometry','Logarithms','Sequences','Waves and Optics','Vectors','Electricity','Acids and Bases','Chemical Reactions','Organic Chemistry','Cell Biology','Plant Physiology','Human Physiology','Genetics','Classification','Essay Writing','Summary','Literature','Composition','Periodic Table','Kinetics','Analytical','Excretion','Evolution','Photosynthesis'];
    const topicIds = {};
    for (const name of topicLabels) {
      try {
        const id = await getOrCreateTopic(subject.id, name);
        topicIds[name] = id;
      } catch {}
    }
    const items = buildItems({ id: subject.id, slug: s.slug }, topicIds);
    for (const item of items) {
      const { error } = await supabase.from('exam_items').insert(item);
      if (error) console.error('Insert error', error.message);
      else process.stdout.write('.');
    }
    process.stdout.write('\n');
  }
  console.log('Exam items import complete.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});