-- Step 3: Sync topics from topics.md to database
-- Date: 2025-12-16
-- Description: Insert all topics from topics.md into the topics table
-- NOTE: Run step1 and step2 migrations first to add slug column

-- Mathematics Topics
INSERT INTO topics (subject_id, name, slug, order_index, is_active)
SELECT
  s.id,
  topic_name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(topic_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) as slug,
  ROW_NUMBER() OVER (ORDER BY topic_name) - 1 as order_index,
  true as is_active
FROM subjects s
CROSS JOIN (
  VALUES
    ('Number and Numeration'),
    ('Number Bases'),
    ('Fractions, Decimals, Approximations and Percentages'),
    ('Indices, Logarithms and Surds'),
    ('Sets'),
    ('Algebra'),
    ('Polynomials'),
    ('Variation'),
    ('Inequalities'),
    ('Progressions (AP & GP)'),
    ('Binary Operations'),
    ('Matrices and Determinants'),
    ('Geometry and Trigonometry'),
    ('Mensuration'),
    ('Loci'),
    ('Coordinate Geometry'),
    ('Trigonometry'),
    ('Calculus'),
    ('Differentiation'),
    ('Applications of Differentiation'),
    ('Integration'),
    ('Statistics'),
    ('Representation of Data'),
    ('Measures of Location')
) AS topics_data(topic_name)
WHERE s.slug = 'mathematics' AND s.is_active = true
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Physics Topics
INSERT INTO topics (subject_id, name, slug, order_index, is_active)
SELECT
  s.id,
  topic_name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(topic_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) as slug,
  ROW_NUMBER() OVER (ORDER BY topic_name) - 1 as order_index,
  true as is_active
FROM subjects s
CROSS JOIN (
  VALUES
    ('Measurements and Units'),
    ('Scalars and Vectors'),
    ('Motion'),
    ('Gravitational Field'),
    ('Equilibrium of Forces'),
    ('Work, Energy and Power'),
    ('Friction'),
    ('Simple Machines'),
    ('Elasticity (Hooke''s Law and Young''s Modulus)'),
    ('Pressure'),
    ('Liquids at Rest'),
    ('Temperature and Its Measurement'),
    ('Thermal Expansion'),
    ('Gas Laws'),
    ('Quantity of Heat'),
    ('Change of State'),
    ('Vapours'),
    ('Structure of Matter and Kinetic Theory'),
    ('Heat Transfer'),
    ('Waves'),
    ('Propagation of Sound Waves'),
    ('Characteristics of Sound Waves'),
    ('Light Energy'),
    ('Reflection of Light at Plane and Curved Surfaces'),
    ('Refraction of Light through Plane and Curved Surfaces'),
    ('Optical Instruments'),
    ('Dispersion of Light and Colours / Electromagnetic Spectrum'),
    ('Electrostatics'),
    ('Capacitors'),
    ('Electric Cells'),
    ('Current Electricity'),
    ('Electrical Energy and Power'),
    ('Magnets and Magnetic Fields'),
    ('Force on a Current-Carrying Conductor in a Magnetic Field'),
    ('Electromagnetic Induction (including Inductance and Eddy Currents)'),
    ('Simple A.C. Circuits'),
    ('Conduction of Electricity through Liquids and Gases')
) AS topics_data(topic_name)
WHERE s.slug = 'physics' AND s.is_active = true
ON CONFLICT (subject_id, slug) DO NOTHING;

-- English Topics
INSERT INTO topics (subject_id, name, slug, order_index, is_active)
SELECT
  s.id,
  topic_name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(topic_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) as slug,
  ROW_NUMBER() OVER (ORDER BY topic_name) - 1 as order_index,
  true as is_active
FROM subjects s
CROSS JOIN (
  VALUES
    ('Comprehension and Summary'),
    ('Comprehension Passages'),
    ('Description'),
    ('Narration'),
    ('Exposition'),
    ('Argumentation / Persuasion'),
    ('Cloze Test'),
    ('Summary Writing'),
    ('Approved Reading Text-The Lekki Headmaster'),
    ('Lexis and Structure (Synonyms Antonyms)'),
    ('Clause and Sentence Patterns'),
    ('Word Classes and Their Functions'),
    ('Grammar (Mood, Tense, Aspect, Number, Agreement / Concord, etc)'),
    ('Mechanics'),
    ('Usage (Ordinary usage, Figurative usage, Idiomatic usage)'),
    ('Oral Forms'),
    ('Vowels (Monophthongs, Diphthongs, Triphthongs)'),
    ('Consonants (Consonant clusters)'),
    ('Rhymes (Homophones)'),
    ('Word Stress (Monosyllabic words, Polysyllabic words)'),
    ('Emphatic Stress (Connected Speech)')
) AS topics_data(topic_name)
WHERE s.slug = 'english' AND s.is_active = true
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Christian Religious Studies Topics
INSERT INTO topics (subject_id, name, slug, order_index, is_active)
SELECT
  s.id,
  topic_name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(topic_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) as slug,
  ROW_NUMBER() OVER (ORDER BY topic_name) - 1 as order_index,
  true as is_active
