import { supabase } from './supabase';

// Application types
export interface ApplicationData {
  job_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  years_experience: string;
  expected_salary?: string;
  current_salary?: string;
  availability_date?: string;
  notice_period?: string;
  cover_letter?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  website_url?: string;
  skills?: string[];
  referral_source?: string;
  is_remote_preferred?: boolean;
  willing_to_relocate?: boolean;
  screening_answers?: Record<string, any>;
  resume_url?: string;
  additional_info?: Record<string, any>;
}

export interface ApplicationAttachment {
  id: string;
  application_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  attachment_type: 'resume' | 'cover_letter' | 'portfolio' | 'certificate' | 'other';
  uploaded_at: string;
}

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  change_reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface InterviewSchedule {
  id: string;
  application_id: string;
  interview_type: 'phone' | 'video' | 'in_person' | 'technical' | 'panel' | 'final';
  scheduled_date: string;
  duration_minutes: number;
  location?: string;
  meeting_link?: string;
  interviewer_ids: string[];
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Application submission
export const submitApplication = async (applicationData: ApplicationData): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .insert([applicationData])
      .select(`
        *,
        job:jobs(
          *,
          company:companies(*)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting application:', error);
    throw error;
  }
};

// File upload for resumes and attachments
export const uploadApplicationFile = async (
  file: File,
  userId: string,
  applicationId: string,
  fileType: 'resume' | 'cover_letter' | 'portfolio' | 'certificate' | 'other'
): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${applicationId}/${fileName}`;

    // Upload to appropriate bucket based on file type
    const bucket = fileType === 'resume' ? 'resumes' : 'application-attachments';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadData.path);

    // Save attachment record
    const { error: attachmentError } = await supabase
      .from('application_attachments')
      .insert({
        application_id: applicationId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: publicUrl,
        attachment_type: fileType,
      });

    if (attachmentError) throw attachmentError;

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Get user applications with full details
export const getUserApplications = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs(
          *,
          company:companies(*)
        ),
        attachments:application_attachments(*),
        status_history:application_status_history(
          *,
          changed_by_profile:profiles!application_status_history_changed_by_fkey(first_name, last_name)
        ),
        interviews:interview_schedules(*)
      `)
      .eq('user_id', userId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user applications:', error);
    throw error;
  }
};

// Get single application with full details
export const getApplication = async (applicationId: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs(
          *,
          company:companies(*)
        ),
        attachments:application_attachments(*),
        status_history:application_status_history(
          *,
          changed_by_profile:profiles!application_status_history_changed_by_fkey(first_name, last_name)
        ),
        interviews:interview_schedules(*),
        notes:application_notes(*)
      `)
      .eq('id', applicationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching application:', error);
    throw error;
  }
};

// Update application status
export const updateApplicationStatus = async (
  applicationId: string,
  newStatus: string,
  reason?: string,
  notes?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId);

    if (error) throw error;

    // Add status history entry with reason and notes
    if (reason || notes) {
      await supabase
        .from('application_status_history')
        .insert({
          application_id: applicationId,
          new_status: newStatus,
          change_reason: reason,
          notes: notes,
          changed_by: (await supabase.auth.getUser()).data.user?.id,
        });
    }
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

// Withdraw application
export const withdrawApplication = async (applicationId: string, reason?: string): Promise<void> => {
  try {
    await updateApplicationStatus(applicationId, 'withdrawn', reason);
  } catch (error) {
    console.error('Error withdrawing application:', error);
    throw error;
  }
};

// Check if user has already applied to a job
export const hasUserAppliedToJob = async (userId: string, jobId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking application status:', error);
    return false;
  }
};

// Get applications for a specific job (for employers)
export const getJobApplications = async (jobId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        applicant:profiles!applications_user_id_fkey(*),
        attachments:application_attachments(*),
        status_history:application_status_history(*),
        interviews:interview_schedules(*)
      `)
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching job applications:', error);
    throw error;
  }
};

// Get application statistics for a job
export const getJobApplicationStats = async (jobId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('status')
      .eq('job_id', jobId);

    if (error) throw error;

    const stats = {
      total: data.length,
      submitted: 0,
      under_review: 0,
      interview_scheduled: 0,
      interview_completed: 0,
      offer_made: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };

    data.forEach((app) => {
      if (stats.hasOwnProperty(app.status.replace('-', '_'))) {
        stats[app.status.replace('-', '_') as keyof typeof stats]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching application stats:', error);
    throw error;
  }
};

// Schedule interview
export const scheduleInterview = async (interviewData: Partial<InterviewSchedule>): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('interview_schedules')
      .insert([{
        ...interviewData,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }])
      .select()
      .single();

    if (error) throw error;

    // Update application status to interview_scheduled if not already
    await supabase
      .from('applications')
      .update({ status: 'interview_scheduled' })
      .eq('id', interviewData.application_id);

    return data;
  } catch (error) {
    console.error('Error scheduling interview:', error);
    throw error;
  }
};

// Get upcoming interviews for a user
export const getUserInterviews = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('interview_schedules')
      .select(`
        *,
        application:applications(
          *,
          job:jobs(
            *,
            company:companies(*)
          )
        )
      `)
      .eq('application.user_id', userId)
      .gte('scheduled_date', new Date().toISOString())
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user interviews:', error);
    throw error;
  }
};

// Add application note
export const addApplicationNote = async (
  applicationId: string,
  note: string,
  noteType: 'general' | 'interview' | 'screening' | 'feedback' | 'internal',
  isVisibleToCandidate: boolean = false
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('application_notes')
      .insert({
        application_id: applicationId,
        note,
        note_type: noteType,
        is_visible_to_candidate: isVisibleToCandidate,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error adding application note:', error);
    throw error;
  }
};

// Get application analytics for dashboard
export const getApplicationAnalytics = async (userId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('status, applied_at')
      .eq('user_id', userId);

    if (error) throw error;

    const analytics = {
      total_applications: data.length,
      applications_this_month: 0,
      response_rate: 0,
      interview_rate: 0,
      status_breakdown: {
        submitted: 0,
        under_review: 0,
        interview_scheduled: 0,
        interview_completed: 0,
        offer_made: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0,
      },
      recent_activity: data.slice(0, 5),
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    data.forEach((app) => {
      const appliedDate = new Date(app.applied_at);
      
      // Count applications this month
      if (appliedDate.getMonth() === currentMonth && appliedDate.getFullYear() === currentYear) {
        analytics.applications_this_month++;
      }

      // Count status breakdown
      const status = app.status.replace('-', '_');
      if (analytics.status_breakdown.hasOwnProperty(status)) {
        analytics.status_breakdown[status as keyof typeof analytics.status_breakdown]++;
      }
    });

    // Calculate rates
    const responded = data.filter(app => !['submitted'].includes(app.status)).length;
    const interviewed = data.filter(app => ['interview_scheduled', 'interview_completed', 'offer_made', 'accepted'].includes(app.status)).length;

    analytics.response_rate = data.length > 0 ? Math.round((responded / data.length) * 100) : 0;
    analytics.interview_rate = data.length > 0 ? Math.round((interviewed / data.length) * 100) : 0;

    return analytics;
  } catch (error) {
    console.error('Error fetching application analytics:', error);
    throw error;
  }
};