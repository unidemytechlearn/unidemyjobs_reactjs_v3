/*
  # Clean up and consolidate interview management migrations

  This migration consolidates all the interview management system migrations
  into a single file to prevent conflicts and duplicate migrations.
  
  1. Tables
    - Ensures interview_types table exists with correct structure
    - Ensures interview_schedules table exists with correct structure
    - Ensures interview_feedback table exists with correct structure
    
  2. Security
    - Sets up proper RLS policies for all tables
    - Enables row level security
    
  3. Relationships
    - Establishes proper foreign key relationships
*/

-- First, check if tables exist and drop them if they do (to avoid conflicts)
DO $$ 
BEGIN
  -- Drop tables if they exist (in reverse order of dependencies)
  DROP TABLE IF EXISTS public.interview_feedback;
  DROP TABLE IF EXISTS public.interview_schedules;
  DROP TABLE IF EXISTS public.interview_types;
  
  -- Create interview_types table
  CREATE TABLE IF NOT EXISTS public.interview_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL,
    order_index INTEGER NOT NULL
  );
  
  -- Create interview_schedules table
  CREATE TABLE IF NOT EXISTS public.interview_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    interview_type TEXT,
    scheduled_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location TEXT,
    meeting_link TEXT,
    interviewer_ids UUID[],
    notes TEXT,
    status TEXT DEFAULT 'scheduled',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  
  -- Create interview_feedback table
  CREATE TABLE IF NOT EXISTS public.interview_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL REFERENCES public.interview_schedules(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    strengths TEXT,
    weaknesses TEXT,
    notes TEXT,
    recommendation TEXT NOT NULL CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  
  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_interview_schedules_application_id ON public.interview_schedules(application_id);
  CREATE INDEX IF NOT EXISTS idx_interview_schedules_scheduled_date ON public.interview_schedules(scheduled_date);
  CREATE INDEX IF NOT EXISTS idx_interview_schedules_status ON public.interview_schedules(status);
  CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview_id ON public.interview_feedback(interview_id);
  
  -- Add trigger for updated_at
  DROP TRIGGER IF EXISTS update_interview_schedules_updated_at ON public.interview_schedules;
  CREATE TRIGGER update_interview_schedules_updated_at
    BEFORE UPDATE ON public.interview_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
  DROP TRIGGER IF EXISTS update_interview_feedback_updated_at ON public.interview_feedback;
  CREATE TRIGGER update_interview_feedback_updated_at
    BEFORE UPDATE ON public.interview_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  -- Enable RLS
  ALTER TABLE public.interview_types ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;
  
  -- Create RLS policies
  -- Interview types are viewable by everyone
  DROP POLICY IF EXISTS "Interview types are viewable by everyone" ON public.interview_types;
  CREATE POLICY "Interview types are viewable by everyone"
    ON public.interview_types
    FOR SELECT
    TO authenticated
    USING (true);
  
  -- Candidates can view their own interviews
  DROP POLICY IF EXISTS "Candidates can view their own interviews" ON public.interview_schedules;
  CREATE POLICY "Candidates can view their own interviews"
    ON public.interview_schedules
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM applications a
        WHERE a.id = interview_schedules.application_id
        AND a.user_id = auth.uid()
      )
    );
  
  -- Employers can manage interviews for their jobs
  DROP POLICY IF EXISTS "Employers can manage interviews for their jobs" ON public.interview_schedules;
  CREATE POLICY "Employers can manage interviews for their jobs"
    ON public.interview_schedules
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE a.id = interview_schedules.application_id
        AND j.created_by = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE a.id = interview_schedules.application_id
        AND j.created_by = auth.uid()
      )
    );
  
  -- Employers can manage feedback for their interviews
  DROP POLICY IF EXISTS "Employers can manage feedback for their interviews" ON public.interview_feedback;
  CREATE POLICY "Employers can manage feedback for their interviews"
    ON public.interview_feedback
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM interview_schedules s
        JOIN applications a ON s.application_id = a.id
        JOIN jobs j ON a.job_id = j.id
        WHERE s.id = interview_feedback.interview_id
        AND j.created_by = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM interview_schedules s
        JOIN applications a ON s.application_id = a.id
        JOIN jobs j ON a.job_id = j.id
        WHERE s.id = interview_feedback.interview_id
        AND j.created_by = auth.uid()
      )
    );
  
  -- Insert default interview types if the table is empty
  INSERT INTO public.interview_types (id, name, description, color, order_index)
  SELECT * FROM (
    VALUES
      ('phone', 'Phone Interview', 'Initial screening call', '#3B82F6', 1),
      ('video', 'Video Interview', 'Remote video interview', '#8B5CF6', 2),
      ('technical', 'Technical Interview', 'Technical assessment', '#10B981', 3),
      ('panel', 'Panel Interview', 'Interview with multiple team members', '#F59E0B', 4),
      ('in_person', 'In-Person Interview', 'On-site interview', '#EC4899', 5),
      ('final', 'Final Interview', 'Final decision round', '#EF4444', 6)
  ) AS t(id, name, description, color, order_index)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.interview_types
  );
  
END $$;