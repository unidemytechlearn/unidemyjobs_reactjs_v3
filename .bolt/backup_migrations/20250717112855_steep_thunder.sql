/*
  # Interview Management System

  1. New Tables
    - `interview_types` - Defines different types of interviews
      - `id` (text, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `color` (text)
      - `icon` (text)
      - `order_index` (integer)
    
    - `interview_feedback` - Stores feedback for completed interviews
      - `id` (uuid, primary key)
      - `interview_id` (uuid, references interview_schedules)
      - `rating` (integer)
      - `strengths` (text)
      - `weaknesses` (text)
      - `notes` (text)
      - `recommendation` (text)
      - `created_by` (uuid, references users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for employers to manage interviews
    - Add policies for candidates to view their interviews
*/

-- Create interview_types table with predefined types
CREATE TABLE IF NOT EXISTS interview_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  color text NOT NULL,
  icon text,
  order_index integer NOT NULL
);

-- Insert predefined interview types
INSERT INTO interview_types (id, name, description, color, icon, order_index)
VALUES
  ('phone', 'Phone Interview', 'Initial screening call to assess basic qualifications', '#3B82F6', 'phone', 1),
  ('video', 'Video Interview', 'Remote interview via video conferencing', '#8B5CF6', 'video', 2),
  ('technical', 'Technical Interview', 'Assessment of technical skills and problem-solving abilities', '#10B981', 'code', 3),
  ('panel', 'Panel Interview', 'Interview with multiple team members', '#F59E0B', 'users', 4),
  ('in_person', 'In-Person Interview', 'Face-to-face interview at company location', '#EC4899', 'building', 5),
  ('final', 'Final Interview', 'Final round with senior leadership', '#EF4444', 'check-circle', 6);

-- Create interview_feedback table
CREATE TABLE IF NOT EXISTS interview_feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id uuid REFERENCES interview_schedules(id) ON DELETE CASCADE,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  strengths text,
  weaknesses text,
  notes text,
  recommendation text CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview_id ON interview_feedback(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_created_by ON interview_feedback(created_by);

-- Enable RLS
ALTER TABLE interview_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for interview_types
CREATE POLICY "interview_types_select_all" 
ON interview_types
FOR SELECT 
TO authenticated
USING (true);

-- Policies for interview_feedback
CREATE POLICY "interview_feedback_insert_employer" 
ON interview_feedback
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM interview_schedules is
    JOIN applications a ON is.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    JOIN profiles p ON auth.uid() = p.id
    WHERE is.id = interview_feedback.interview_id
    AND j.created_by = auth.uid()
    AND p.role = 'employer'
  )
);

CREATE POLICY "interview_feedback_select_employer" 
ON interview_feedback
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM interview_schedules is
    JOIN applications a ON is.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    JOIN profiles p ON auth.uid() = p.id
    WHERE is.id = interview_feedback.interview_id
    AND j.created_by = auth.uid()
    AND p.role = 'employer'
  )
);

CREATE POLICY "interview_feedback_update_employer" 
ON interview_feedback
FOR UPDATE 
TO authenticated
USING (
  created_by = auth.uid()
)
WITH CHECK (
  created_by = auth.uid()
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

-- Add notification trigger for interview schedule changes
CREATE OR REPLACE FUNCTION create_interview_notification()
RETURNS TRIGGER AS $$
DECLARE
  application_record RECORD;
  job_record RECORD;
  company_record RECORD;
  interview_date TEXT;
BEGIN
  -- Get application, job and company info
  SELECT * INTO application_record FROM applications WHERE id = NEW.application_id;
  SELECT * INTO job_record FROM jobs WHERE id = application_record.job_id;
  SELECT * INTO company_record FROM companies WHERE id = job_record.company_id;
  
  -- Format interview date
  interview_date := to_char(NEW.scheduled_date, 'Month DD, YYYY at HH:MI AM');
  
  -- Insert notification for candidate
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_url,
    is_read,
    metadata
  ) VALUES (
    application_record.user_id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'Interview Scheduled'
      WHEN NEW.status = 'rescheduled' THEN 'Interview Rescheduled'
      WHEN NEW.status = 'cancelled' THEN 'Interview Cancelled'
      ELSE 'Interview Updated'
    END,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'Interview scheduled for ' || job_record.title || ' at ' || company_record.name || ' on ' || interview_date
      WHEN NEW.status = 'rescheduled' THEN 'Your interview for ' || job_record.title || ' has been rescheduled to ' || interview_date
      WHEN NEW.status = 'cancelled' THEN 'Your interview for ' || job_record.title || ' has been cancelled'
      ELSE 'Your interview details have been updated'
    END,
    'application_update',
    '/dashboard/applications/' || application_record.id,
    false,
    jsonb_build_object(
      'interview_id', NEW.id,
      'job_id', job_record.id,
      'company_id', company_record.id,
      'interview_type', NEW.interview_type,
      'scheduled_date', NEW.scheduled_date,
      'status', NEW.status
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_interview_notification
AFTER INSERT OR UPDATE OF scheduled_date, status ON interview_schedules
FOR EACH ROW
EXECUTE FUNCTION create_interview_notification();

-- Update application status when interview is scheduled
CREATE OR REPLACE FUNCTION update_application_status_on_interview()
RETURNS TRIGGER AS $$
DECLARE
  current_status TEXT;
BEGIN
  -- Get current application status
  SELECT status INTO current_status FROM applications WHERE id = NEW.application_id;
  
  -- Only update if current status is 'submitted' or 'under_review'
  IF current_status IN ('submitted', 'under_review') THEN
    UPDATE applications 
    SET status = 'interview_scheduled',
        updated_at = now()
    WHERE id = NEW.application_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_application_status_on_interview
AFTER INSERT ON interview_schedules
FOR EACH ROW
EXECUTE FUNCTION update_application_status_on_interview();