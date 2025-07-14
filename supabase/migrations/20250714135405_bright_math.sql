/*
  # Add profile picture fields to profiles table

  1. New Columns
    - `profile_picture_url` (text, nullable) - URL to the uploaded profile picture
    - `profile_picture_uploaded_at` (timestamptz, nullable) - When the profile picture was uploaded

  2. Storage
    - Create profile-pictures bucket for storing profile images
    - Set up RLS policies for secure access
*/

-- Add profile picture columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_picture_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_picture_uploaded_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_picture_uploaded_at timestamptz;
  END IF;
END $$;

-- Create profile-pictures storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for profile-pictures bucket
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own profile pictures"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to view profile pictures
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');