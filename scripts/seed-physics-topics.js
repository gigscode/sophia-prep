#!/usr/bin/env node

/**
 * Seed Physics Topics
 * 
 * This script seeds the Physics subject with organized topics and categories.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Physics topic categories
const physicsCategories = [
  {
    name: 'Mechanics',
    slug: 'mechanics',
    description: 'Motion, forces, energy, and mechanical systems',
    color_theme: '#EF4444', // Red
    sort_order: 1
  },
  {
    name: 'Thermal Physics',
    slug: 'thermal-physics', 
    description: 'Heat, temperature, and thermodynamic processes',
    color_theme: '#F97316', // Orange
    sort_order: 2
  },
  {
    name: 'Waves & Optics',
    slug: 'waves-optics',
    description: 'Wave properties, sound, and light phenomena',
    color_theme: '#EAB308', // Yellow
    sort_order: 3
  },
  {
    name: 'Electricity & Magnetism',
    slug: 'electricity-magnetism',
    description: 'Electric and magnetic fields, circuits, and electromagnetic phenomena',
    color_theme: '#3B82F6', // Blue
    sort_order: 4
  },
  {
    name: 'Modern Physics',
    slug: 'modern-physics',
    description: 'Atomic structure, quantum mechanics, and nuclear physics',
    color_theme: '#8B5CF6', // Purple
    sort_order: 5
  }
];

// Physics topics organized by category
const physicsTopics = {
  'mechanics': [
    { name: 'Measurements and Units', slug: 'measurements-units', difficulty: 'BASIC', estimatedTime: 45 },
    { name: 'Scalars and Vectors', slug: 'scalars-vectors', difficulty: 'INTERMEDIATE', estimatedTime: 60 },
    { name: 'Motion', slug: 'motion', difficulty: 'INTERMEDIATE', estimatedTime: 90 },
    { name: 'Gravitational Field', slug: 'gravitational-field', difficulty: 'ADVANCED', estimatedTime: 75 },
    { name: 'Equilibrium of Forces', slug: 'equilibrium-forces', difficulty: 'INTERMEDIATE', estimatedTime: 60 },
    { name: 'Work, Energy and Power', slug: 'work-energy-power', difficulty: 'INTERMEDIATE', estimatedTime: 80 },
    { name: 'Friction', slug: 'friction', difficulty: 'BASIC', estimatedTime: 50 },
    { name: 'Simple Machines', slug: 'simple-machines', difficulty: 'BASIC', estimatedTime: 55 },
    { name: 'Elasticity (Hooke\'s Law and Young\'s Modulus)', slug: 'elasticity', difficulty: 'ADVANCED', estimatedTime: 70 },
    { name: 'Pressure', slug: 'pressure', difficulty: 'INTERMEDIATE', estimatedTime: 60 },
    { name: 'Liquids at Rest', slug: 'liquids-rest', difficulty: 'INTERMEDIATE', estimatedTime: 50 }
  ],
  'thermal-physics': [
    { name: 'Temperature and Its Measurement', slug: 'temperature-measurement', difficulty: 'BASIC', estimatedTime: 40 },
    { name: 'Thermal Expansion', slug: 'thermal-expansion', difficulty: 'INTERMEDIATE', estimatedTime: 55 },
    { name: 'Gas Laws', slug: 'gas-laws', difficulty: 'INTERMEDIATE', estimatedTime: 70 },
    { name: 'Quantity of Heat', slug: 'quantity-heat', difficulty: 'INTERMEDIATE', estimatedTime: 60 },
    { name: 'Change of State', slug: 'change-state', difficulty: 'INTERMEDIATE', estimatedTime: 65 },
    { name: 'Vapours', slug: 'vapours', difficulty: 'ADVANCED', estimatedTime: 50 },
    { name: 'Structure of Matter and Kinetic Theory', slug: 'kinetic-theory', difficulty: 'ADVANCED', estimatedTime: 80 },
    { name: 'Heat Transfer', slug: 'heat-transfer', difficulty: 'INTERMEDIATE', estimatedTime: 70 }
  ],
  'waves-optics': [
    { name: 'Waves', slug: 'waves', difficulty: 'INTERMEDIATE', estimatedTime: 75 },
    { name: 'Propagation of Sound Waves', slug: 'sound-propagation', difficulty: 'INTERMEDIATE', estimatedTime: 60 },
    { name: 'Characteristics of Sound Waves', slug: 'sound-characteristics', difficulty: 'INTERMEDIATE', estimatedTime: 55 },
    { name: 'Light Energy', slug: 'light-energy', difficulty: 'BASIC', estimatedTime: 45 },
    { name: 'Reflection of Light at Plane and Curved Surfaces', slug: 'light-reflection', difficulty: 'INTERMEDIATE', estimatedTime: 70 },
    { name: 'Refraction of Light through Plane and Curved Surfaces', slug: 'light-refraction', difficulty: 'INTERMEDIATE', estimatedTime: 75 },
    { name: 'Optical Instruments', slug: 'optical-instruments', difficulty: 'ADVANCED', estimatedTime: 85 },
    { name: 'Dispersion of Light and Colours / Electromagnetic Spectrum', slug: 'light-dispersion', difficulty: 'ADVANCED', estimatedTime: 80 }
  ],
  'electricity-magnetism': [
    { name: 'Electrostatics', slug: 'electrostatics', difficulty: 'INTERMEDIATE', estimatedTime: 70 },
    { name: 'Capacitors', slug: 'capacitors', difficulty: 'ADVANCED', estimatedTime: 75 },
    { name: 'Electric Cells', slug: 'electric-cells', difficulty: 'BASIC', estimatedTime: 50 },
    { name: 'Current Electricity', slug: 'current-electricity', difficulty: 'INTERMEDIATE', estimatedTime: 80 },
    { name: 'Electrical Energy and Power', slug: 'electrical-energy-power', difficulty: 'INTERMEDIATE', estimatedTime: 65 },
    { name: 'Magnets and Magnetic Fields', slug: 'magnetic-fields', difficulty: 'INTERMEDIATE', estimatedTime: 70 },
    { name: 'Force on a Current-Carrying Conductor in a Magnetic Field', slug: 'magnetic-force', difficulty: 'ADVANCED', estimatedTime: 75 },
    { name: 'Electromagnetic Induction (including Inductance and Eddy Currents)', slug: 'electromagnetic-induction', difficulty: 'ADVANCED', estimatedTime: 90 },
    { name: 'Simple A.C. Circuits', slug: 'ac-circuits', difficulty: 'ADVANCED', estimatedTime: 85 },
    { name: 'Conduction of Electricity through Liquids and Gases', slug: 'electrical-conduction', difficulty: 'ADVANCED', estimatedTime: 70 }
  ]
};

async function getPhysicsSubject() {
  const { data, error } = await supabase
    .from('subjects')
    .select('id')
    .eq('slug', 'physics')
    .single();

  if (error || !data) {
    console.error('❌ Physics subject not found. Please ensure Physics subject exists first.');
    return null;
  }

  return data.id;
}

async function seedCategories(subjectId) {
  console.log('📂 Creating topic categories...');
  
  const categoriesToInsert = physicsCategories.map(cat => ({
    ...cat,
    subject_id: subjectId
  }));

  const { data, error } = await supabase
    .from('topic_categories')
    .insert(categoriesToInsert)
    .select('id, slug');

  if (error) {
    console.error('❌ Error creating categories:', error);
    return null;
  }

  console.log(`✅ Created ${data.length} categories`);
  
  // Return mapping of slug to id
  const categoryMap = {};
  data.forEach(cat => {
    categoryMap[cat.slug] = cat.id;
  });
  
  return categoryMap;
}

async function seedTopics(subjectId, categoryMap) {
  console.log('📚 Creating topics...');
  
  let totalTopics = 0;
  
  for (const [categorySlug, topics] of Object.entries(physicsTopics)) {
    const categoryId = categoryMap[categorySlug];
    
    if (!categoryId) {
      console.warn(`⚠️ Category ${categorySlug} not found, skipping topics`);
      continue;
    }

    const topicsToInsert = topics.map((topic, index) => ({
      subject_id: subjectId,
      category_id: categoryId,
      name: topic.name,
      slug: topic.slug,
      difficulty_level: topic.difficulty,
      estimated_study_time_minutes: topic.estimatedTime,
      sort_order: index + 1,
      topic_level: 1,
      is_active: true
    }));

    const { data, error } = await supabase
      .from('topics')
      .insert(topicsToInsert);

    if (error) {
      console.error(`❌ Error creating topics for ${categorySlug}:`, error);
      continue;
    }

    console.log(`✅ Created ${topicsToInsert.length} topics for ${categorySlug}`);
    totalTopics += topicsToInsert.length;
  }

  return totalTopics;
}

async function main() {
  console.log('🚀 Starting Physics topics seeding...\n');

  // Get Physics subject
  const subjectId = await getPhysicsSubject();
  if (!subjectId) return;

  // Create categories
  const categoryMap = await seedCategories(subjectId);
  if (!categoryMap) return;

  // Create topics
  const totalTopics = await seedTopics(subjectId, categoryMap);

  console.log('\n🎉 Physics topics seeding completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Categories: ${Object.keys(categoryMap).length}`);
  console.log(`   - Topics: ${totalTopics}`);
  console.log('\nNext steps:');
  console.log('1. Assign existing questions to appropriate topics');
  console.log('2. Update your frontend to display topics by category');
  console.log('3. Implement topic-based quiz filtering');
}

main().catch(console.error);