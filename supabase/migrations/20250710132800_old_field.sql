/*
  # Fix notifications table RLS policy

  1. Security Changes
    - Add INSERT policy for notifications table to allow users to create notifications
    - This enables the withdrawal notification system to work properly

  The current notifications table only has SELECT and UPDATE policies, but no INSERT policy.
  When applications are withdrawn, the system tries to create a notification but gets blocked by RLS.
*/

-- Add INSERT policy for notifications table
CREATE POLICY "Users can insert notifications for themselves"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also add a policy to allow system/trigger functions to insert notifications
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);