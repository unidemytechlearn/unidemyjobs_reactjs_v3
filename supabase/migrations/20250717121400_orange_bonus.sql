/*
  # Create Interview Types Table

  1. New Tables
    - `interview_types`
      - `id` (text, primary key) - Unique identifier for interview type
      - `name` (text) - Display name of the interview type
      - `description` (text) - Description of the interview type
      - `color` (text) - Color code for UI display
      - `order_index` (integer) - Order for displaying types

  2. Security
    - Enable RLS on `interview_types` table
    - Add policy for authenticated users to read interview types

  3. Initial Data
    - Insert common interview types (phone, video, technical, panel, in-person, final)
*/

-- Create interview_types table
CREATE TABLE IF NOT EXISTS interview_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  color text NOT NULL,
  order_index integer NOT NULL
);

-- Enable RLS
ALTER TABLE interview_types ENABLE ROW LEVEL SECURITY;

-- Create policy for reading interview types
CREATE POLICY "Interview types are viewable by everyone"
  ON interview_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert initial interview types
INSERT INTO interview_types (id, name, description, color, order_index) VALUES
  ('phone', 'Phone Screen', 'Initial screening call', '#4F46E5', 1),
  ('video', 'Video Interview', 'Virtual interview via video call', '#8B5CF6', 2),
  ('technical', 'Technical Interview', 'Assessment of technical skills', '#10B981', 3),
  ('panel', 'Panel Interview', 'Interview with multiple team members', '#F59E0B', 4),
  ('in_person', 'In-Person Interview', 'On-site interview at the office', '#EC4899', 5),
  ('final', 'Final Interview', 'Last stage interview with leadership', '#EF4444', 6)
ON CONFLICT (id) DO NOTHING;