-- Direct SQL to seed Physics topics (bypasses RLS)
-- Run this in Supabase SQL Editor

-- Get Physics subject ID
DO $$
DECLARE
    physics_subject_id UUID;
    mechanics_cat_id UUID;
    thermal_cat_id UUID;
    waves_cat_id UUID;
    electricity_cat_id UUID;
BEGIN
    -- Get Physics subject ID
    SELECT id INTO physics_subject_id 
    FROM subjects 
    WHERE slug = 'physics';
    
    IF physics_subject_id IS NULL THEN
        RAISE EXCEPTION 'Physics subject not found';
    END IF;
    
    -- Insert topic categories
    INSERT INTO topic_categories (subject_id, name, slug, description, color_theme, sort_order)
    VALUES 
        (physics_subject_id, 'Mechanics', 'mechanics', 'Motion, forces, energy, and mechanical systems', '#EF4444', 1),
        (physics_subject_id, 'Thermal Physics', 'thermal-physics', 'Heat, temperature, and thermodynamic processes', '#F97316', 2),
        (physics_subject_id, 'Waves & Optics', 'waves-optics', 'Wave properties, sound, and light phenomena', '#EAB308', 3),
        (physics_subject_id, 'Electricity & Magnetism', 'electricity-magnetism', 'Electric and magnetic fields, circuits, and electromagnetic phenomena', '#3B82F6', 4)
    ON CONFLICT (subject_id, slug) DO NOTHING;
    
    -- Get category IDs
    SELECT id INTO mechanics_cat_id FROM topic_categories WHERE subject_id = physics_subject_id AND slug = 'mechanics';
    SELECT id INTO thermal_cat_id FROM topic_categories WHERE subject_id = physics_subject_id AND slug = 'thermal-physics';
    SELECT id INTO waves_cat_id FROM topic_categories WHERE subject_id = physics_subject_id AND slug = 'waves-optics';
    SELECT id INTO electricity_cat_id FROM topic_categories WHERE subject_id = physics_subject_id AND slug = 'electricity-magnetism';
    
    -- Insert Mechanics topics
    INSERT INTO topics (subject_id, category_id, name, slug, difficulty_level, estimated_study_time_minutes, sort_order)
    VALUES 
        (physics_subject_id, mechanics_cat_id, 'Measurements and Units', 'measurements-units', 'BASIC', 45, 1),
        (physics_subject_id, mechanics_cat_id, 'Scalars and Vectors', 'scalars-vectors', 'INTERMEDIATE', 60, 2),
        (physics_subject_id, mechanics_cat_id, 'Motion', 'motion', 'INTERMEDIATE', 90, 3),
        (physics_subject_id, mechanics_cat_id, 'Gravitational Field', 'gravitational-field', 'ADVANCED', 75, 4),
        (physics_subject_id, mechanics_cat_id, 'Equilibrium of Forces', 'equilibrium-forces', 'INTERMEDIATE', 60, 5),
        (physics_subject_id, mechanics_cat_id, 'Work, Energy and Power', 'work-energy-power', 'INTERMEDIATE', 80, 6),
        (physics_subject_id, mechanics_cat_id, 'Friction', 'friction', 'BASIC', 50, 7),
        (physics_subject_id, mechanics_cat_id, 'Simple Machines', 'simple-machines', 'BASIC', 55, 8),
        (physics_subject_id, mechanics_cat_id, 'Elasticity (Hooke''s Law and Young''s Modulus)', 'elasticity', 'ADVANCED', 70, 9),
        (physics_subject_id, mechanics_cat_id, 'Pressure', 'pressure', 'INTERMEDIATE', 60, 10),
        (physics_subject_id, mechanics_cat_id, 'Liquids at Rest', 'liquids-rest', 'INTERMEDIATE', 50, 11)
    ON CONFLICT (subject_id, slug) DO NOTHING;
    
    -- Insert Thermal Physics topics
    INSERT INTO topics (subject_id, category_id, name, slug, difficulty_level, estimated_study_time_minutes, sort_order)
    VALUES 
        (physics_subject_id, thermal_cat_id, 'Temperature and Its Measurement', 'temperature-measurement', 'BASIC', 40, 1),
        (physics_subject_id, thermal_cat_id, 'Thermal Expansion', 'thermal-expansion', 'INTERMEDIATE', 55, 2),
        (physics_subject_id, thermal_cat_id, 'Gas Laws', 'gas-laws', 'INTERMEDIATE', 70, 3),
        (physics_subject_id, thermal_cat_id, 'Quantity of Heat', 'quantity-heat', 'INTERMEDIATE', 60, 4),
        (physics_subject_id, thermal_cat_id, 'Change of State', 'change-state', 'INTERMEDIATE', 65, 5),
        (physics_subject_id, thermal_cat_id, 'Vapours', 'vapours', 'ADVANCED', 50, 6),
        (physics_subject_id, thermal_cat_id, 'Structure of Matter and Kinetic Theory', 'kinetic-theory', 'ADVANCED', 80, 7),
        (physics_subject_id, thermal_cat_id, 'Heat Transfer', 'heat-transfer', 'INTERMEDIATE', 70, 8)
    ON CONFLICT (subject_id, slug) DO NOTHING;
    
    -- Insert Waves & Optics topics
    INSERT INTO topics (subject_id, category_id, name, slug, difficulty_level, estimated_study_time_minutes, sort_order)
    VALUES 
        (physics_subject_id, waves_cat_id, 'Waves', 'waves', 'INTERMEDIATE', 75, 1),
        (physics_subject_id, waves_cat_id, 'Propagation of Sound Waves', 'sound-propagation', 'INTERMEDIATE', 60, 2),
        (physics_subject_id, waves_cat_id, 'Characteristics of Sound Waves', 'sound-characteristics', 'INTERMEDIATE', 55, 3),
        (physics_subject_id, waves_cat_id, 'Light Energy', 'light-energy', 'BASIC', 45, 4),
        (physics_subject_id, waves_cat_id, 'Reflection of Light at Plane and Curved Surfaces', 'light-reflection', 'INTERMEDIATE', 70, 5),
        (physics_subject_id, waves_cat_id, 'Refraction of Light through Plane and Curved Surfaces', 'light-refraction', 'INTERMEDIATE', 75, 6),
        (physics_subject_id, waves_cat_id, 'Optical Instruments', 'optical-instruments', 'ADVANCED', 85, 7),
        (physics_subject_id, waves_cat_id, 'Dispersion of Light and Colours / Electromagnetic Spectrum', 'light-dispersion', 'ADVANCED', 80, 8)
    ON CONFLICT (subject_id, slug) DO NOTHING;
    
    -- Insert Electricity & Magnetism topics
    INSERT INTO topics (subject_id, category_id, name, slug, difficulty_level, estimated_study_time_minutes, sort_order)
    VALUES 
        (physics_subject_id, electricity_cat_id, 'Electrostatics', 'electrostatics', 'INTERMEDIATE', 70, 1),
        (physics_subject_id, electricity_cat_id, 'Capacitors', 'capacitors', 'ADVANCED', 75, 2),
        (physics_subject_id, electricity_cat_id, 'Electric Cells', 'electric-cells', 'BASIC', 50, 3),
        (physics_subject_id, electricity_cat_id, 'Current Electricity', 'current-electricity', 'INTERMEDIATE', 80, 4),
        (physics_subject_id, electricity_cat_id, 'Electrical Energy and Power', 'electrical-energy-power', 'INTERMEDIATE', 65, 5),
        (physics_subject_id, electricity_cat_id, 'Magnets and Magnetic Fields', 'magnetic-fields', 'INTERMEDIATE', 70, 6),
        (physics_subject_id, electricity_cat_id, 'Force on a Current-Carrying Conductor in a Magnetic Field', 'magnetic-force', 'ADVANCED', 75, 7),
        (physics_subject_id, electricity_cat_id, 'Electromagnetic Induction (including Inductance and Eddy Currents)', 'electromagnetic-induction', 'ADVANCED', 90, 8),
        (physics_subject_id, electricity_cat_id, 'Simple A.C. Circuits', 'ac-circuits', 'ADVANCED', 85, 9),
        (physics_subject_id, electricity_cat_id, 'Conduction of Electricity through Liquids and Gases', 'electrical-conduction', 'ADVANCED', 70, 10)
    ON CONFLICT (subject_id, slug) DO NOTHING;
    
    RAISE NOTICE 'Physics topics seeded successfully!';
    RAISE NOTICE 'Categories: 4, Topics: 37';
END $$;

-- Verify the seeding
SELECT 'Verification Results:' as info;

SELECT 
    tc.name as category,
    COUNT(t.id) as topic_count
FROM topic_categories tc
LEFT JOIN topics t ON tc.id = t.category_id
WHERE tc.subject_id = (SELECT id FROM subjects WHERE slug = 'physics')
GROUP BY tc.id, tc.name, tc.sort_order
ORDER BY tc.sort_order;