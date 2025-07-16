/*
  # Fix employer stats function

  1. Drop existing function if it exists
  2. Create new function with proper table qualifications
  3. Ensure no ambiguous column references
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_employer_stats(uuid);

-- Create a new function with properly qualified column names
CREATE OR REPLACE FUNCTION get_employer_stats(employer_id uuid)
RETURNS TABLE (
  total_jobs bigint,
  active_jobs bigint,
  total_applications bigint,
  pending_applications bigint,
  company_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(job_stats.total_jobs, 0) as total_jobs,
    COALESCE(job_stats.active_jobs, 0) as active_jobs,
    COALESCE(app_stats.total_applications, 0) as total_applications,
    COALESCE(app_stats.pending_applications, 0) as pending_applications,
    companies.id as company_id
  FROM 
    companies
  LEFT JOIN (
    SELECT 
      jobs.company_id,
      COUNT(*) as total_jobs,
      COUNT(*) FILTER (WHERE jobs.is_active = true) as active_jobs
    FROM jobs
    WHERE jobs.created_by = employer_id
    GROUP BY jobs.company_id
  ) job_stats ON companies.id = job_stats.company_id
  LEFT JOIN (
    SELECT 
      jobs.company_id,
      COUNT(applications.id) as total_applications,
      COUNT(applications.id) FILTER (
        WHERE applications.status IN ('submitted', 'under_review')
      ) as pending_applications
    FROM jobs
    LEFT JOIN applications ON jobs.id = applications.job_id
    WHERE jobs.created_by = employer_id
    GROUP BY jobs.company_id
  ) app_stats ON companies.id = app_stats.company_id
  WHERE companies.created_by = employer_id
  LIMIT 1;
END;
$$;