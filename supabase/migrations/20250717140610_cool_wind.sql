/*
  # Create interview types table

  1. New Tables
    - `interview_types`
      - `id` (text, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `color` (text, not null)
      - `order_index` (integer, not null)
  2. Security
    - Enable RLS on `interview_types` table
    - Add policy for authenticated users to view interview types
*/

-- Create interview types table
CREATE TABLE IF NOT EXISTS interview_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Enable RLS
ALTER TABLE interview_types ENABLE ROW LEVEL SECURITY;

-- Add policy for viewing interview types
CREATE POLICY "Interview types are viewable by everyone" 
  ON interview_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default interview types
INSERT INTO interview_types (id, name, description, color, order_index)
VALUES 
  ('phone', 'Phone Interview', 'Initial screening call', '#3B82F6', 1),
  ('video', 'Video Interview', 'Remote video interview', '#8B5CF6', 2),
  ('technical', 'Technical Interview', 'Technical assessment', '#10B981', 3),
  ('panel', 'Panel Interview', 'Interview with multiple team members', '#F59E0B', 4),
  ('in_person', 'In-Person Interview', 'On-site interview', '#EC4899', 5),
  ('final', 'Final Interview', 'Final decision round', '#EF4444', 6)
ON CONFLICT (id) DO NOTHING;