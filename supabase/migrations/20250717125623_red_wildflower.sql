/*
  # Fix Interview Management Tables

  1. New Tables
    - `interview_types` - Predefined interview types
    - `interview_feedback` - Feedback for interviews with proper foreign key relationship
  
  2. Security
    - Enable RLS on all tables
    - Add policies for employers and candidates
    
  3. Changes
    - Ensure proper foreign key relationships
    - Add necessary indexes for performance
*/

-- First, create the interview_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS interview_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Populate interview types with default values
INSERT INTO interview_types (id, name, description, color, order_index)
VALUES 
  ('phone', 'Phone Interview', 'Initial screening call', '#3B82F6', 1),
  ('video', 'Video Interview', 'Remote video interview', '#8B5CF6', 2),
  ('technical', 'Technical Interview', 'Technical assessment', '#10B981', 3),
  ('panel', 'Panel Interview', 'Interview with multiple team members', '#F59E0B', 4),
  ('in_person', 'In-Person Interview', 'On-site interview', '#EC4899', 5),
  ('final', 'Final Interview', 'Final decision round', '#EF4444', 6)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  order_index = EXCLUDED.order_index;

-- Enable RLS on interview_types
ALTER TABLE interview_types ENABLE ROW LEVEL SECURITY;

-- Create policy for interview_types
CREATE POLICY "Interview types are viewable by everyone" 
ON interview_types
FOR SELECT 
TO authenticated
USING (true);

-- Create interview_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS interview_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID NOT NULL REFERENCES interview_schedules(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  strengths TEXT,
  weaknesses TEXT,
  notes TEXT,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on interview_id for better performance
CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview_id ON interview_feedback(interview_id);

-- Enable RLS on interview_feedback
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;

-- Create policy for employers to manage feedback for their interviews
CREATE POLICY "Employers can manage feedback for their interviews"
ON interview_feedback
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM interview_schedules s
    JOIN applications a ON s.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    WHERE s.id = interview_feedback.interview_id
    AND j.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM interview_schedules s
    JOIN applications a ON s.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    WHERE s.id = interview_feedback.interview_id
    AND j.created_by = auth.uid()
  )
);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_interview_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_interview_feedback_updated_at
BEFORE UPDATE ON interview_feedback
FOR EACH ROW
EXECUTE FUNCTION update_interview_feedback_updated_at();

-- Make sure interview_schedules has the right structure
DO $$ 
BEGIN
  -- Add any missing columns to interview_schedules
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interview_schedules' AND column_name = 'status') THEN
    ALTER TABLE interview_schedules ADD COLUMN status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interview_schedules' AND column_name = 'interviewer_ids') THEN
    ALTER TABLE interview_schedules ADD COLUMN interviewer_ids UUID[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interview_schedules' AND column_name = 'notes') THEN
    ALTER TABLE interview_schedules ADD COLUMN notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interview_schedules' AND column_name = 'created_by') THEN
    ALTER TABLE interview_schedules ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interview_schedules' AND column_name = 'created_at') THEN
    ALTER TABLE interview_schedules ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interview_schedules' AND column_name = 'updated_at') THEN
    ALTER TABLE interview_schedules ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Make sure interview_schedules has RLS enabled
ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;

-- Create or replace policies for interview_schedules
CREATE POLICY IF NOT EXISTS "Candidates can view their own interviews"
ON interview_schedules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM applications a
    WHERE a.id = interview_schedules.application_id
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Employers can manage interviews for their jobs"
ON interview_schedules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.id = interview_schedules.application_id
    AND j.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.id = interview_schedules.application_id
    AND j.created_by = auth.uid()
  )
);

-- Create trigger to update updated_at column for interview_schedules
CREATE OR REPLACE FUNCTION update_interview_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_interview_schedules_updated_at
BEFORE UPDATE ON interview_schedules
FOR EACH ROW
EXECUTE FUNCTION update_interview_schedules_updated_at();