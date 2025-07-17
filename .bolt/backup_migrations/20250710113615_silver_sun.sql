/*
  # Application Status Tracking System

  1. New Tables
    - `application_status_timeline` - Track status changes over time
    - `application_status_metadata` - Status display information

  2. Functions
    - Status timeline management
    - Notification system for status changes
    - Helper functions for UI display

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies for data access
*/

-- Create application status timeline table if it doesn't exist
CREATE TABLE IF NOT EXISTS application_status_timeline (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'under_review', 'interview_scheduled', 'interview_completed', 'offer_made', 'accepted', 'rejected', 'withdrawn')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  is_current BOOLEAN DEFAULT true
);

-- Enable RLS on the new table
ALTER TABLE application_status_timeline ENABLE ROW LEVEL SECURITY;

-- Create policies for application_status_timeline
CREATE POLICY "Users can view their own application status timeline"
  ON application_status_timeline
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = application_status_timeline.application_id 
      AND applications.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_application_status_timeline_application_id 
  ON application_status_timeline(application_id);
CREATE INDEX IF NOT EXISTS idx_application_status_timeline_is_current 
  ON application_status_timeline(is_current);

-- Function to update application status timeline
CREATE OR REPLACE FUNCTION update_application_status_timeline()
RETURNS TRIGGER AS $$
BEGIN
  -- Set all previous status entries for this application to not current
  UPDATE application_status_timeline
  SET is_current = false
  WHERE application_id = NEW.id AND is_current = true;
  
  -- Insert new status entry
  INSERT INTO application_status_timeline (
    application_id,
    status,
    notes,
    created_by,
    is_current
  ) VALUES (
    NEW.id,
    NEW.status,
    'Status updated to ' || NEW.status,
    auth.uid(),
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger for application status updates
DROP TRIGGER IF EXISTS trigger_update_application_status_timeline ON applications;
CREATE TRIGGER trigger_update_application_status_timeline
  AFTER UPDATE OF status ON applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_application_status_timeline();

-- Function to create initial status timeline entry
CREATE OR REPLACE FUNCTION create_initial_status_timeline()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert initial status entry
  INSERT INTO application_status_timeline (
    application_id,
    status,
    notes,
    created_by,
    is_current
  ) VALUES (
    NEW.id,
    NEW.status,
    'Application submitted',
    NEW.user_id,
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new applications
DROP TRIGGER IF EXISTS trigger_create_initial_status_timeline ON applications;
CREATE TRIGGER trigger_create_initial_status_timeline
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_status_timeline();

-- Create function to get application status timeline
CREATE OR REPLACE FUNCTION get_application_status_timeline(target_application_id UUID)
RETURNS TABLE (
  timeline_id UUID,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  is_current BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ast.id,
    ast.status,
    ast.notes,
    ast.created_at,
    ast.is_current
  FROM 
    application_status_timeline ast
  WHERE 
    ast.application_id = target_application_id
  ORDER BY 
    ast.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create notification for status changes
CREATE OR REPLACE FUNCTION notify_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
  job_title TEXT;
  company_name TEXT;
BEGIN
  -- Get user_id, job title and company name
  SELECT 
    a.user_id, 
    j.title, 
    c.name
  INTO 
    user_id, 
    job_title, 
    company_name
  FROM 
    applications a
    JOIN jobs j ON a.job_id = j.id
    LEFT JOIN companies c ON j.company_id = c.id
  WHERE 
    a.id = NEW.id;

  -- Create notification for status change
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_url,
    metadata
  ) VALUES (
    user_id,
    'Application Status Updated',
    'Your application for ' || job_title || ' at ' || COALESCE(company_name, 'Unknown Company') || ' has been updated to ' || NEW.status,
    'application_update',
    '/dashboard/applications',
    jsonb_build_object(
      'application_id', NEW.id,
      'job_title', job_title,
      'company_name', company_name,
      'new_status', NEW.status,
      'old_status', OLD.status
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for application status change notifications
DROP TRIGGER IF EXISTS trigger_notify_application_status_change ON applications;
CREATE TRIGGER trigger_notify_application_status_change
  AFTER UPDATE OF status ON applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_application_status_change();

-- Add status descriptions to help with UI display
CREATE TABLE IF NOT EXISTS application_status_metadata (
  status TEXT PRIMARY KEY CHECK (status IN ('submitted', 'under_review', 'interview_scheduled', 'interview_completed', 'offer_made', 'accepted', 'rejected', 'withdrawn')),
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Insert status metadata if not exists
INSERT INTO application_status_metadata (status, display_name, description, color, icon, order_index)
VALUES
  ('submitted', 'Submitted', 'Your application has been received by the employer', 'bg-blue-100 text-blue-700', 'send', 1),
  ('under_review', 'Under Review', 'Your application is being reviewed by the hiring team', 'bg-yellow-100 text-yellow-700', 'search', 2),
  ('interview_scheduled', 'Interview Scheduled', 'You have been selected for an interview', 'bg-purple-100 text-purple-700', 'calendar', 3),
  ('interview_completed', 'Interview Completed', 'Your interview has been completed and is being evaluated', 'bg-indigo-100 text-indigo-700', 'check-square', 4),
  ('offer_made', 'Offer Made', 'Congratulations! You have received a job offer', 'bg-green-100 text-green-700', 'award', 5),
  ('accepted', 'Accepted', 'You have accepted the job offer', 'bg-green-100 text-green-700', 'check-circle', 6),
  ('rejected', 'Rejected', 'Your application was not selected for this position', 'bg-red-100 text-red-700', 'x-circle', 7),
  ('withdrawn', 'Withdrawn', 'You have withdrawn your application', 'bg-gray-100 text-gray-700', 'x', 8)
ON CONFLICT (status) DO UPDATE
SET 
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  order_index = EXCLUDED.order_index;

-- Enable RLS on the status metadata table
ALTER TABLE application_status_metadata ENABLE ROW LEVEL SECURITY;

-- Create policy for application_status_metadata
CREATE POLICY "application_status_metadata_select_all"
  ON application_status_metadata
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to get application status with metadata
CREATE OR REPLACE FUNCTION get_application_status_with_metadata(target_application_id UUID)
RETURNS TABLE (
  application_id UUID,
  current_status TEXT,
  display_name TEXT,
  description TEXT,
  color TEXT,
  icon TEXT,
  order_index INTEGER,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.status,
    asm.display_name,
    asm.description,
    asm.color,
    asm.icon,
    asm.order_index,
    a.updated_at
  FROM 
    applications a
    JOIN application_status_metadata asm ON a.status = asm.status
  WHERE 
    a.id = target_application_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get application timeline with metadata
CREATE OR REPLACE FUNCTION get_application_timeline_with_metadata(target_application_id UUID)
RETURNS TABLE (
  timeline_id UUID,
  application_id UUID,
  timeline_status TEXT,
  display_name TEXT,
  description TEXT,
  color TEXT,
  icon TEXT,
  order_index INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ,
  is_current BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ast.id,
    ast.application_id,
    ast.status,
    asm.display_name,
    asm.description,
    asm.color,
    asm.icon,
    asm.order_index,
    ast.notes,
    ast.created_at,
    ast.is_current
  FROM 
    application_status_timeline ast
    JOIN application_status_metadata asm ON ast.status = asm.status
  WHERE 
    ast.application_id = target_application_id
  ORDER BY 
    ast.created_at DESC;
END;
$$ LANGUAGE plpgsql;