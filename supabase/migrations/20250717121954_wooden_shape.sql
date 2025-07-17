/*
  # Rebuild Interview Management System
  
  1. New Tables
    - `interview_types` - Predefined interview types (phone, video, etc.)
    - `interview_schedules` - Interview appointments with candidates
    - `interview_feedback` - Feedback and ratings for completed interviews
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    
  3. Changes
    - Drop existing tables if they exist
    - Create new tables with proper relationships
    - Add sample interview types
*/

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS public.interview_feedback;
DROP TABLE IF EXISTS public.interview_schedules;
DROP TABLE IF EXISTS public.interview_types;

-- Create interview types table
CREATE TABLE IF NOT EXISTS public.interview_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Enable RLS on interview types
ALTER TABLE public.interview_types ENABLE ROW LEVEL SECURITY;

-- Create policy for interview types
CREATE POLICY "Interview types are viewable by everyone"
  ON public.interview_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert predefined interview types
INSERT INTO public.interview_types (id, name, description, color, order_index)
VALUES
  ('phone', 'Phone Interview', 'Initial screening call to assess basic qualifications', '#3B82F6', 1),
  ('video', 'Video Interview', 'Remote interview via video conferencing', '#8B5CF6', 2),
  ('technical', 'Technical Interview', 'Assessment of technical skills and problem-solving abilities', '#10B981', 3),
  ('panel', 'Panel Interview', 'Interview with multiple team members', '#F59E0B', 4),
  ('in_person', 'In-Person Interview', 'On-site interview at company location', '#EC4899', 5),
  ('final', 'Final Interview', 'Final round with key decision makers', '#EF4444', 6)
ON CONFLICT (id) DO NOTHING;

-- Create interview schedules table
CREATE TABLE IF NOT EXISTS public.interview_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  interview_type TEXT REFERENCES public.interview_types(id),
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  meeting_link TEXT,
  interviewer_ids UUID[],
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for interview schedules
CREATE INDEX IF NOT EXISTS idx_interview_schedules_application_id ON public.interview_schedules(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_scheduled_date ON public.interview_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_status ON public.interview_schedules(status);

-- Enable RLS on interview schedules
ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for interview schedules
CREATE POLICY "Employers can view interviews for their jobs"
  ON public.interview_schedules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      JOIN jobs ON applications.job_id = jobs.id
      WHERE applications.id = interview_schedules.application_id
      AND jobs.created_by = auth.uid()
    )
  );

CREATE POLICY "Candidates can view their own interviews"
  ON public.interview_schedules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = interview_schedules.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can manage interviews for their jobs"
  ON public.interview_schedules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      JOIN jobs ON applications.job_id = jobs.id
      WHERE applications.id = interview_schedules.application_id
      AND jobs.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      JOIN jobs ON applications.job_id = jobs.id
      WHERE applications.id = interview_schedules.application_id
      AND jobs.created_by = auth.uid()
    )
  );

-- Create interview feedback table
CREATE TABLE IF NOT EXISTS public.interview_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES public.interview_schedules(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  strengths TEXT,
  weaknesses TEXT,
  notes TEXT,
  recommendation TEXT CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for interview feedback
CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview_id ON public.interview_feedback(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_created_by ON public.interview_feedback(created_by);

-- Enable RLS on interview feedback
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for interview feedback
CREATE POLICY "Employers can view feedback for their interviews"
  ON public.interview_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interview_schedules
      JOIN applications ON interview_schedules.application_id = applications.id
      JOIN jobs ON applications.job_id = jobs.id
      WHERE interview_schedules.id = interview_feedback.interview_id
      AND jobs.created_by = auth.uid()
    )
  );

CREATE POLICY "Employers can manage feedback for their interviews"
  ON public.interview_feedback
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interview_schedules
      JOIN applications ON interview_schedules.application_id = applications.id
      JOIN jobs ON applications.job_id = jobs.id
      WHERE interview_schedules.id = interview_feedback.interview_id
      AND jobs.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_schedules
      JOIN applications ON interview_schedules.application_id = applications.id
      JOIN jobs ON applications.job_id = jobs.id
      WHERE interview_schedules.id = interview_feedback.interview_id
      AND jobs.created_by = auth.uid()
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

-- Add triggers for updated_at columns
CREATE TRIGGER update_interview_schedules_updated_at
BEFORE UPDATE ON public.interview_schedules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_feedback_updated_at
BEFORE UPDATE ON public.interview_feedback
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();