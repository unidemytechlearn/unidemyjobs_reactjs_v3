/*
  # Interview Management System

  1. New Tables
    - `interview_types` - Defines different types of interviews
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text)
      - `order_index` (integer)
    
    - `interview_statuses` - Defines possible interview statuses
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text)
      - `color` (text)
      - `icon` (text)
      - `order_index` (integer)
    
    - `interviews` - Stores interview details
      - `id` (uuid, primary key)
      - `application_id` (uuid, foreign key to applications)
      - `type` (text, foreign key to interview_types)
      - `status` (text, foreign key to interview_statuses)
      - `scheduled_at` (timestamptz)
      - `duration_minutes` (integer)
      - `location` (text)
      - `meeting_link` (text)
      - `notes` (text)
      - `feedback` (jsonb)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `interview_participants` - Stores participants for each interview
      - `id` (uuid, primary key)
      - `interview_id` (uuid, foreign key to interviews)
      - `user_id` (uuid, foreign key to users)
      - `role` (text)
      - `status` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `interview_feedback` - Stores feedback from interviewers
      - `id` (uuid, primary key)
      - `interview_id` (uuid, foreign key to interviews)
      - `evaluator_id` (uuid, foreign key to users)
      - `rating` (integer)
      - `strengths` (text)
      - `weaknesses` (text)
      - `notes` (text)
      - `recommendation` (text)
      - `is_visible_to_candidate` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Create functions for notifications and status updates
    
  3. Changes
    - Add interview-related notification types
    - Create triggers for automated notifications
*/

-- Create interview_types table
CREATE TABLE IF NOT EXISTS interview_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL
);

-- Create interview_statuses table
CREATE TABLE IF NOT EXISTS interview_statuses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  type TEXT NOT NULL REFERENCES interview_types(id),
  status TEXT NOT NULL REFERENCES interview_statuses(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  location TEXT,
  meeting_link TEXT,
  notes TEXT,
  feedback JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create interview_participants table
CREATE TABLE IF NOT EXISTS interview_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('interviewer', 'candidate', 'observer')),
  status TEXT NOT NULL CHECK (status IN ('invited', 'confirmed', 'declined', 'attended', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create interview_feedback table
CREATE TABLE IF NOT EXISTS interview_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  strengths TEXT,
  weaknesses TEXT,
  notes TEXT,
  recommendation TEXT CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),
  is_visible_to_candidate BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add unique constraint to prevent duplicate feedback
ALTER TABLE interview_feedback 
  ADD CONSTRAINT unique_interview_evaluator 
  UNIQUE (interview_id, evaluator_id);

-- Add unique constraint to prevent duplicate participants
ALTER TABLE interview_participants 
  ADD CONSTRAINT unique_interview_participant 
  UNIQUE (interview_id, user_id);

-- Enable Row Level Security
ALTER TABLE interview_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for interview_types
CREATE POLICY "interview_types_select_all" 
  ON interview_types 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Create RLS policies for interview_statuses
CREATE POLICY "interview_statuses_select_all" 
  ON interview_statuses 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Create RLS policies for interviews
CREATE POLICY "interviews_select_for_employers" 
  ON interviews 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE a.id = interviews.application_id
      AND j.created_by = auth.uid()
      AND p.role = 'employer'
    )
  );

CREATE POLICY "interviews_select_for_candidates" 
  ON interviews 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN interview_participants ip ON ip.interview_id = interviews.id
      WHERE a.id = interviews.application_id
      AND a.user_id = auth.uid()
      AND ip.user_id = auth.uid()
      AND ip.role = 'candidate'
    )
  );

CREATE POLICY "interviews_insert_for_employers" 
  ON interviews 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE a.id = interviews.application_id
      AND j.created_by = auth.uid()
      AND p.role = 'employer'
    )
  );

CREATE POLICY "interviews_update_for_employers" 
  ON interviews 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE a.id = interviews.application_id
      AND j.created_by = auth.uid()
      AND p.role = 'employer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE a.id = interviews.application_id
      AND j.created_by = auth.uid()
      AND p.role = 'employer'
    )
  );

CREATE POLICY "interviews_delete_for_employers" 
  ON interviews 
  FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE a.id = interviews.application_id
      AND j.created_by = auth.uid()
      AND p.role = 'employer'
    )
  );

-- Create RLS policies for interview_participants
CREATE POLICY "interview_participants_select_for_employers" 
  ON interview_participants 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = interview_participants.interview_id
      AND j.created_by = auth.uid()
      AND p.role = 'employer'
    )
  );

CREATE POLICY "interview_participants_select_for_candidates" 
  ON interview_participants 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM interviews i
      JOIN applications a ON i.application_id = a.id
      WHERE i.id = interview_participants.interview_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "interview_participants_insert_for_employers" 
  ON interview_participants 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = interview_participants.interview_id
      AND j.created_by = auth.uid()
      AND p.role = 'employer'
    )
  );

