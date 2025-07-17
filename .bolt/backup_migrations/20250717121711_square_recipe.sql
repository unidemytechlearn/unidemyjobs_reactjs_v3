/*
  # Create interview feedback table with proper foreign key relationship

  1. New Tables
    - `interview_feedback`
      - `id` (uuid, primary key)
      - `interview_id` (uuid, foreign key to interview_schedules)
      - `rating` (integer, 1-5 scale)
      - `strengths` (text, optional)
      - `weaknesses` (text, optional)
      - `notes` (text, optional)
      - `recommendation` (text, enum values)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `interview_feedback` table
    - Add policies for employers to manage feedback for their interviews
    - Add policies for candidates to view feedback when appropriate

  3. Constraints
    - Foreign key relationship to interview_schedules
    - Check constraint for recommendation values
    - Check constraint for rating values
*/

-- Create interview_feedback table
CREATE TABLE IF NOT EXISTS interview_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  strengths text,
  weaknesses text,
  notes text,
  recommendation text NOT NULL CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE interview_feedback 
ADD CONSTRAINT fk_interview_feedback_interview_id 
FOREIGN KEY (interview_id) REFERENCES interview_schedules (id) ON DELETE CASCADE;

ALTER TABLE interview_feedback 
ADD CONSTRAINT fk_interview_feedback_created_by 
FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview_id ON interview_feedback (interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_created_by ON interview_feedback (created_by);

-- Enable RLS
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Employers can manage feedback for their interviews"
  ON interview_feedback
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interview_schedules is
      JOIN applications a ON a.id = is.application_id
      JOIN jobs j ON j.id = a.job_id
      WHERE is.id = interview_feedback.interview_id
      AND j.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_schedules is
      JOIN applications a ON a.id = is.application_id
      JOIN jobs j ON j.id = a.job_id
      WHERE is.id = interview_feedback.interview_id
      AND j.created_by = auth.uid()
    )
  );

CREATE POLICY "Candidates can view feedback for their interviews"
  ON interview_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interview_schedules is
      JOIN applications a ON a.id = is.application_id
      WHERE is.id = interview_feedback.interview_id
      AND a.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interview_feedback_updated_at
  BEFORE UPDATE ON interview_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();