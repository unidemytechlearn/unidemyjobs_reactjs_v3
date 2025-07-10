/*
  # Job Applications System Enhancement

  1. New Tables
    - `application_status_history` - Track application status changes
    - `application_attachments` - Manage file uploads for applications
    - `application_notes` - Internal notes for recruiters/HR
    - `interview_schedules` - Complete interview management system

  2. Enhanced Tables
    - `applications` - Add comprehensive applicant information fields
    - `jobs` - Add application tracking statistics

  3. Storage
    - Create storage buckets for resumes and attachments
    - Add proper RLS policies for file access

  4. Security
    - Enable RLS on all new tables
    - Add comprehensive policies for data access
    - Secure file upload and access controls
*/

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('application-attachments', 'application-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Enhanced applications table - Add missing columns
DO $$
BEGIN
  -- Add personal information columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE applications ADD COLUMN first_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE applications ADD COLUMN last_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'email'
  ) THEN
    ALTER TABLE applications ADD COLUMN email TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'phone'
  ) THEN
    ALTER TABLE applications ADD COLUMN phone TEXT;
  END IF;

  -- Add professional information columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'years_experience'
  ) THEN
    ALTER TABLE applications ADD COLUMN years_experience TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'current_salary'
  ) THEN
    ALTER TABLE applications ADD COLUMN current_salary TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'notice_period'
  ) THEN
    ALTER TABLE applications ADD COLUMN notice_period TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'skills'
  ) THEN
    ALTER TABLE applications ADD COLUMN skills TEXT[];
  END IF;

  -- Add social/portfolio links
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'github_url'
  ) THEN
    ALTER TABLE applications ADD COLUMN github_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE applications ADD COLUMN website_url TEXT;
  END IF;

  -- Add application metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'referral_source'
  ) THEN
    ALTER TABLE applications ADD COLUMN referral_source TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'is_remote_preferred'
  ) THEN
    ALTER TABLE applications ADD COLUMN is_remote_preferred BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'willing_to_relocate'
  ) THEN
    ALTER TABLE applications ADD COLUMN willing_to_relocate BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'application_source'
  ) THEN
    ALTER TABLE applications ADD COLUMN application_source TEXT DEFAULT 'website';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'screening_answers'
  ) THEN
    ALTER TABLE applications ADD COLUMN screening_answers JSONB;
  END IF;
END $$;

-- Create application status history table
CREATE TABLE IF NOT EXISTS application_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create application attachments table
CREATE TABLE IF NOT EXISTS application_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  attachment_type TEXT CHECK (attachment_type IN ('resume', 'cover_letter', 'portfolio', 'certificate', 'other')),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Create application notes table (for recruiter/HR notes)
CREATE TABLE IF NOT EXISTS application_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  note_type TEXT CHECK (note_type IN ('general', 'interview', 'screening', 'feedback', 'internal')),
  is_visible_to_candidate BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create interview schedules table
CREATE TABLE IF NOT EXISTS interview_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  interview_type TEXT CHECK (interview_type IN ('phone', 'video', 'in_person', 'technical', 'panel', 'final')),
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  meeting_link TEXT,
  interviewer_ids UUID[],
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add application tracking columns to jobs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'total_applications'
  ) THEN
    ALTER TABLE jobs ADD COLUMN total_applications INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'new_applications'
  ) THEN
    ALTER TABLE jobs ADD COLUMN new_applications INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'applications_in_review'
  ) THEN
    ALTER TABLE jobs ADD COLUMN applications_in_review INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'applications_interviewed'
  ) THEN
    ALTER TABLE jobs ADD COLUMN applications_interviewed INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'applications_hired'
  ) THEN
    ALTER TABLE jobs ADD COLUMN applications_hired INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'last_application_date'
  ) THEN
    ALTER TABLE jobs ADD COLUMN last_application_date TIMESTAMPTZ;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Allow users to insert their own applications" ON applications;
DROP POLICY IF EXISTS "Users can create applications" ON applications;

-- RLS Policies for applications (recreate with proper names)
CREATE POLICY "applications_insert_own"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for application_status_history
CREATE POLICY "application_status_history_select_own"
  ON application_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = application_status_history.application_id 
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "application_status_history_insert_system"
  ON application_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for application_attachments
