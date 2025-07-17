/*
  # Create notification triggers for application status changes

  1. Functions
    - Function to create notifications when application status changes
    - Function to create profile view notifications

  2. Triggers
    - Trigger on application status updates
    - Trigger for profile views (if implemented)

  3. Security
    - Functions run with security definer to bypass RLS
*/

-- Function to create application status change notifications
CREATE OR REPLACE FUNCTION create_application_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  job_title TEXT;
  company_name TEXT;
  status_display TEXT;
BEGIN
  -- Only create notification if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get job and company details
    SELECT j.title, c.name INTO job_title, company_name
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE j.id = NEW.job_id;
    
    -- Format status for display
    status_display := REPLACE(INITCAP(NEW.status), '_', ' ');
    
    -- Create notification
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      action_url,
      metadata,
      is_read
    ) VALUES (
      NEW.user_id,
      'Application Status Update',
      'Your application for ' || COALESCE(job_title, 'Unknown Position') || 
      ' at ' || COALESCE(company_name, 'Unknown Company') || 
      ' is now ' || status_display || '.',
      'application_update',
      '/dashboard/applications/' || NEW.id::text,
      jsonb_build_object(
        'application_id', NEW.id,
        'job_id', NEW.job_id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'job_title', job_title,
        'company_name', company_name
      ),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create job alert notifications
CREATE OR REPLACE FUNCTION create_job_alert_notification()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
  company_name TEXT;
BEGIN
  -- Only for new active jobs
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    -- Get company name
    SELECT name INTO company_name
    FROM companies
    WHERE id = NEW.company_id;
    
    -- Create notifications for users who might be interested
    -- This is a simplified version - you could make this more sophisticated
    -- by matching skills, location preferences, etc.
    FOR user_record IN 
      SELECT DISTINCT p.id
      FROM profiles p
      WHERE p.job_alerts = true
      AND p.availability IN ('Open to opportunities', 'Actively looking')
    LOOP
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        action_url,
        metadata,
        is_read
      ) VALUES (
        user_record.id,
        'New Job Match',
        'New job opportunity: ' || NEW.title || 
        ' at ' || COALESCE(company_name, 'Unknown Company') || 
        ' matches your preferences.',
        'job_alert',
        '/jobs/' || NEW.id::text,
        jsonb_build_object(
          'job_id', NEW.id,
          'job_title', NEW.title,
          'company_name', company_name,
          'location', NEW.location,
          'job_type', NEW.job_type
        ),
        false
      );
    END LOOP;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create profile view notifications
CREATE OR REPLACE FUNCTION create_profile_view_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for profile owner
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_url,
    metadata,
    is_read
  ) VALUES (
    NEW.id,
    'Profile Viewed',
    'Someone viewed your profile',
    'profile_view',
    '/dashboard/profile',
    jsonb_build_object(
      'profile_id', NEW.id,
      'view_count', NEW.profile_views
    ),
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_application_status_notification ON applications;
CREATE TRIGGER trigger_application_status_notification
  AFTER UPDATE OF status ON applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION create_application_status_notification();

DROP TRIGGER IF EXISTS trigger_job_alert_notification ON jobs;
CREATE TRIGGER trigger_job_alert_notification
  AFTER INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION create_job_alert_notification();

-- Trigger for profile views (only when profile_views increases)
DROP TRIGGER IF EXISTS trigger_profile_view_notification ON profiles;
CREATE TRIGGER trigger_profile_view_notification
  AFTER UPDATE OF profile_views ON profiles
  FOR EACH ROW
  WHEN (NEW.profile_views > OLD.profile_views)
  EXECUTE FUNCTION create_profile_view_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_application_status_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION create_job_alert_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION create_profile_view_notification() TO authenticated;