CREATE POLICY "interview_participants_update_for_employers" 
  ON interview_participants 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = interview_participants.interview_id
      AND j.created_by = auth.uid()
      AND p.role = 'employer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = interview_participants.interview_id
      AND j.created_by = auth.uid()
      AND p.role = 'employer'
    )
  );

CREATE POLICY "interview_participants_update_for_candidates" 
  ON interview_participants 
  FOR UPDATE 
  TO authenticated 
  USING (
    interview_participants.user_id = auth.uid() AND
    interview_participants.role = 'candidate'
  )
  WITH CHECK (
    interview_participants.user_id = auth.uid() AND
    interview_participants.role = 'candidate' AND
    interview_participants.status IN ('confirmed', 'declined')
  );

-- Create RLS policies for interview_feedback
CREATE POLICY "interview_feedback_select_for_employers" 
  ON interview_feedback 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = interview_feedback.interview_id
      AND j.created_by = auth.uid()
      AND p.role = 'employer'
    )
  );

CREATE POLICY "interview_feedback_select_for_candidates" 
  ON interview_feedback 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM interviews i
      JOIN applications a ON i.application_id = a.id
      WHERE i.id = interview_feedback.interview_id
      AND a.user_id = auth.uid()
      AND interview_feedback.is_visible_to_candidate = true
    )
  );

CREATE POLICY "interview_feedback_insert_for_evaluators" 
  ON interview_feedback 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    interview_feedback.evaluator_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM interviews i
      JOIN interview_participants ip ON i.id = ip.interview_id
      WHERE i.id = interview_feedback.interview_id
      AND ip.user_id = auth.uid()
      AND ip.role = 'interviewer'
    )
  );

CREATE POLICY "interview_feedback_update_for_evaluators" 
  ON interview_feedback 
  FOR UPDATE 
  TO authenticated 
  USING (
    interview_feedback.evaluator_id = auth.uid()
  )
  WITH CHECK (
    interview_feedback.evaluator_id = auth.uid()
  );

-- Insert default interview types
INSERT INTO interview_types (id, name, description, order_index)
VALUES
  ('phone', 'Phone Interview', 'Initial screening call to assess basic qualifications', 1),
  ('video', 'Video Interview', 'Remote interview conducted via video conferencing', 2),
  ('technical', 'Technical Interview', 'Assessment of technical skills and problem-solving abilities', 3),
  ('behavioral', 'Behavioral Interview', 'Evaluation of soft skills and cultural fit', 4),
  ('panel', 'Panel Interview', 'Interview with multiple team members', 5),
  ('onsite', 'Onsite Interview', 'In-person interview at company location', 6),
  ('final', 'Final Interview', 'Final round with senior leadership', 7)
ON CONFLICT (id) DO NOTHING;

-- Insert default interview statuses
INSERT INTO interview_statuses (id, name, description, color, icon, order_index)
VALUES
  ('scheduled', 'Scheduled', 'Interview has been scheduled', '#3B82F6', 'calendar', 1),
  ('confirmed', 'Confirmed', 'Candidate has confirmed attendance', '#10B981', 'check-circle', 2),
  ('in_progress', 'In Progress', 'Interview is currently taking place', '#6366F1', 'clock', 3),
  ('completed', 'Completed', 'Interview has been completed', '#059669', 'check', 4),
  ('cancelled', 'Cancelled', 'Interview has been cancelled', '#EF4444', 'x-circle', 5),
  ('rescheduled', 'Rescheduled', 'Interview has been rescheduled', '#F59E0B', 'refresh-cw', 6),
  ('no_show', 'No Show', 'Candidate did not attend the interview', '#DC2626', 'user-x', 7)
ON CONFLICT (id) DO NOTHING;

-- Create function to update application status when interview is scheduled
CREATE OR REPLACE FUNCTION update_application_status_on_interview_scheduled()
RETURNS TRIGGER AS $$
BEGIN
  -- Update application status to interview_scheduled if it's in an earlier stage
  UPDATE applications
  SET status = 'interview_scheduled'
  WHERE id = NEW.application_id
  AND status IN ('submitted', 'under_review');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update application status when interview is scheduled
CREATE TRIGGER trigger_update_application_status_on_interview_scheduled
AFTER INSERT ON interviews
FOR EACH ROW
EXECUTE FUNCTION update_application_status_on_interview_scheduled();

