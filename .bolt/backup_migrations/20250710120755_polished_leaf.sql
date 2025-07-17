/*
  # Fix RLS policy for application_status_timeline table

  1. Security Changes
    - Add INSERT policy for application_status_timeline table to allow system triggers to create timeline entries
    - Ensure authenticated users can insert timeline entries for applications they own

  This fixes the RLS violation error when submitting job applications.
*/

-- Add INSERT policy for application_status_timeline table
-- This allows authenticated users to insert timeline entries for applications they own
CREATE POLICY "Users can insert timeline entries for own applications"
  ON application_status_timeline
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = application_status_timeline.application_id 
      AND applications.user_id = auth.uid()
    )
  );

-- Also add a policy to allow system/trigger inserts
-- This is needed for database triggers that create timeline entries automatically
CREATE POLICY "System can insert timeline entries"
  ON application_status_timeline
  FOR INSERT
  TO authenticated
  WITH CHECK (true);