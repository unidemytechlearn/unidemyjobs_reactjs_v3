/*
  # Fix Foreign Key Constraint Errors in Notification Triggers

  This migration fixes the foreign key constraint violations in employer_notifications
  by updating the trigger functions to check if the employer_id exists in auth.users
  before attempting to create notifications.

  ## Changes Made:
  1. Update notification trigger functions to validate employer existence
  2. Add proper error handling to prevent constraint violations
  3. Ensure primary operations complete even if notifications fail
*/

-- Drop existing trigger functions to recreate them with proper validation
DROP FUNCTION IF EXISTS create_new_application_notification() CASCADE;
DROP FUNCTION IF EXISTS create_interview_reminder_notification() CASCADE;
DROP FUNCTION IF EXISTS create_application_status_notification() CASCADE;

-- Create improved function for new application notifications
CREATE OR REPLACE FUNCTION create_new_application_notification()
RETURNS TRIGGER AS $$
DECLARE
  employer_id UUID;
  job_title TEXT;
  company_name TEXT;
  candidate_name TEXT;
BEGIN
  -- Get employer ID from the job
  SELECT j.created_by, j.title, c.name
  INTO employer_id, job_title, company_name
  FROM jobs j
  LEFT JOIN companies c ON j.company_id = c.id
  WHERE j.id = NEW.job_id;
  
  -- Check if employer exists in auth.users before creating notification
  IF employer_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users WHERE id = employer_id) THEN
    -- Get candidate name
    candidate_name := COALESCE(NEW.first_name || ' ' || NEW.last_name, 'A candidate');
    
    -- Create notification for employer
    INSERT INTO employer_notifications (
      employer_id,
      type,
      title,
      message,
      data,
      is_read,
      created_at
    ) VALUES (
      employer_id,
      'new_application',
      'New Application Received',
      candidate_name || ' has applied for ' || COALESCE(job_title, 'your job posting') || 
      CASE WHEN company_name IS NOT NULL THEN ' at ' || company_name ELSE '' END,
      jsonb_build_object(
        'application_id', NEW.id,
        'job_id', NEW.job_id,
        'candidate_name', candidate_name,
        'job_title', job_title,
        'company_name', company_name
      ),
      false,
      NOW()
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the main operation
    RAISE WARNING 'Failed to create new application notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create improved function for interview reminder notifications
CREATE OR REPLACE FUNCTION create_interview_reminder_notification()
RETURNS TRIGGER AS $$
DECLARE
  employer_id UUID;
  job_title TEXT;
  company_name TEXT;
  candidate_name TEXT;
  interview_date TEXT;
BEGIN
  -- Get employer and job details
  SELECT j.created_by, j.title, c.name, a.first_name || ' ' || a.last_name
  INTO employer_id, job_title, company_name, candidate_name
  FROM applications a
  JOIN jobs j ON a.job_id = j.id
  LEFT JOIN companies c ON j.company_id = c.id
  WHERE a.id = NEW.application_id;
  
  -- Check if employer exists in auth.users before creating notification
  IF employer_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users WHERE id = employer_id) THEN
    -- Format interview date
    interview_date := to_char(NEW.scheduled_date, 'Day, Month DD, YYYY at HH12:MI AM');
    
    -- Create notification for employer
    INSERT INTO employer_notifications (
      employer_id,
      type,
      title,
      message,
      data,
      is_read,
      created_at
    ) VALUES (
      employer_id,
      'interview_reminder',
      'Interview Scheduled',
      'Interview scheduled with ' || COALESCE(candidate_name, 'candidate') || 
      ' for ' || COALESCE(job_title, 'your job posting') || ' on ' || interview_date,
      jsonb_build_object(
        'interview_id', NEW.id,
        'application_id', NEW.application_id,
        'candidate_name', candidate_name,
        'job_title', job_title,
        'company_name', company_name,
        'scheduled_date', NEW.scheduled_date,
        'interview_type', NEW.interview_type
      ),
      false,
      NOW()
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the main operation
    RAISE WARNING 'Failed to create interview reminder notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create improved function for application status change notifications
CREATE OR REPLACE FUNCTION create_application_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  employer_id UUID;
  job_title TEXT;
  company_name TEXT;
  candidate_name TEXT;
  status_display TEXT;
BEGIN
  -- Only proceed if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get employer and job details
  SELECT j.created_by, j.title, c.name, NEW.first_name || ' ' || NEW.last_name
  INTO employer_id, job_title, company_name, candidate_name
  FROM jobs j
  LEFT JOIN companies c ON j.company_id = c.id
  WHERE j.id = NEW.job_id;
  
  -- Check if employer exists in auth.users before creating notification
  IF employer_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users WHERE id = employer_id) THEN
    -- Format status for display
    status_display := CASE NEW.status
      WHEN 'submitted' THEN 'Submitted'
      WHEN 'under_review' THEN 'Under Review'
      WHEN 'interview_scheduled' THEN 'Interview Scheduled'
      WHEN 'interview_completed' THEN 'Interview Completed'
      WHEN 'offer_made' THEN 'Offer Made'
      WHEN 'accepted' THEN 'Accepted'
      WHEN 'rejected' THEN 'Rejected'
      WHEN 'withdrawn' THEN 'Withdrawn'
      ELSE NEW.status
    END;
    
    -- Create notification for employer
    INSERT INTO employer_notifications (
      employer_id,
      type,
      title,
      message,
      data,
      is_read,
      created_at
    ) VALUES (
      employer_id,
      'status_change',
      'Application Status Updated',
      'Application from ' || COALESCE(candidate_name, 'candidate') || 
      ' for ' || COALESCE(job_title, 'your job posting') || 
      ' has been updated to: ' || status_display,
      jsonb_build_object(
        'application_id', NEW.id,
        'job_id', NEW.job_id,
        'candidate_name', candidate_name,
        'job_title', job_title,
        'company_name', company_name,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      false,
      NOW()
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the main operation
    RAISE WARNING 'Failed to create status change notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers with the updated functions
CREATE TRIGGER trigger_new_application_notification
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION create_new_application_notification();

CREATE TRIGGER trigger_interview_reminder_notification
  AFTER INSERT ON interview_schedules
  FOR EACH ROW
  EXECUTE FUNCTION create_interview_reminder_notification();

CREATE TRIGGER trigger_application_status_notification
  AFTER UPDATE OF status ON applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION create_application_status_notification();

-- Clean up any orphaned employer_notifications that reference non-existent users
DELETE FROM employer_notifications 
WHERE employer_id NOT IN (SELECT id FROM auth.users);

-- Add a check constraint to prevent future orphaned records (optional)
-- This will be enforced at the application level through the improved triggers above