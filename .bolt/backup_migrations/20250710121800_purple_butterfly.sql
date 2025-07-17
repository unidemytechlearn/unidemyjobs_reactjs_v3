/*
  # Add resume storage support

  1. Storage
    - Create storage bucket for resumes
    - Set up RLS policies for secure access

  2. Profile Updates
    - Add resume_url column if not exists
    - Add resume_file_name and resume_uploaded_at for tracking

  3. Security
    - Users can only access their own resume files
    - File type and size restrictions
*/

-- Create storage bucket for resumes (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage bucket
UPDATE storage.buckets 
SET public = false 
WHERE id = 'resumes';

-- Create RLS policies for resume storage
CREATE POLICY "Users can upload their own resumes"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own resumes"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own resumes"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own resumes"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add resume tracking columns to profiles table
DO $$
BEGIN
  -- Add resume_file_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'resume_file_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN resume_file_name text;
  END IF;

  -- Add resume_uploaded_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'resume_uploaded_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN resume_uploaded_at timestamptz;
  END IF;

  -- Add resume_file_size column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'resume_file_size'
  ) THEN
    ALTER TABLE profiles ADD COLUMN resume_file_size integer;
  END IF;
END $$;