CREATE POLICY "application_attachments_select_own"
  ON application_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = application_attachments.application_id 
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "application_attachments_insert_own"
  ON application_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = application_attachments.application_id 
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "application_attachments_update_own"
  ON application_attachments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = application_attachments.application_id 
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "application_attachments_delete_own"
  ON application_attachments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = application_attachments.application_id 
      AND applications.user_id = auth.uid()
    )
  );

-- RLS Policies for application_notes
CREATE POLICY "application_notes_select_visible"
  ON application_notes
  FOR SELECT
  TO authenticated
  USING (
    is_visible_to_candidate = true AND
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = application_notes.application_id 
      AND applications.user_id = auth.uid()
    )
  );

-- RLS Policies for interview_schedules
CREATE POLICY "interview_schedules_select_own"
  ON interview_schedules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = interview_schedules.application_id 
      AND applications.user_id = auth.uid()
    )
  );

-- Storage policies for resumes bucket
CREATE POLICY "resumes_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "resumes_select_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "resumes_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "resumes_delete_own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for application-attachments bucket
CREATE POLICY "attachments_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'application-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "attachments_select_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'application-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_application_status_history_created_at ON application_status_history(created_at);
CREATE INDEX IF NOT EXISTS idx_application_attachments_application_id ON application_attachments(application_id);
CREATE INDEX IF NOT EXISTS idx_application_attachments_type ON application_attachments(attachment_type);
CREATE INDEX IF NOT EXISTS idx_application_notes_application_id ON application_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_application_notes_visible ON application_notes(is_visible_to_candidate);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_application_id ON interview_schedules(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_scheduled_date ON interview_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_status ON interview_schedules(status);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);
CREATE INDEX IF NOT EXISTS idx_applications_user_job ON applications(user_id, job_id);

-- Create triggers for updated_at
CREATE TRIGGER update_application_notes_updated_at 
  BEFORE UPDATE ON application_notes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_schedules_updated_at 
  BEFORE UPDATE ON interview_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update job application counts
CREATE OR REPLACE FUNCTION update_job_application_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total applications count for the affected job
  UPDATE jobs 
  SET 
    total_applications = (
      SELECT COUNT(*) FROM applications WHERE job_id = COALESCE(NEW.job_id, OLD.job_id)
    ),
    new_applications = (
      SELECT COUNT(*) FROM applications 
      WHERE job_id = COALESCE(NEW.job_id, OLD.job_id) AND status = 'submitted'
    ),
    applications_in_review = (
      SELECT COUNT(*) FROM applications 
      WHERE job_id = COALESCE(NEW.job_id, OLD.job_id) AND status IN ('under_review', 'interview_scheduled')
    ),
    applications_interviewed = (
      SELECT COUNT(*) FROM applications 
      WHERE job_id = COALESCE(NEW.job_id, OLD.job_id) AND status = 'interview_completed'
    ),
    applications_hired = (
      SELECT COUNT(*) FROM applications 
      WHERE job_id = COALESCE(NEW.job_id, OLD.job_id) AND status = 'accepted'
    ),
    last_application_date = (
      SELECT MAX(applied_at) FROM applications WHERE job_id = COALESCE(NEW.job_id, OLD.job_id)
    )
  WHERE id = COALESCE(NEW.job_id, OLD.job_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update job application counts
DROP TRIGGER IF EXISTS trigger_update_job_application_counts ON applications;
CREATE TRIGGER trigger_update_job_application_counts
  AFTER INSERT OR UPDATE OR DELETE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_job_application_counts();

-- Function to create status history entry
CREATE OR REPLACE FUNCTION create_application_status_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create history entry if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO application_status_history (
      application_id,
      old_status,
      new_status,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      'Status updated'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status history
DROP TRIGGER IF EXISTS trigger_create_application_status_history ON applications;
CREATE TRIGGER trigger_create_application_status_history
  AFTER UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION create_application_status_history();

-- Function to automatically create initial status history entry
CREATE OR REPLACE FUNCTION create_initial_application_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial status history entry for new applications
  INSERT INTO application_status_history (
    application_id,
    old_status,
    new_status,
    changed_by,
    change_reason
  ) VALUES (
    NEW.id,
    NULL,
    NEW.status,
    NEW.user_id,
    'Application submitted'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for initial status history
DROP TRIGGER IF EXISTS trigger_create_initial_application_status ON applications;
CREATE TRIGGER trigger_create_initial_application_status
  AFTER INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION create_initial_application_status();