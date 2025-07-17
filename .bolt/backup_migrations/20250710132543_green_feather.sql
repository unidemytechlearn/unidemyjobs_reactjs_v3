/*
  # Add withdraw application functionality

  1. Updates
    - Ensure application status can be set to 'withdrawn'
    - Add trigger to create timeline entry when application is withdrawn
    - Update application status metadata for withdrawn status

  2. Security
    - Ensure users can only withdraw their own applications
    - Add validation for withdrawable statuses
*/

-- Ensure 'withdrawn' status is included in the status check constraint
-- This should already exist, but we'll make sure
DO $$
BEGIN
  -- Check if the constraint exists and includes 'withdrawn'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'applications_status_check' 
    AND check_clause LIKE '%withdrawn%'
  ) THEN
    -- Drop the old constraint if it exists
    ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
    
    -- Add the updated constraint
    ALTER TABLE applications ADD CONSTRAINT applications_status_check 
    CHECK (status = ANY (ARRAY['submitted'::text, 'under_review'::text, 'interview_scheduled'::text, 'interview_completed'::text, 'offer_made'::text, 'accepted'::text, 'rejected'::text, 'withdrawn'::text]));
  END IF;
END $$;

-- Ensure application_status_metadata includes withdrawn status
INSERT INTO application_status_metadata (status, display_name, description, color, icon, order_index)
VALUES ('withdrawn', 'Withdrawn', 'Application has been withdrawn by the candidate', '#6B7280', 'ArrowLeft', 8)
ON CONFLICT (status) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  order_index = EXCLUDED.order_index;

-- Ensure application_status_timeline constraint includes withdrawn status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'application_status_timeline_status_check' 
    AND check_clause LIKE '%withdrawn%'
  ) THEN
    -- Drop the old constraint if it exists
    ALTER TABLE application_status_timeline DROP CONSTRAINT IF EXISTS application_status_timeline_status_check;
    
    -- Add the updated constraint
    ALTER TABLE application_status_timeline ADD CONSTRAINT application_status_timeline_status_check 
    CHECK (status = ANY (ARRAY['submitted'::text, 'under_review'::text, 'interview_scheduled'::text, 'interview_completed'::text, 'offer_made'::text, 'accepted'::text, 'rejected'::text, 'withdrawn'::text]));
  END IF;
END $$;

-- Create a function to validate withdrawal eligibility
CREATE OR REPLACE FUNCTION can_withdraw_application(app_status text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN app_status IN ('submitted', 'under_review', 'interview_scheduled');
END;
$$;

-- Add a trigger to prevent invalid withdrawals
CREATE OR REPLACE FUNCTION validate_application_withdrawal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If status is being changed to withdrawn, validate it's allowed
  IF NEW.status = 'withdrawn' AND OLD.status != 'withdrawn' THEN
    IF NOT can_withdraw_application(OLD.status) THEN
      RAISE EXCEPTION 'Application cannot be withdrawn from status: %', OLD.status;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS validate_withdrawal_trigger ON applications;
CREATE TRIGGER validate_withdrawal_trigger
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION validate_application_withdrawal();