/*
  # Consolidated Schema for Job Portal

  This migration consolidates all previous migrations into a single file
  to ensure a clean database structure without redundant or conflicting migrations.
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create users table if it doesn't exist (usually handled by Supabase Auth)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  bio TEXT,
  job_title TEXT,
  company TEXT,
  experience_level TEXT CHECK (experience_level = ANY (ARRAY['Entry-level', '1-2 years', '3-5 years', '5+ years', '10+ years'])),
  salary_range TEXT,
  availability TEXT CHECK (availability = ANY (ARRAY['Open to opportunities', 'Actively looking', 'Not looking', 'Open to freelance'])),
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  resume_url TEXT,
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility = ANY (ARRAY['public', 'private', 'recruiters'])),
  show_salary BOOLEAN DEFAULT false,
  show_contact BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  job_alerts BOOLEAN DEFAULT true,
  application_updates BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  profile_views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resume_file_name TEXT,
  resume_uploaded_at TIMESTAMPTZ,
  resume_file_size INTEGER,
  profile_picture_url TEXT,
  profile_picture_uploaded_at TIMESTAMPTZ,
  role TEXT DEFAULT 'job_seeker' CHECK (role = ANY (ARRAY['job_seeker', 'employer', 'admin'])),
  company_name TEXT,
  company_position TEXT,
  company_size TEXT
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  size_range TEXT CHECK (size_range = ANY (ARRAY['1-50', '50-200', '200-500', '500-1000', '1000-5000', '5000+'])),
  location TEXT,
  website_url TEXT,
  logo_url TEXT,
  rating NUMERIC(2,1) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  founded_year INTEGER,
  specialties TEXT[],
  benefits TEXT[],
  culture_description TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type = ANY (ARRAY['Full Time', 'Part Time', 'Contract', 'Internship', 'Freelancing'])),
  experience_level TEXT CHECK (experience_level = ANY (ARRAY['Entry-level', 'Mid-level', 'Senior', 'Executive'])),
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  is_remote BOOLEAN DEFAULT false,
  requirements TEXT[],
  benefits TEXT[],
  skills_required TEXT[],
  application_deadline DATE,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  total_applications INTEGER DEFAULT 0,
  new_applications INTEGER DEFAULT 0,
  applications_in_review INTEGER DEFAULT 0,
  applications_interviewed INTEGER DEFAULT 0,
  applications_hired INTEGER DEFAULT 0,
  last_application_date TIMESTAMPTZ
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'submitted' CHECK (status = ANY (ARRAY['submitted', 'under_review', 'interview_scheduled', 'interview_completed', 'offer_made', 'accepted', 'rejected', 'withdrawn'])),
  cover_letter TEXT,
  resume_url TEXT,
  expected_salary TEXT,
  availability_date DATE,
  portfolio_url TEXT,
  linkedin_url TEXT,
  additional_info JSONB,
  applied_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  years_experience TEXT,
  current_salary TEXT,
  notice_period TEXT,
  skills TEXT[],
  github_url TEXT,
  website_url TEXT,
  referral_source TEXT,
  is_remote_preferred BOOLEAN DEFAULT false,
  willing_to_relocate BOOLEAN DEFAULT false,
  application_source TEXT DEFAULT 'website',
  screening_answers JSONB,
  UNIQUE(job_id, user_id)
);

-- Create saved_jobs table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_skills table
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level TEXT CHECK (proficiency_level = ANY (ARRAY['Beginner', 'Intermediate', 'Advanced', 'Expert'])),
  years_experience INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type = ANY (ARRAY['job_alert', 'application_update', 'profile_view', 'system', 'marketing'])),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create application_status_history table
CREATE TABLE IF NOT EXISTS application_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create application_attachments table
CREATE TABLE IF NOT EXISTS application_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  attachment_type TEXT CHECK (attachment_type = ANY (ARRAY['resume', 'cover_letter', 'portfolio', 'certificate', 'other'])),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Create application_notes table
CREATE TABLE IF NOT EXISTS application_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  note_type TEXT CHECK (note_type = ANY (ARRAY['general', 'interview', 'screening', 'feedback', 'internal'])),
  is_visible_to_candidate BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create application_status_timeline table
CREATE TABLE IF NOT EXISTS application_status_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status = ANY (ARRAY['submitted', 'under_review', 'interview_scheduled', 'interview_completed', 'offer_made', 'accepted', 'rejected', 'withdrawn'])),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  is_current BOOLEAN DEFAULT true
);

-- Create application_status_metadata table
CREATE TABLE IF NOT EXISTS application_status_metadata (
  status TEXT PRIMARY KEY CHECK (status = ANY (ARRAY['submitted', 'under_review', 'interview_scheduled', 'interview_completed', 'offer_made', 'accepted', 'rejected', 'withdrawn'])),
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Create interview_types table
CREATE TABLE IF NOT EXISTS interview_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Create interview_schedules table
CREATE TABLE IF NOT EXISTS interview_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  interview_type TEXT REFERENCES interview_types(id),
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  meeting_link TEXT,
  interviewer_ids UUID[],
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status = ANY (ARRAY['scheduled', 'completed', 'cancelled', 'rescheduled'])),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create interview_feedback table
CREATE TABLE IF NOT EXISTS interview_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interview_schedules(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  strengths TEXT,
  weaknesses TEXT,
  notes TEXT,
  recommendation TEXT NOT NULL CHECK (recommendation = ANY (ARRAY['strong_yes', 'yes', 'maybe', 'no', 'strong_no'])),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Populate interview_types table with default values
INSERT INTO interview_types (id, name, description, color, order_index)
VALUES
  ('phone', 'Phone Interview', 'Initial screening call', '#3B82F6', 1),
  ('video', 'Video Interview', 'Remote video interview', '#8B5CF6', 2),
  ('technical', 'Technical Interview', 'Technical assessment', '#10B981', 3),
  ('panel', 'Panel Interview', 'Interview with multiple team members', '#F59E0B', 4),
  ('in_person', 'In-Person Interview', 'On-site interview', '#EC4899', 5),
  ('final', 'Final Interview', 'Final decision round', '#EF4444', 6)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  order_index = EXCLUDED.order_index;

-- Populate application_status_metadata table with default values
INSERT INTO application_status_metadata (status, display_name, description, color, icon, order_index)
VALUES
  ('submitted', 'Submitted', 'Application has been submitted', '#3B82F6', 'file-text', 1),
  ('under_review', 'Under Review', 'Application is being reviewed', '#F59E0B', 'eye', 2),
  ('interview_scheduled', 'Interview Scheduled', 'Interview has been scheduled', '#8B5CF6', 'calendar', 3),
  ('interview_completed', 'Interview Completed', 'Interview has been completed', '#6366F1', 'check-circle', 4),
  ('offer_made', 'Offer Made', 'Job offer has been made', '#10B981', 'award', 5),
  ('accepted', 'Accepted', 'Offer has been accepted', '#059669', 'check-circle', 6),
  ('rejected', 'Rejected', 'Application has been rejected', '#EF4444', 'x', 7),
  ('withdrawn', 'Withdrawn', 'Application has been withdrawn', '#6B7280', 'arrow-left', 8)
ON CONFLICT (status) DO UPDATE
SET 
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  order_index = EXCLUDED.order_index;

-- Create triggers
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_application_notes_updated_at ON application_notes;
CREATE TRIGGER update_application_notes_updated_at
BEFORE UPDATE ON application_notes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_schedules_updated_at ON interview_schedules;
CREATE TRIGGER update_interview_schedules_updated_at
BEFORE UPDATE ON interview_schedules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_feedback_updated_at ON interview_feedback;
CREATE TRIGGER update_interview_feedback_updated_at
BEFORE UPDATE ON interview_feedback
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for interview_types
CREATE POLICY "Interview types are viewable by everyone" 
ON interview_types FOR SELECT 
TO authenticated 
USING (true);

-- Create RLS policies for interview_schedules
CREATE POLICY "Candidates can view their own interviews" 
ON interview_schedules FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM applications a
    WHERE a.id = interview_schedules.application_id
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Employers can manage interviews for their jobs" 
ON interview_schedules FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.id = interview_schedules.application_id
    AND j.created_by = auth.uid()
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.id = interview_schedules.application_id
    AND j.created_by = auth.uid()
  )
);

-- Create RLS policies for interview_feedback
CREATE POLICY "Employers can manage feedback for their interviews" 
ON interview_feedback FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM interview_schedules s
    JOIN applications a ON s.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    WHERE s.id = interview_feedback.interview_id
    AND j.created_by = auth.uid()
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM interview_schedules s
    JOIN applications a ON s.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    WHERE s.id = interview_feedback.interview_id
    AND j.created_by = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interview_schedules_application_id ON interview_schedules(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_scheduled_date ON interview_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_status ON interview_schedules(status);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview_id ON interview_feedback(interview_id);