/*
  # Add anonymous access policies for jobs and companies

  1. Security Changes
    - Add policy to allow anonymous users to read active jobs
    - Add policy to allow anonymous users to read companies
    - These policies enable the homepage and jobs page to work for non-logged-in users

  2. Changes
    - Jobs table: Allow anonymous (anon) role to SELECT active jobs
    - Companies table: Allow anonymous (anon) role to SELECT all companies
*/

-- Allow anonymous users to read active jobs
CREATE POLICY "Jobs are publicly readable" 
ON jobs FOR SELECT 
TO anon, authenticated 
USING (is_active = true);

-- Allow anonymous users to read companies
CREATE POLICY "Companies are publicly readable" 
ON companies FOR SELECT 
TO anon, authenticated 
USING (true);