/*
  # Employer Notification System

  1. New Tables
    - `employer_notifications`
      - `id` (uuid, primary key)
      - `employer_id` (uuid, foreign key to users)
      - `type` (text, notification type)
      - `title` (text, notification title)
      - `message` (text, notification content)
      - `data` (jsonb, additional data)
      - `is_read` (boolean, read status)
      - `is_email_sent` (boolean, email notification status)
      - `created_at` (timestamp)
    - `notification_preferences`
      - `employer_id` (uuid, foreign key to users)
      - `new_applications` (boolean)
      - `interview_reminders` (boolean)
      - `status_changes` (boolean)
      - `system_updates` (boolean)
      - `email_notifications` (boolean)

  2. Security
    - Enable RLS on all tables
    - Add policies for employers to manage their own notifications

  3. Functions
    - Trigger functions for automatic notification creation
    - Email notification functions
*/

-- Create employer_notifications table
CREATE TABLE IF NOT EXISTS employer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('new_application', 'interview_reminder', 'status_change', 'system_update')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  is_email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  new_applications boolean DEFAULT true,
  interview_reminders boolean DEFAULT true,
  status_changes boolean DEFAULT true,
  system_updates boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE employer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employer_notifications
CREATE POLICY "Employers can view own notifications"
  ON employer_notifications
  FOR SELECT
  TO authenticated
  USING (employer_id = auth.uid());

CREATE POLICY "Employers can update own notifications"
  ON employer_notifications
  FOR UPDATE
  TO authenticated
  USING (employer_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON employer_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for notification_preferences
CREATE POLICY "Employers can manage own preferences"
  ON notification_preferences
  FOR ALL
  TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employer_notifications_employer_id ON employer_notifications(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_notifications_type ON employer_notifications(type);
CREATE INDEX IF NOT EXISTS idx_employer_notifications_is_read ON employer_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_employer_notifications_created_at ON employer_notifications(created_at DESC);

-- Function to create notification for new applications
CREATE OR REPLACE FUNCTION create_new_application_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the job creator (employer)
  INSERT INTO employer_notifications (employer_id, type, title, message, data)
  SELECT 
    j.created_by,
    'new_application',
    'New Application Received',
    'You have received a new application for ' || j.title || ' from ' || NEW.first_name || ' ' || NEW.last_name,
    jsonb_build_object(
      'application_id', NEW.id,
      'job_id', NEW.job_id,
      'candidate_name', NEW.first_name || ' ' || NEW.last_name,
      'job_title', j.title
    )
  FROM jobs j
  WHERE j.id = NEW.job_id AND j.created_by IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create interview reminder notifications
CREATE OR REPLACE FUNCTION create_interview_reminder_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for interview scheduled
  INSERT INTO employer_notifications (employer_id, type, title, message, data)
  SELECT 
    j.created_by,
    'interview_reminder',
    'Interview Scheduled',
    'Interview scheduled for ' || j.title || ' with ' || a.first_name || ' ' || a.last_name || ' on ' || 
    to_char(NEW.scheduled_date, 'Mon DD, YYYY at HH12:MI AM'),
    jsonb_build_object(
      'interview_id', NEW.id,
      'application_id', NEW.application_id,
      'job_id', a.job_id,
      'candidate_name', a.first_name || ' ' || a.last_name,
      'job_title', j.title,
      'scheduled_date', NEW.scheduled_date
    )
  FROM applications a
  JOIN jobs j ON a.job_id = j.id
  WHERE a.id = NEW.application_id AND j.created_by IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create status change notifications
CREATE OR REPLACE FUNCTION create_status_change_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO employer_notifications (employer_id, type, title, message, data)
    SELECT 
      j.created_by,
      'status_change',
      'Application Status Updated',
      'Application status for ' || j.title || ' has been updated to ' || 
      replace(replace(NEW.status, '_', ' '), 'under review', 'Under Review'),
      jsonb_build_object(
        'application_id', NEW.id,
        'job_id', NEW.job_id,
        'candidate_name', NEW.first_name || ' ' || NEW.last_name,
        'job_title', j.title,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    FROM jobs j
    WHERE j.id = NEW.job_id AND j.created_by IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_new_application_notification ON applications;
CREATE TRIGGER trigger_new_application_notification
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION create_new_application_notification();

DROP TRIGGER IF EXISTS trigger_interview_reminder_notification ON interview_schedules;
CREATE TRIGGER trigger_interview_reminder_notification
  AFTER INSERT ON interview_schedules
  FOR EACH ROW
  EXECUTE FUNCTION create_interview_reminder_notification();

DROP TRIGGER IF EXISTS trigger_status_change_notification ON applications;
CREATE TRIGGER trigger_status_change_notification
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION create_status_change_notification();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_employer_notifications_updated_at
  BEFORE UPDATE ON employer_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();