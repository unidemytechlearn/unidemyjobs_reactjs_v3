/*
  # Complete Interview Management System

  1. New Tables
    - `interview_feedback` table for storing interview evaluations
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    
  3. Data
    - Populate interview types with default values
*/

-- First, ensure interview_types table has data
INSERT INTO public.interview_types (id, name, description, color, order_index)
VALUES
  ('phone', 'Phone Interview', 'Initial screening call', '#3B82F6', 1),
  ('video', 'Video Interview', 'Remote video interview', '#8B5CF6', 2),
  ('technical', 'Technical Interview', 'Technical assessment', '#10B981', 3),
  ('panel', 'Panel Interview', 'Interview with multiple team members', '#F59E0B', 4),
  ('in_person', 'In-Person Interview', 'On-site interview', '#EC4899', 5),
  ('final', 'Final Interview', 'Final decision round', '#EF4444', 6)
ON CONFLICT (id) DO NOTHING;

-- Create interview_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.interview_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID NOT NULL REFERENCES public.interview_schedules(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  strengths TEXT,
  weaknesses TEXT,
  notes TEXT,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on interview_id for better performance
CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview_id ON public.interview_feedback(interview_id);

-- Add missing columns to interview_schedules if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'interview_schedules' AND column_name = 'status') THEN
    ALTER TABLE public.interview_schedules ADD COLUMN status TEXT DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'interview_schedules' AND column_name = 'notes') THEN
    ALTER TABLE public.interview_schedules ADD COLUMN notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'interview_schedules' AND column_name = 'interviewer_ids') THEN
    ALTER TABLE public.interview_schedules ADD COLUMN interviewer_ids UUID[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'interview_schedules' AND column_name = 'created_by') THEN
    ALTER TABLE public.interview_schedules ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'interview_schedules' AND column_name = 'created_at') THEN
    ALTER TABLE public.interview_schedules ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'interview_schedules' AND column_name = 'updated_at') THEN
    ALTER TABLE public.interview_schedules ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Enable RLS on interview_schedules if not already enabled
ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;

-- Enable RLS on interview_feedback
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for interview_schedules
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'interview_schedules' AND policyname = 'Employers can manage interviews for their jobs') THEN
    CREATE POLICY "Employers can manage interviews for their jobs"
      ON public.interview_schedules
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM applications a
          JOIN jobs j ON a.job_id = j.id
          WHERE a.id = interview_schedules.application_id
          AND j.created_by = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM applications a
          JOIN jobs j ON a.job_id = j.id
          WHERE a.id = interview_schedules.application_id
          AND j.created_by = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'interview_schedules' AND policyname = 'Candidates can view their own interviews') THEN
    CREATE POLICY "Candidates can view their own interviews"
      ON public.interview_schedules
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM applications a
          WHERE a.id = interview_schedules.application_id
          AND a.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create policies for interview_feedback
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'interview_feedback' AND policyname = 'Employers can manage feedback for their interviews') THEN
    CREATE POLICY "Employers can manage feedback for their interviews"
      ON public.interview_feedback
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM interview_schedules s
          JOIN applications a ON s.application_id = a.id
          JOIN jobs j ON a.job_id = j.id
          WHERE s.id = interview_feedback.interview_id
          AND j.created_by = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM interview_schedules s
          JOIN applications a ON s.application_id = a.id
          JOIN jobs j ON a.job_id = j.id
          WHERE s.id = interview_feedback.interview_id
          AND j.created_by = auth.uid()
        )
      );
  END IF;
END $$;

-- Create trigger for updating updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to interview_schedules if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_interview_schedules_updated_at') THEN
    CREATE TRIGGER update_interview_schedules_updated_at
    BEFORE UPDATE ON public.interview_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add trigger to interview_feedback if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_interview_feedback_updated_at') THEN
    CREATE TRIGGER update_interview_feedback_updated_at
    BEFORE UPDATE ON public.interview_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;