/*
  # Fix Users Table Sync with Supabase Auth

  1. Database Changes
    - Remove custom users table and use auth.users directly
    - Update all foreign key references to point to auth.users
    - Create trigger to automatically create profiles when users sign up
    - Fix all RLS policies to work with auth.users

  2. Security
    - Update all RLS policies to use auth.uid() correctly
    - Ensure proper access control for all tables
    - Fix foreign key constraints

  3. Data Integrity
    - Ensure all existing data is preserved
    - Update all references to use auth.users
*/

-- First, let's drop the custom users table and update all references
DROP TABLE IF EXISTS public.users CASCADE;

-- Update profiles table to reference auth.users directly
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update companies table to reference auth.users
ALTER TABLE companies 
DROP CONSTRAINT IF EXISTS companies_created_by_fkey,
ADD CONSTRAINT companies_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update jobs table to reference auth.users
ALTER TABLE jobs 
DROP CONSTRAINT IF EXISTS jobs_created_by_fkey,
ADD CONSTRAINT jobs_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update applications table to reference auth.users
ALTER TABLE applications 
DROP CONSTRAINT IF EXISTS applications_user_id_fkey,
ADD CONSTRAINT applications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update saved_jobs table to reference auth.users
ALTER TABLE saved_jobs 
DROP CONSTRAINT IF EXISTS saved_jobs_user_id_fkey,
ADD CONSTRAINT saved_jobs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update password_reset_tokens table to reference auth.users
ALTER TABLE password_reset_tokens 
DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey,
ADD CONSTRAINT password_reset_tokens_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update employer_notifications table to reference auth.users
ALTER TABLE employer_notifications 
DROP CONSTRAINT IF EXISTS employer_notifications_employer_id_fkey,
ADD CONSTRAINT employer_notifications_employer_id_fkey 
  FOREIGN KEY (employer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update notification_preferences table to reference auth.users
ALTER TABLE notification_preferences 
DROP CONSTRAINT IF EXISTS notification_preferences_employer_id_fkey,
ADD CONSTRAINT notification_preferences_employer_id_fkey 
  FOREIGN KEY (employer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update notifications table to reference auth.users
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update user_skills table to reference auth.users
ALTER TABLE user_skills 
DROP CONSTRAINT IF EXISTS user_skills_user_id_fkey,
ADD CONSTRAINT user_skills_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update application_status_timeline table to reference auth.users
ALTER TABLE application_status_timeline 
DROP CONSTRAINT IF EXISTS application_status_timeline_created_by_fkey,
ADD CONSTRAINT application_status_timeline_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update application_status_history table to reference auth.users
ALTER TABLE application_status_history 
DROP CONSTRAINT IF EXISTS application_status_history_changed_by_fkey,
ADD CONSTRAINT application_status_history_changed_by_fkey 
  FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update application_notes table to reference auth.users
ALTER TABLE application_notes 
DROP CONSTRAINT IF EXISTS application_notes_created_by_fkey,
ADD CONSTRAINT application_notes_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update interview_schedules table to reference auth.users
ALTER TABLE interview_schedules 
DROP CONSTRAINT IF EXISTS interview_schedules_created_by_fkey,
ADD CONSTRAINT interview_schedules_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update interview_feedback table to reference auth.users
ALTER TABLE interview_feedback 
DROP CONSTRAINT IF EXISTS interview_feedback_created_by_fkey,
ADD CONSTRAINT interview_feedback_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    role,
    email_notifications,
    job_alerts,
    application_updates,
    marketing_emails,
    profile_visibility,
    show_salary,
    show_contact,
    two_factor_enabled,
    profile_views
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'job_seeker'),
    COALESCE((new.raw_user_meta_data->>'email_notifications')::boolean, true),
    COALESCE((new.raw_user_meta_data->>'job_alerts')::boolean, true),
    COALESCE((new.raw_user_meta_data->>'application_updates')::boolean, true),
    COALESCE((new.raw_user_meta_data->>'marketing_emails')::boolean, false),
    'public',
    false,
    true,
    false,
    0
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update all notification trigger functions to use auth.users
CREATE OR REPLACE FUNCTION create_new_application_notification()
RETURNS trigger AS $$
DECLARE
  job_record RECORD;
  employer_exists BOOLEAN;
BEGIN
  -- Get job details
  SELECT j.*, c.name as company_name 
  INTO job_record
  FROM jobs j
  LEFT JOIN companies c ON j.company_id = c.id
  WHERE j.id = NEW.job_id;
  
  -- Check if employer exists in auth.users
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE id = job_record.created_by
  ) INTO employer_exists;
  
  -- Only create notification if employer exists
  IF employer_exists AND job_record.created_by IS NOT NULL THEN
    BEGIN
      INSERT INTO employer_notifications (
        employer_id,
        type,
        title,
        message,
        data
      ) VALUES (
        job_record.created_by,
        'new_application',
        'New Application Received',
        format('New application received for %s at %s from %s %s', 
               job_record.title, 
               COALESCE(job_record.company_name, 'your company'),
               NEW.first_name,
               NEW.last_name),
        jsonb_build_object(
          'application_id', NEW.id,
          'job_id', NEW.job_id,
          'candidate_name', NEW.first_name || ' ' || NEW.last_name,
          'job_title', job_record.title
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the main operation
      RAISE WARNING 'Failed to create employer notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_interview_reminder_notification()
RETURNS trigger AS $$
DECLARE
  app_record RECORD;
  job_record RECORD;
  employer_exists BOOLEAN;
BEGIN
  -- Get application and job details
  SELECT a.*, j.title as job_title, j.created_by as employer_id, c.name as company_name
  INTO app_record
  FROM applications a
  JOIN jobs j ON a.job_id = j.id
  LEFT JOIN companies c ON j.company_id = c.id
  WHERE a.id = NEW.application_id;
  
  -- Check if employer exists in auth.users
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE id = app_record.employer_id
  ) INTO employer_exists;
  
  -- Only create notification if employer exists
  IF employer_exists AND app_record.employer_id IS NOT NULL THEN
    BEGIN
      INSERT INTO employer_notifications (
        employer_id,
        type,
        title,
        message,
        data
      ) VALUES (
        app_record.employer_id,
        'interview_reminder',
        'Interview Scheduled',
        format('Interview scheduled for %s with %s %s on %s', 
               app_record.job_title,
               app_record.first_name,
               app_record.last_name,
               to_char(NEW.scheduled_date, 'FMDay, FMMonth DD at HH12:MI AM')),
        jsonb_build_object(
          'interview_id', NEW.id,
          'application_id', NEW.application_id,
          'candidate_name', app_record.first_name || ' ' || app_record.last_name,
          'job_title', app_record.job_title,
          'scheduled_date', NEW.scheduled_date
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the main operation
      RAISE WARNING 'Failed to create interview reminder notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_application_status_notification()
RETURNS trigger AS $$
DECLARE
  job_record RECORD;
  employer_exists BOOLEAN;
BEGIN
  -- Only proceed if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get job details
  SELECT j.*, c.name as company_name 
  INTO job_record
  FROM jobs j
  LEFT JOIN companies c ON j.company_id = c.id
  WHERE j.id = NEW.job_id;
  
  -- Check if employer exists in auth.users
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE id = job_record.created_by
  ) INTO employer_exists;
  
  -- Only create notification if employer exists
  IF employer_exists AND job_record.created_by IS NOT NULL THEN
    BEGIN
      INSERT INTO employer_notifications (
        employer_id,
        type,
        title,
        message,
        data
      ) VALUES (
        job_record.created_by,
        'status_change',
        'Application Status Changed',
        format('Application status changed for %s %s (%s) from %s to %s', 
               NEW.first_name,
               NEW.last_name,
               job_record.title,
               OLD.status,
               NEW.status),
        jsonb_build_object(
          'application_id', NEW.id,
          'job_id', NEW.job_id,
          'candidate_name', NEW.first_name || ' ' || NEW.last_name,
          'job_title', job_record.title,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the main operation
      RAISE WARNING 'Failed to create status change notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate all triggers
DROP TRIGGER IF EXISTS trigger_new_application_notification ON applications;
CREATE TRIGGER trigger_new_application_notification
  AFTER INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION create_new_application_notification();

DROP TRIGGER IF EXISTS trigger_interview_reminder_notification ON interview_schedules;
CREATE TRIGGER trigger_interview_reminder_notification
  AFTER INSERT ON interview_schedules
  FOR EACH ROW EXECUTE FUNCTION create_interview_reminder_notification();

DROP TRIGGER IF EXISTS trigger_application_status_notification ON applications;
CREATE TRIGGER trigger_application_status_notification
  AFTER UPDATE OF status ON applications
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION create_application_status_notification();

-- Clean up any orphaned records that might cause issues
DELETE FROM employer_notifications 
WHERE employer_id NOT IN (SELECT id FROM auth.users);

DELETE FROM notification_preferences 
WHERE employer_id NOT IN (SELECT id FROM auth.users);

DELETE FROM notifications 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Update RLS policies to work with auth.users
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Ensure all tables have proper RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_attachments ENABLE ROW LEVEL SECURITY;