FROM subjects s
CROSS JOIN (
  VALUES
    ('Themes from Creation to the Division of the Kingdom'),
    ('The Sovereignty of God'),
    ('The Covenant'),
    ('Leadership Qualities (Joseph, Moses, Joshua, The Judges)'),
    ('Divine Providence, Guidance and Protection'),
    ('Parental Responsibility'),
    ('Obedience and Disobedience'),
    ('A Man after God''s Own Heart (David)'),
    ('Decision Making'),
    ('Themes from the Division of the Kingdom to the Return from Exile and the Prophets'),
    ('Greed and Its Effects'),
    ('The Supremacy of God'),
    ('Religious Reforms in Judah'),
    ('Concern for Judah'),
    ('Faith, Courage and Protection'),
    ('God''s Message to Nineveh'),
    ('Social Justice, True Religion and Divine Love'),
    ('Holiness and Divine Call'),
    ('Punishment and Hope'),
    ('Themes from the Four Gospels and the Acts of the Apostles'),
    ('The Birth and Early Life of Jesus'),
    ('The Baptism and Temptation of Jesus'),
    ('Discipleship'),
    ('Miracles (Nature miracles, Miracles of resuscitation, Healing miracles etc)'),
    ('The Parables (Parables of the Kingdom, Parables on love etc)'),
    ('Sermon on the Mount (Mission of the Disciples, Mission of the Twelve)'),
    ('The Great Confession'),
    ('The Transfiguration'),
    ('The Triumphal Entry and Cleansing of the Temple'),
    ('The Last Supper'),
    ('Themes from Selected Epistles'),
    ('Justification by Faith'),
    ('The Law and Grace'),
    ('New Life in Christ'),
    ('Christians as Joint Heirs with Christ'),
    ('Humility')
) AS topics_data(topic_name)
WHERE s.slug = 'crs' AND s.is_active = true
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Economics Topics
INSERT INTO topics (subject_id, name, slug, order_index, is_active)
SELECT
  s.id,
  topic_name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(topic_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) as slug,
  ROW_NUMBER() OVER (ORDER BY topic_name) - 1 as order_index,
  true as is_active
FROM subjects s
CROSS JOIN (
  VALUES
    ('Economics as a Science'),
    ('Economic Systems'),
    ('Methods and Tools of Economic Analysis'),
    ('Theory of Demand'),
    ('Theory of Consumer Behaviour'),
    ('Theory of Supply'),
    ('Theory of Price Determination'),
    ('Theory of Production'),
    ('Theory of Costs and Revenue'),
    ('Market Structures'),
    ('National Income'),
    ('Money and Inflation'),
    ('Financial Institutions'),
    ('Public Finance'),
    ('Economic Growth and Development'),
    ('Agriculture in Nigeria'),
    ('Industry and Industrialization'),
    ('Natural Resources and the Nigerian Economy'),
    ('Business Organizations'),
    ('Population'),
    ('International Trade'),
    ('International Economic Organizations'),
    ('Factors of Production and Their Theories')
) AS topics_data(topic_name)
WHERE s.slug = 'economics' AND s.is_active = true
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Geography Topics
INSERT INTO topics (subject_id, name, slug, order_index, is_active)
SELECT
  s.id,
  topic_name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(topic_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) as slug,
  ROW_NUMBER() OVER (ORDER BY topic_name) - 1 as order_index,
  true as is_active
FROM subjects s
CROSS JOIN (
  VALUES
    ('Practical Geography'),
    ('Maps'),
    ('Scale and Measurement'),
    ('Map Reading and Interpretation'),
    ('Interpretation of Statistical Data, Maps and Diagrams'),
    ('Elementary Surveying'),
    ('Geographic Information System (GIS)'),
    ('Physical Geography'),
    ('The Earth as a Planet'),
    ('The Earth Crust'),
    ('Volcanism and Earthquakes'),
    ('Denudation Processes'),
    ('Water Bodies'),
    ('Weather and Climate'),
    ('Vegetation'),
    ('Soil'),
    ('Environmental Resources'),
    ('Environmental Interaction'),
    ('Environmental Hazards'),
    ('Environmental Conservation'),
    ('Human Geography'),
    ('Population'),
    ('Settlement'),
    ('Economic Activities'),
    ('Transportation and Communication'),
    ('World Trade'),
    ('Tourism'),
    ('Regional Geography'),
    ('Nigeria'),
    ('Economic and Human Geography of Nigeria'),
    ('ECOWAS')
) AS topics_data(topic_name)
WHERE s.slug = 'geography' AND s.is_active = true
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Commerce Topics
INSERT INTO topics (subject_id, name, slug, order_index, is_active)
SELECT
  s.id,
  topic_name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(topic_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) as slug,
  ROW_NUMBER() OVER (ORDER BY topic_name) - 1 as order_index,
  true as is_active
FROM subjects s
CROSS JOIN (
  VALUES
    ('Commerce'),
    ('Occupation'),
    ('Production'),
    ('Trade'),
    ('Purchase and Sale of Goods'),
    ('Aids to Trade'),
    ('Business Units'),
    ('Financing Business'),
    ('Trade Associations'),
    ('Money'),
    ('Stock Exchange'),
    ('Elements of Business Management'),
    ('Elements of Marketing'),
    ('Legal Aspects of Business'),
    ('Information and Communication Technology (ICT)'),
    ('Business Environment and Social Responsibility')
) AS topics_data(topic_name)
WHERE s.slug = 'commerce' AND s.is_active = true
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Verify the sync
SELECT
  s.name as subject,
  COUNT(t.id) as topic_count
FROM subjects s
LEFT JOIN topics t ON s.id = t.subject_id
WHERE s.slug IN ('mathematics', 'physics', 'english', 'crs', 'economics', 'geography', 'commerce')
GROUP BY s.name
ORDER BY s.name;

