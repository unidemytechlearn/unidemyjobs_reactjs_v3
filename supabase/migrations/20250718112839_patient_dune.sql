/*
  # Complete Job Portal Database Setup

  This migration sets up the complete database schema for the job portal application including:
  
  1. Core Tables
     - profiles (user profiles with role-based access)
     - companies (employer company information)
     - jobs (job postings)
     - applications (job applications)
     - saved_jobs (user saved jobs)
     - skills (skill taxonomy)
     - user_skills (user skill relationships)
     
  2. Notification System
     - notifications (user notifications)
     - employer_notifications (employer-specific notifications)
     - notification_preferences (employer notification settings)
     
  3. Interview System
     - interview_types (types of interviews)
     - interview_schedules (scheduled interviews)
     - interview_feedback (interview feedback and ratings)
     
  4. Application Tracking
     - application_status_timeline (status change tracking)
     - application_status_history (historical status changes)
     - application_status_metadata (status configuration)
     - application_attachments (file attachments)
     - application_notes (internal notes)
     
  5. Security
     - Row Level Security (RLS) policies for all tables
     - Proper role-based access control
     - Data isolation between users and employers
     
  6. Functions and Triggers
     - Automatic notification creation
     - Status change tracking
     - Application count updates
     - Timestamp management
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('job_seeker', 'employer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_type AS ENUM ('Full Time', 'Part Time', 'Contract', 'Internship', 'Freelancing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE experience_level AS ENUM ('Entry-level', '1-2 years', '3-5 years', '5+ years', '10+ years');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('submitted', 'under_review', 'interview_scheduled', 'interview_completed', 'offer_made', 'accepted', 'rejected', 'withdrawn');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE interview_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('job_alert', 'application_update', 'profile_view', 'system', 'marketing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employer_notification_type AS ENUM ('new_application', 'interview_reminder', 'status_change', 'system_update');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  location TEXT,
  bio TEXT,
  job_title TEXT,
  company TEXT,
  experience_level TEXT CHECK (experience_level IN ('Entry-level', '1-2 years', '3-5 years', '5+ years', '10+ years')),
  salary_range TEXT,
  availability TEXT CHECK (availability IN ('Open to opportunities', 'Actively looking', 'Not looking', 'Open to freelance')),
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  resume_url TEXT,
  resume_file_name TEXT,
  resume_uploaded_at TIMESTAMPTZ,
  resume_file_size INTEGER,
  profile_picture_url TEXT,
  profile_picture_uploaded_at TIMESTAMPTZ,
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'recruiters')),
  show_salary BOOLEAN DEFAULT false,
  show_contact BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  job_alerts BOOLEAN DEFAULT true,
  application_updates BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  profile_views INTEGER DEFAULT 0,
  role TEXT DEFAULT 'job_seeker' CHECK (role IN ('job_seeker', 'employer', 'admin')),
  company_name TEXT,
  company_position TEXT,
  company_size TEXT CHECK (company_size IN ('1-50', '50-200', '200-500', '500-1000', '1000-5000', '5000+')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  size_range TEXT CHECK (size_range IN ('1-50', '50-200', '200-500', '500-1000', '1000-5000', '5000+')),
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
  created_by UUID REFERENCES auth.users(id),
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
  job_type TEXT NOT NULL CHECK (job_type IN ('Full Time', 'Part Time', 'Contract', 'Internship', 'Freelancing')),
  experience_level TEXT CHECK (experience_level IN ('Entry-level', 'Mid-level', 'Senior', 'Executive')),
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
  total_applications INTEGER DEFAULT 0,
  new_applications INTEGER DEFAULT 0,
  applications_in_review INTEGER DEFAULT 0,
  applications_interviewed INTEGER DEFAULT 0,
  applications_hired INTEGER DEFAULT 0,
  last_application_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'interview_scheduled', 'interview_completed', 'offer_made', 'accepted', 'rejected', 'withdrawn')),
  cover_letter TEXT,
  resume_url TEXT,
  expected_salary TEXT,
  current_salary TEXT,
  availability_date DATE,
  notice_period TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  website_url TEXT,
  additional_info JSONB,
  screening_answers JSONB,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  years_experience TEXT,
  skills TEXT[],
  referral_source TEXT,
  is_remote_preferred BOOLEAN DEFAULT false,
  willing_to_relocate BOOLEAN DEFAULT false,
  application_source TEXT DEFAULT 'website',
  applied_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, user_id)
);

-- Create saved_jobs table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level TEXT CHECK (proficiency_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  years_experience INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('job_alert', 'application_update', 'profile_view', 'system', 'marketing')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create employer_notifications table
CREATE TABLE IF NOT EXISTS employer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_application', 'interview_reminder', 'status_change', 'system_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  is_email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  new_applications BOOLEAN DEFAULT true,
  interview_reminders BOOLEAN DEFAULT true,
  status_changes BOOLEAN DEFAULT true,
  system_updates BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  interview_type TEXT REFERENCES interview_types(id),
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

-- Create interview_feedback table
CREATE TABLE IF NOT EXISTS interview_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interview_schedules(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  strengths TEXT,
  weaknesses TEXT,
  notes TEXT,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create application_status_timeline table
CREATE TABLE IF NOT EXISTS application_status_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'under_review', 'interview_scheduled', 'interview_completed', 'offer_made', 'accepted', 'rejected', 'withdrawn')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  is_current BOOLEAN DEFAULT true
);

-- Create application_status_history table
CREATE TABLE IF NOT EXISTS application_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create application_status_metadata table
CREATE TABLE IF NOT EXISTS application_status_metadata (
  status TEXT PRIMARY KEY CHECK (status IN ('submitted', 'under_review', 'interview_scheduled', 'interview_completed', 'offer_made', 'accepted', 'rejected', 'withdrawn')),
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Create application_attachments table
CREATE TABLE IF NOT EXISTS application_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  attachment_type TEXT CHECK (attachment_type IN ('resume', 'cover_letter', 'portfolio', 'certificate', 'other')),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Create application_notes table
CREATE TABLE IF NOT EXISTS application_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  note_type TEXT CHECK (note_type IN ('general', 'interview', 'screening', 'feedback', 'internal')),
  is_visible_to_candidate BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON jobs(is_featured);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);
CREATE INDEX IF NOT EXISTS idx_applications_user_job ON applications(user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_employer_notifications_employer_id ON employer_notifications(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_notifications_is_read ON employer_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_employer_notifications_type ON employer_notifications(type);
CREATE INDEX IF NOT EXISTS idx_employer_notifications_created_at ON employer_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_application_id ON interview_schedules(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_scheduled_date ON interview_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_status ON interview_schedules(status);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview_id ON interview_feedback(interview_id);
CREATE INDEX IF NOT EXISTS idx_application_status_timeline_application_id ON application_status_timeline(application_id);
CREATE INDEX IF NOT EXISTS idx_application_status_timeline_is_current ON application_status_timeline(is_current);
CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_application_status_history_created_at ON application_status_history(created_at);
CREATE INDEX IF NOT EXISTS idx_application_attachments_application_id ON application_attachments(application_id);
CREATE INDEX IF NOT EXISTS idx_application_attachments_type ON application_attachments(attachment_type);
CREATE INDEX IF NOT EXISTS idx_application_notes_application_id ON application_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_application_notes_visible ON application_notes(is_visible_to_candidate);

-- Insert default interview types
INSERT INTO interview_types (id, name, description, color, order_index) VALUES
  ('phone', 'Phone Interview', 'Initial screening call', '#3B82F6', 1),
  ('video', 'Video Interview', 'Remote video interview', '#8B5CF6', 2),
  ('technical', 'Technical Interview', 'Technical assessment', '#10B981', 3),
  ('panel', 'Panel Interview', 'Interview with multiple team members', '#F59E0B', 4),
  ('in_person', 'In-Person Interview', 'On-site interview', '#EC4899', 5),
  ('final', 'Final Interview', 'Final decision round', '#EF4444', 6)
ON CONFLICT (id) DO NOTHING;

-- Insert default application status metadata
INSERT INTO application_status_metadata (status, display_name, description, color, icon, order_index) VALUES
  ('submitted', 'Submitted', 'Application has been submitted', '#3B82F6', 'file-text', 1),
  ('under_review', 'Under Review', 'Application is being reviewed', '#F59E0B', 'eye', 2),
  ('interview_scheduled', 'Interview Scheduled', 'Interview has been scheduled', '#8B5CF6', 'calendar', 3),
  ('interview_completed', 'Interview Completed', 'Interview has been completed', '#6366F1', 'check-circle', 4),
  ('offer_made', 'Offer Made', 'Job offer has been extended', '#10B981', 'star', 5),
  ('accepted', 'Accepted', 'Offer has been accepted', '#059669', 'check-circle', 6),
  ('rejected', 'Rejected', 'Application has been rejected', '#DC2626', 'x-circle', 7),
  ('withdrawn', 'Withdrawn', 'Application has been withdrawn', '#6B7280', 'arrow-left', 8)
ON CONFLICT (status) DO NOTHING;

-- Create utility functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create notification functions
CREATE OR REPLACE FUNCTION create_new_application_notification()
RETURNS TRIGGER AS $$
DECLARE
    job_record RECORD;
    employer_record RECORD;
BEGIN
    -- Get job and employer information
    SELECT j.*, c.name as company_name 
    INTO job_record 
    FROM jobs j 
    LEFT JOIN companies c ON j.company_id = c.id 
    WHERE j.id = NEW.job_id;
    
    -- Get employer profile
    SELECT * INTO employer_record FROM profiles WHERE id = job_record.created_by AND role = 'employer';
    
    IF employer_record.id IS NOT NULL THEN
        -- Create notification for employer
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
            format('New application from %s %s for %s position', NEW.first_name, NEW.last_name, job_record.title),
            jsonb_build_object(
                'application_id', NEW.id,
                'job_id', NEW.job_id,
                'candidate_name', NEW.first_name || ' ' || NEW.last_name,
                'job_title', job_record.title,
                'company_name', job_record.company_name
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_interview_reminder_notification()
RETURNS TRIGGER AS $$
DECLARE
    app_record RECORD;
    job_record RECORD;
BEGIN
    -- Get application and job information
    SELECT a.*, j.title as job_title, j.created_by as employer_id, c.name as company_name
    INTO app_record
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE a.id = NEW.application_id;
    
    IF app_record.employer_id IS NOT NULL THEN
        -- Create notification for employer
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
            format('Interview scheduled with %s %s for %s on %s', 
                   app_record.first_name, 
                   app_record.last_name, 
                   app_record.job_title,
                   to_char(NEW.scheduled_date, 'Mon DD, YYYY at HH12:MI AM')),
            jsonb_build_object(
                'interview_id', NEW.id,
                'application_id', NEW.application_id,
                'candidate_name', app_record.first_name || ' ' || app_record.last_name,
                'job_title', app_record.job_title,
                'scheduled_date', NEW.scheduled_date
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_application_status_notification()
RETURNS TRIGGER AS $$
DECLARE
    job_record RECORD;
BEGIN
    -- Only create notification if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Get job information
        SELECT j.*, c.name as company_name 
        INTO job_record 
        FROM jobs j 
        LEFT JOIN companies c ON j.company_id = c.id 
        WHERE j.id = NEW.job_id;
        
        IF job_record.created_by IS NOT NULL THEN
            -- Create notification for employer
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
                format('Application status for %s %s changed from %s to %s', 
                       NEW.first_name, 
                       NEW.last_name, 
                       COALESCE(OLD.status, 'new'),
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
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_job_application_counts()
RETURNS TRIGGER AS $$
DECLARE
    job_id_to_update UUID;
BEGIN
    -- Determine which job to update
    IF TG_OP = 'DELETE' THEN
        job_id_to_update := OLD.job_id;
    ELSE
        job_id_to_update := NEW.job_id;
    END IF;
    
    -- Update job application counts
    UPDATE jobs SET
        total_applications = (
            SELECT COUNT(*) FROM applications WHERE job_id = job_id_to_update
        ),
        new_applications = (
            SELECT COUNT(*) FROM applications WHERE job_id = job_id_to_update AND status = 'submitted'
        ),
        applications_in_review = (
            SELECT COUNT(*) FROM applications WHERE job_id = job_id_to_update AND status = 'under_review'
        ),
        applications_interviewed = (
            SELECT COUNT(*) FROM applications WHERE job_id = job_id_to_update AND status IN ('interview_scheduled', 'interview_completed')
        ),
        applications_hired = (
            SELECT COUNT(*) FROM applications WHERE job_id = job_id_to_update AND status = 'accepted'
        ),
        last_application_date = (
            SELECT MAX(applied_at) FROM applications WHERE job_id = job_id_to_update
        ),
        application_count = (
            SELECT COUNT(*) FROM applications WHERE job_id = job_id_to_update
        )
    WHERE id = job_id_to_update;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_application_status_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO application_status_history (
            application_id,
            old_status,
            new_status,
            changed_by,
            created_at
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.user_id, -- This might need to be updated based on who changed it
            now()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_initial_application_status()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO application_status_history (
        application_id,
        old_status,
        new_status,
        changed_by,
        created_at
    ) VALUES (
        NEW.id,
        NULL,
        NEW.status,
        NEW.user_id,
        NEW.applied_at
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_application_status_timeline()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Mark all previous statuses as not current
        UPDATE application_status_timeline 
        SET is_current = false 
        WHERE application_id = NEW.id;
        
        -- Insert new current status
        INSERT INTO application_status_timeline (
            application_id,
            status,
            created_by,
            is_current,
            created_at
        ) VALUES (
            NEW.id,
            NEW.status,
            NEW.user_id,
            true,
            now()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_initial_status_timeline()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO application_status_timeline (
        application_id,
        status,
        created_by,
        is_current,
        created_at
    ) VALUES (
        NEW.id,
        NEW.status,
        NEW.user_id,
        true,
        NEW.applied_at
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_application_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
    -- Only allow withdrawal from certain statuses
    IF NEW.status = 'withdrawn' AND OLD.status NOT IN ('submitted', 'under_review', 'interview_scheduled') THEN
        RAISE EXCEPTION 'Cannot withdraw application from status: %', OLD.status;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for candidate when status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            action_url,
            metadata
        ) VALUES (
            NEW.user_id,
            'Application Status Update',
            format('Your application status has been updated to: %s', NEW.status),
            'application_update',
            format('/dashboard/applications/%s', NEW.id),
            jsonb_build_object(
                'application_id', NEW.id,
                'job_id', NEW.job_id,
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_schedules_updated_at ON interview_schedules;
CREATE TRIGGER update_interview_schedules_updated_at
    BEFORE UPDATE ON interview_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_feedback_updated_at ON interview_feedback;
CREATE TRIGGER update_interview_feedback_updated_at
    BEFORE UPDATE ON interview_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employer_notifications_updated_at ON employer_notifications;
CREATE TRIGGER update_employer_notifications_updated_at
    BEFORE UPDATE ON employer_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_application_notes_updated_at ON application_notes;
CREATE TRIGGER update_application_notes_updated_at
    BEFORE UPDATE ON application_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Application-related triggers
DROP TRIGGER IF EXISTS trigger_new_application_notification ON applications;
CREATE TRIGGER trigger_new_application_notification
    AFTER INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION create_new_application_notification();

DROP TRIGGER IF EXISTS trigger_application_status_notification ON applications;
CREATE TRIGGER trigger_application_status_notification
    AFTER UPDATE OF status ON applications
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION create_application_status_notification();

DROP TRIGGER IF EXISTS trigger_update_job_application_counts ON applications;
CREATE TRIGGER trigger_update_job_application_counts
    AFTER INSERT OR UPDATE OR DELETE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_job_application_counts();

DROP TRIGGER IF EXISTS trigger_create_application_status_history ON applications;
CREATE TRIGGER trigger_create_application_status_history
    AFTER UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION create_application_status_history();

DROP TRIGGER IF EXISTS trigger_create_initial_application_status ON applications;
CREATE TRIGGER trigger_create_initial_application_status
    AFTER INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_application_status();

DROP TRIGGER IF EXISTS trigger_update_application_status_timeline ON applications;
CREATE TRIGGER trigger_update_application_status_timeline
    AFTER UPDATE OF status ON applications
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_application_status_timeline();

DROP TRIGGER IF EXISTS trigger_create_initial_status_timeline ON applications;
CREATE TRIGGER trigger_create_initial_status_timeline
    AFTER INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_status_timeline();

DROP TRIGGER IF EXISTS validate_withdrawal_trigger ON applications;
CREATE TRIGGER validate_withdrawal_trigger
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION validate_application_withdrawal();

DROP TRIGGER IF EXISTS trigger_notify_application_status_change ON applications;
CREATE TRIGGER trigger_notify_application_status_change
    AFTER UPDATE OF status ON applications
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_application_status_change();

-- Interview-related triggers
DROP TRIGGER IF EXISTS trigger_interview_reminder_notification ON interview_schedules;
CREATE TRIGGER trigger_interview_reminder_notification
    AFTER INSERT ON interview_schedules
    FOR EACH ROW
    EXECUTE FUNCTION create_interview_reminder_notification();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

DROP POLICY IF EXISTS "Companies are publicly readable" ON companies;
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON companies;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
DROP POLICY IF EXISTS "Company creators can update their companies" ON companies;
DROP POLICY IF EXISTS "Employers can manage their companies" ON companies;

DROP POLICY IF EXISTS "Active jobs are viewable by everyone" ON jobs;
DROP POLICY IF EXISTS "Jobs are publicly readable" ON jobs;
DROP POLICY IF EXISTS "Authenticated users can create jobs" ON jobs;
DROP POLICY IF EXISTS "Job creators can update their jobs" ON jobs;
DROP POLICY IF EXISTS "Employers can manage their jobs" ON jobs;

DROP POLICY IF EXISTS "Users can read own applications" ON applications;
DROP POLICY IF EXISTS "Users can update own applications" ON applications;
DROP POLICY IF EXISTS "applications_insert_own" ON applications;
DROP POLICY IF EXISTS "Employers can view applications to their jobs" ON applications;
DROP POLICY IF EXISTS "Employers can update application status" ON applications;

DROP POLICY IF EXISTS "Users can manage own saved jobs" ON saved_jobs;
DROP POLICY IF EXISTS "Skills are viewable by everyone" ON skills;
DROP POLICY IF EXISTS "Users can manage own skills" ON user_skills;

DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications for themselves" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

DROP POLICY IF EXISTS "Employers can view own notifications" ON employer_notifications;
DROP POLICY IF EXISTS "Employers can update own notifications" ON employer_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON employer_notifications;

DROP POLICY IF EXISTS "Employers can manage own preferences" ON notification_preferences;

DROP POLICY IF EXISTS "Interview types are viewable by everyone" ON interview_types;

DROP POLICY IF EXISTS "Candidates can view their own interviews" ON interview_schedules;
DROP POLICY IF EXISTS "Employers can manage interviews for their jobs" ON interview_schedules;

DROP POLICY IF EXISTS "Employers can manage feedback for their interviews" ON interview_feedback;

DROP POLICY IF EXISTS "Users can view their own application status timeline" ON application_status_timeline;
DROP POLICY IF EXISTS "Users can insert timeline entries for own applications" ON application_status_timeline;
DROP POLICY IF EXISTS "System can insert timeline entries" ON application_status_timeline;

DROP POLICY IF EXISTS "application_status_history_select_own" ON application_status_history;
DROP POLICY IF EXISTS "application_status_history_insert_system" ON application_status_history;

DROP POLICY IF EXISTS "application_status_metadata_select_all" ON application_status_metadata;

DROP POLICY IF EXISTS "application_attachments_select_own" ON application_attachments;
DROP POLICY IF EXISTS "application_attachments_insert_own" ON application_attachments;
DROP POLICY IF EXISTS "application_attachments_update_own" ON application_attachments;
DROP POLICY IF EXISTS "application_attachments_delete_own" ON application_attachments;

DROP POLICY IF EXISTS "application_notes_select_visible" ON application_notes;

DROP POLICY IF EXISTS "Users can read own reset tokens" ON password_reset_tokens;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (profile_visibility = 'public');

-- Companies policies
CREATE POLICY "Companies are publicly readable" ON companies
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Companies are viewable by everyone" ON companies
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create companies" ON companies
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Company creators can update their companies" ON companies
    FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Employers can manage their companies" ON companies
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'employer' 
            AND (companies.created_by = auth.uid() OR companies.created_by IS NULL)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'employer'
        )
    );

-- Jobs policies
CREATE POLICY "Jobs are publicly readable" ON jobs
    FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Active jobs are viewable by everyone" ON jobs
    FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Authenticated users can create jobs" ON jobs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Job creators can update their jobs" ON jobs
    FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Employers can manage their jobs" ON jobs
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'employer' 
            AND (jobs.created_by = auth.uid() OR jobs.created_by IS NULL)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'employer'
        )
    );

-- Applications policies
CREATE POLICY "Users can read own applications" ON applications
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON applications
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "applications_insert_own" ON applications
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employers can view applications to their jobs" ON applications
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM jobs j
            JOIN profiles p ON p.id = auth.uid()
            WHERE j.id = applications.job_id 
            AND j.created_by = auth.uid() 
            AND p.role = 'employer'
        )
    );

CREATE POLICY "Employers can update application status" ON applications
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM jobs j
            JOIN profiles p ON p.id = auth.uid()
            WHERE j.id = applications.job_id 
            AND j.created_by = auth.uid() 
            AND p.role = 'employer'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM jobs j
            JOIN profiles p ON p.id = auth.uid()
            WHERE j.id = applications.job_id 
            AND j.created_by = auth.uid() 
            AND p.role = 'employer'
        )
    );

-- Saved jobs policies
CREATE POLICY "Users can manage own saved jobs" ON saved_jobs
    FOR ALL TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Skills policies
CREATE POLICY "Skills are viewable by everyone" ON skills
    FOR SELECT TO authenticated USING (true);

-- User skills policies
CREATE POLICY "Users can manage own skills" ON user_skills
    FOR ALL TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications for themselves" ON notifications
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT TO authenticated WITH CHECK (true);

-- Employer notifications policies
CREATE POLICY "Employers can view own notifications" ON employer_notifications
    FOR SELECT TO authenticated USING (employer_id = auth.uid());

CREATE POLICY "Employers can update own notifications" ON employer_notifications
    FOR UPDATE TO authenticated USING (employer_id = auth.uid());

CREATE POLICY "System can insert notifications" ON employer_notifications
    FOR INSERT TO authenticated WITH CHECK (true);

-- Notification preferences policies
CREATE POLICY "Employers can manage own preferences" ON notification_preferences
    FOR ALL TO authenticated 
    USING (employer_id = auth.uid())
    WITH CHECK (employer_id = auth.uid());

-- Interview types policies
CREATE POLICY "Interview types are viewable by everyone" ON interview_types
    FOR SELECT TO authenticated USING (true);

-- Interview schedules policies
CREATE POLICY "Candidates can view their own interviews" ON interview_schedules
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM applications a
            WHERE a.id = interview_schedules.application_id 
            AND a.user_id = auth.uid()
        )
    );

CREATE POLICY "Employers can manage interviews for their jobs" ON interview_schedules
    FOR ALL TO authenticated 
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

-- Interview feedback policies
CREATE POLICY "Employers can manage feedback for their interviews" ON interview_feedback
    FOR ALL TO authenticated 
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

-- Application status timeline policies
CREATE POLICY "Users can view their own application status timeline" ON application_status_timeline
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = application_status_timeline.application_id 
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert timeline entries for own applications" ON application_status_timeline
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = application_status_timeline.application_id 
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert timeline entries" ON application_status_timeline
    FOR INSERT TO authenticated WITH CHECK (true);

-- Application status history policies
CREATE POLICY "application_status_history_select_own" ON application_status_history
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = application_status_history.application_id 
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "application_status_history_insert_system" ON application_status_history
    FOR INSERT TO authenticated WITH CHECK (true);

-- Application status metadata policies
CREATE POLICY "application_status_metadata_select_all" ON application_status_metadata
    FOR SELECT TO authenticated USING (true);

-- Application attachments policies
CREATE POLICY "application_attachments_select_own" ON application_attachments
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = application_attachments.application_id 
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "application_attachments_insert_own" ON application_attachments
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = application_attachments.application_id 
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "application_attachments_update_own" ON application_attachments
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = application_attachments.application_id 
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "application_attachments_delete_own" ON application_attachments
    FOR DELETE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = application_attachments.application_id 
            AND applications.user_id = auth.uid()
        )
    );

-- Application notes policies
CREATE POLICY "application_notes_select_visible" ON application_notes
    FOR SELECT TO authenticated 
    USING (
        is_visible_to_candidate = true 
        AND EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = application_notes.application_id 
            AND applications.user_id = auth.uid()
        )
    );

-- Password reset tokens policies
CREATE POLICY "Users can read own reset tokens" ON password_reset_tokens
    FOR SELECT TO authenticated USING (auth.uid() = user_id);