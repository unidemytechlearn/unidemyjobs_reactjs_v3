/*
  # Interview Management System

  1. New Tables
    - `interview_types` - Defines different types of interviews (phone, video, etc.)
    - `interview_schedules` - Stores interview appointments
    - `interview_feedback` - Stores feedback for completed interviews

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Interview Types Table
CREATE TABLE IF NOT EXISTS interview_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Enable RLS
ALTER TABLE interview_types ENABLE ROW LEVEL SECURITY;

-- Interview Types Policy
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
  ('final', 'Final Interview', 'Final decision round', '#EF4444', 6);

-- Interview Schedules Table
CREATE TABLE IF NOT EXISTS interview_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  interview_type TEXT REFERENCES interview_types(id),
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  meeting_link TEXT,
  interviewer_ids UUID[],
  notes TEXT,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')) DEFAULT 'scheduled',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_interview_schedules_application_id ON interview_schedules(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_scheduled_date ON interview_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_status ON interview_schedules(status);

-- Interview Schedules Policies
CREATE POLICY "Candidates can view their own interviews" 
  ON interview_schedules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = interview_schedules.application_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can manage interviews for their jobs" 
  ON interview_schedules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = interview_schedules.application_id
      AND j.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = interview_schedules.application_id
      AND j.created_by = auth.uid()
    )
  );

-- Interview Feedback Table
CREATE TABLE IF NOT EXISTS interview_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Enable RLS
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview_id ON interview_feedback(interview_id);

-- Interview Feedback Policies
CREATE POLICY "Employers can manage feedback for their interviews" 
  ON interview_feedback
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interview_schedules s
      JOIN applications a ON s.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      WHERE s.id = interview_feedback.interview_id
      AND j.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_schedules s
      JOIN applications a ON s.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      WHERE s.id = interview_feedback.interview_id
      AND j.created_by = auth.uid()
    )
  );

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_interview_schedules_updated_at
BEFORE UPDATE ON interview_schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_feedback_updated_at
BEFORE UPDATE ON interview_feedback
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();