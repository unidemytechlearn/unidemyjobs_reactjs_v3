/*
  # Fix Application Status Timeline RLS Policy

  1. Security Updates
    - Add INSERT policy for application_status_timeline table to allow system triggers
    - Ensure authenticated users can create timeline entries for their own applications
    - Allow system functions to insert timeline entries automatically

  2. Changes
    - Add policy for INSERT operations on application_status_timeline
    - Allow both user-initiated and system-initiated timeline entries
*/

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view their own application status timeline" ON application_status_timeline;

-- Create comprehensive policies for application_status_timeline
CREATE POLICY "Users can view their own application status timeline"
  ON application_status_timeline
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_status_timeline.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow timeline entries for user applications"
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

-- Also allow system/trigger insertions by allowing service role
CREATE POLICY "Allow system timeline entries"
  ON application_status_timeline
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Ensure the table has RLS enabled
ALTER TABLE application_status_timeline ENABLE ROW LEVEL SECURITY;