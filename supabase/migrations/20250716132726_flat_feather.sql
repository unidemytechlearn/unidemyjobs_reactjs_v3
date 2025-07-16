/*
  # Add User Roles and Employer Features

  1. Schema Updates
    - Add `role` column to profiles table
    - Add employer-specific columns to profiles
    - Update RLS policies for employer access
    - Add indexes for better performance

  2. Security
    - Update RLS policies for role-based access
    - Ensure employers can only manage their own data
    - Job seekers can only view public data

  3. New Features
    - User role management
    - Employer-specific profile fields
    - Enhanced company and job management
*/

-- Add role column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'job_seeker';
  END IF;
END $$;

-- Add role constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('job_seeker', 'employer', 'admin'));
  END IF;
END $$;

-- Add employer-specific fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'company_position'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company_position text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'company_size'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company_size text;
  END IF;
END $$;

-- Add index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update companies table RLS policies for employers
DROP POLICY IF EXISTS "Employers can manage their companies" ON companies;
CREATE POLICY "Employers can manage their companies"
  ON companies
  FOR ALL
  TO authenticated
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

-- Update jobs table RLS policies for employers
DROP POLICY IF EXISTS "Employers can manage their jobs" ON jobs;
CREATE POLICY "Employers can manage their jobs"
  ON jobs
  FOR ALL
  TO authenticated
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

-- Enhanced applications RLS for employers to view applications to their jobs
DROP POLICY IF EXISTS "Employers can view applications to their jobs" ON applications;
CREATE POLICY "Employers can view applications to their jobs"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN profiles p ON p.id = auth.uid()
      WHERE j.id = applications.job_id
      AND j.created_by = auth.uid()
      AND p.role = 'employer'
    )
  );

-- Allow employers to update application status
DROP POLICY IF EXISTS "Employers can update application status" ON applications;
CREATE POLICY "Employers can update application status"
  ON applications
  FOR UPDATE
  TO authenticated
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

-- Create function to get employer statistics
CREATE OR REPLACE FUNCTION get_employer_stats(employer_id uuid)
RETURNS TABLE (
  total_jobs bigint,
  active_jobs bigint,
  total_applications bigint,
  pending_applications bigint,
  company_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(job_stats.total_jobs, 0) as total_jobs,
    COALESCE(job_stats.active_jobs, 0) as active_jobs,
    COALESCE(app_stats.total_applications, 0) as total_applications,
    COALESCE(app_stats.pending_applications, 0) as pending_applications,
    companies.id as company_id
  FROM companies
  LEFT JOIN (
    SELECT 
      company_id,
      COUNT(*) as total_jobs,
      COUNT(*) FILTER (WHERE is_active = true) as active_jobs
    FROM jobs
    WHERE created_by = employer_id
    GROUP BY company_id
  ) job_stats ON job_stats.company_id = companies.id
  LEFT JOIN (
    SELECT 
      j.company_id,
      COUNT(*) as total_applications,
      COUNT(*) FILTER (WHERE a.status IN ('submitted', 'under_review')) as pending_applications
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    WHERE j.created_by = employer_id
    GROUP BY j.company_id
  ) app_stats ON app_stats.company_id = companies.id
  WHERE companies.created_by = employer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_employer_stats(uuid) TO authenticated;