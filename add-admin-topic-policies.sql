-- Add admin policies for topics management
-- Run this to allow admins to manage topics

-- Admin policies for topics
CREATE POLICY "Admins can manage topics"
  ON topics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

-- Admin policies for topic categories  
CREATE POLICY "Admins can manage topic categories"
  ON topic_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

SELECT 'Admin topic policies created!' as result;