-- Create function to update application status when interview is completed
CREATE OR REPLACE FUNCTION update_application_status_on_interview_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update application status to interview_completed
    UPDATE applications
    SET status = 'interview_completed'
    WHERE id = NEW.application_id
    AND status = 'interview_scheduled';
    
    -- Create notification for candidate
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      action_url,
      metadata
    )
    SELECT 
      a.user_id,
      'Interview Completed',
      'Your interview for ' || j.title || ' at ' || c.name || ' has been marked as completed.',
      'application_update',
      '/dashboard/applications/' || a.id,
      jsonb_build_object(
        'application_id', a.id,
        'interview_id', NEW.id,
        'job_id', j.id,
        'company_id', j.company_id
      )
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    WHERE a.id = NEW.application_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update application status when interview is completed
CREATE TRIGGER trigger_update_application_status_on_interview_completed
AFTER UPDATE ON interviews
FOR EACH ROW
EXECUTE FUNCTION update_application_status_on_interview_completed();

-- Create function to send notification when interview is scheduled
CREATE OR REPLACE FUNCTION create_interview_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for candidate
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_url,
    metadata
  )
  SELECT 
    a.user_id,
    'Interview Scheduled',
    'You have an interview scheduled for ' || j.title || ' at ' || c.name || ' on ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY at HH:MI AM'),
    'application_update',
    '/dashboard/applications/' || a.id,
    jsonb_build_object(
      'application_id', a.id,
      'interview_id', NEW.id,
      'job_id', j.id,
      'company_id', j.company_id,
      'scheduled_at', NEW.scheduled_at,
      'duration_minutes', NEW.duration_minutes,
      'type', NEW.type
    )
  FROM applications a
  JOIN jobs j ON a.job_id = j.id
  JOIN companies c ON j.company_id = c.id
  WHERE a.id = NEW.application_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to send notification when interview is scheduled
CREATE TRIGGER trigger_create_interview_notification
AFTER INSERT ON interviews
FOR EACH ROW
EXECUTE FUNCTION create_interview_notification();

-- Create function to send notification when interview is updated
CREATE OR REPLACE FUNCTION update_interview_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.scheduled_at != OLD.scheduled_at OR NEW.status != OLD.status THEN
    -- Create notification for candidate
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      action_url,
      metadata
    )
    SELECT 
      a.user_id,
      CASE
        WHEN NEW.status != OLD.status THEN 'Interview Status Updated'
        ELSE 'Interview Rescheduled'
      END,
      CASE
        WHEN NEW.status != OLD.status THEN 'Your interview status has been updated to ' || NEW.status
        ELSE 'Your interview has been rescheduled to ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY at HH:MI AM')
      END,
      'application_update',
      '/dashboard/applications/' || a.id,
      jsonb_build_object(
        'application_id', a.id,
        'interview_id', NEW.id,
        'job_id', j.id,
        'company_id', j.company_id,
        'scheduled_at', NEW.scheduled_at,
        'duration_minutes', NEW.duration_minutes,
        'type', NEW.type,
        'status', NEW.status,
        'old_status', OLD.status,
        'old_scheduled_at', OLD.scheduled_at
      )
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    WHERE a.id = NEW.application_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to send notification when interview is updated
CREATE TRIGGER trigger_update_interview_notification
AFTER UPDATE ON interviews
FOR EACH ROW
EXECUTE FUNCTION update_interview_notification();

-- Create function to update interview status based on participant status
CREATE OR REPLACE FUNCTION update_interview_status_from_participant()
RETURNS TRIGGER AS $$
BEGIN
  -- If candidate declines, update interview status to cancelled
  IF NEW.role = 'candidate' AND NEW.status = 'declined' AND OLD.status != 'declined' THEN
    UPDATE interviews
    SET status = 'cancelled'
    WHERE id = NEW.interview_id;
  END IF;
  
  -- If candidate confirms, update interview status to confirmed
  IF NEW.role = 'candidate' AND NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    UPDATE interviews
    SET status = 'confirmed'
    WHERE id = NEW.interview_id
    AND status = 'scheduled';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update interview status based on participant status
CREATE TRIGGER trigger_update_interview_status_from_participant
AFTER UPDATE ON interview_participants
FOR EACH ROW
EXECUTE FUNCTION update_interview_status_from_participant();

-- Update notifications table to add new notification types
DO $$
BEGIN
  -- Check if the type column exists and has the constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'notifications' AND column_name = 'type'
  ) THEN
    -- Alter the existing check constraint to include new notification types
    ALTER TABLE notifications 
    DROP CONSTRAINT IF EXISTS notifications_type_check;
    
    ALTER TABLE notifications 
    ADD CONSTRAINT notifications_type_check 
    CHECK (type = ANY (ARRAY[
      'job_alert'::text, 
      'application_update'::text, 
      'profile_view'::text, 
      'system'::text, 
      'marketing'::text,
      'interview_scheduled'::text,
      'interview_updated'::text,
      'interview_reminder'::text,
      'interview_feedback'::text
    ]));
  END IF;
END $$;

-- Create a trigger function for updating the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for all tables
CREATE TRIGGER update_interviews_updated_at
BEFORE UPDATE ON interviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_feedback_updated_at
BEFORE UPDATE ON interview_feedback
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();