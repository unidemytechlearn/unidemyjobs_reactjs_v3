/*
  # Create interview types table

  1. New Tables
    - `interview_types` - Stores predefined interview types with their display properties
      - `id` (text, primary key) - Unique identifier for the interview type
      - `name` (text) - Display name for the interview type
      - `description` (text) - Description of the interview type
      - `color` (text) - Color code for UI display
      - `order_index` (integer) - Order for display in UI
*/

-- Create interview types table if it doesn't exist
CREATE TABLE IF NOT EXISTS interview_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Enable RLS
ALTER TABLE interview_types ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing interview types
CREATE POLICY "Interview types are viewable by everyone"
  ON interview_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default interview types if table is empty
INSERT INTO interview_types (id, name, description, color, order_index)
SELECT * FROM (
  VALUES
    ('phone', 'Phone Interview', 'Initial screening call', '#3B82F6', 1),
    ('video', 'Video Interview', 'Remote video interview', '#8B5CF6', 2),
    ('technical', 'Technical Interview', 'Technical assessment', '#10B981', 3),
    ('panel', 'Panel Interview', 'Interview with multiple team members', '#F59E0B', 4),
    ('in_person', 'In-Person Interview', 'On-site interview', '#EC4899', 5),
    ('final', 'Final Interview', 'Final decision round', '#EF4444', 6)
) AS data(id, name, description, color, order_index)
WHERE NOT EXISTS (SELECT 1 FROM interview_types LIMIT 1);