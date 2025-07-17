import { supabase } from './supabase';
import { createNotification, NotificationTemplates } from './notifications';

// Debug flag for logging - set to true to enable detailed logging
const DEBUG = true; 

// Debug logger
export const debug = (...args: any[]) => {
  if (DEBUG) {
    console.log('[Interviews]', ...args);
  }
};

// Get application by ID
export async function getApplicationById(applicationId: string) {
  try {
    debug('getApplicationById called with ID:', applicationId);
    
    if (!supabase || !applicationId) {
      debug('Supabase client not initialized or invalid applicationId:', { supabase: !!supabase, applicationId });
      return null;
    }

    debug('Fetching application with ID:', applicationId);
    
    // First check if the application exists
    const { data: checkData, error: checkError } = await supabase
      .from('applications')
      .select('id')
      .eq('id', applicationId)
      .single();
      
    if (checkError) {
      debug('Error checking if application exists:', checkError);
      return null;
    }
    
    if (!checkData) {
      debug('Application not found with ID:', applicationId);
      return null;
    }
    
    debug('Application exists, fetching details...');
    
    // Then fetch the full application data
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs(
          id,
          title,
          company:companies(
            id,
            name,
            logo_url
          )
        )
      `)
      .eq('id', applicationId)
      .single();

    if (error) {
      debug('Error fetching application:', error);
      throw error;
    }

    debug('Successfully fetched application:', data?.id);
    return data;
  } catch (error) {
    debug('Error fetching application by ID:', error);
    throw error;
  }
}

// Interface definitions
export interface InterviewScheduleData {
  application_id: string;
  interview_type: string;
  scheduled_date: string;
  duration_minutes: number;
  location?: string;
  meeting_link?: string;
  interviewer_ids?: string[];
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  created_by: string;
  send_notification?: boolean;
}

export interface InterviewFeedbackData {
  interview_id: string;
  rating: number;
  strengths?: string;
  weaknesses?: string;
  notes?: string;
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  created_by: string;
}

// Get interview types from the database
export async function getInterviewTypes() {
  try {
    debug('Fetching interview types');
    if (!supabase) {
      debug('Supabase client not initialized');
      debug('Returning default interview types');
      return getDefaultInterviewTypes();
    }

    const { data, error } = await supabase
      .from('interview_types')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      debug('Error fetching interview types:', error);
      debug('Returning default interview types due to error');
      return getDefaultInterviewTypes();
    }
    
    debug('Successfully fetched interview types:', data?.length || 0);
    return data && data.length > 0 ? data : getDefaultInterviewTypes();
  } catch (error) {
    debug('Error fetching interview types:', error);
    return getDefaultInterviewTypes();
  }
}

// Default interview types as fallback
function getDefaultInterviewTypes() {
  return [
    { id: 'phone', name: 'Phone Interview', description: 'Initial screening call', color: '#3B82F6', order_index: 1 },
    { id: 'video', name: 'Video Interview', description: 'Remote video interview', color: '#8B5CF6', order_index: 2 },
    { id: 'technical', name: 'Technical Interview', description: 'Technical assessment', color: '#10B981', order_index: 3 },
    { id: 'panel', name: 'Panel Interview', description: 'Interview with multiple team members', color: '#F59E0B', order_index: 4 },
    { id: 'in_person', name: 'In-Person Interview', description: 'On-site interview', color: '#EC4899', order_index: 5 },
    { id: 'final', name: 'Final Interview', description: 'Final decision round', color: '#EF4444', order_index: 6 }
  ];
}

// Schedule an interview
export async function scheduleInterview(interviewData: InterviewScheduleData) {
  try {
    debug("Scheduling interview with data:", interviewData);
    
    if (!supabase || !interviewData.application_id) {
      debug('Supabase client not initialized or missing application_id:', 
        { supabase: !!supabase, applicationId: interviewData.application_id });
      throw new Error('Database connection not available');
    }

    debug("Inserting interview schedule into database for application:", interviewData.application_id);
    
    // Insert interview schedule
    const { data, error } = await supabase
      .from('interview_schedules')
      .insert({
        application_id: interviewData.application_id,
        interview_type: interviewData.interview_type,
        scheduled_date: interviewData.scheduled_date,
        duration_minutes: interviewData.duration_minutes,
        location: interviewData.location,
        meeting_link: interviewData.meeting_link,
        interviewer_ids: interviewData.interviewer_ids,
        notes: interviewData.notes,
        status: interviewData.status,
        created_by: interviewData.created_by
      })
      .select(`
        *,
        application:applications (
          id,
          user_id,
          first_name,
          last_name,
          email,
          job:jobs (
            id,
            title,
            company:companies (
              id,
              name
            )
          )
        )
      `)
      .single();

    if (error) throw error;
    debug("Interview scheduled successfully:", data);

    // Send notification if requested
    if (interviewData.send_notification && data.application) {
      try {
        const jobTitle = data.application.job?.title || 'the position';
        const companyName = data.application.job?.company?.name || 'the company';
        const interviewDate = new Date(data.scheduled_date).toLocaleString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });

        const template = NotificationTemplates.INTERVIEW_SCHEDULED(
          jobTitle,
          companyName,
          interviewDate
        );
        
        await createNotification(
          data.application.user_id,
          template.title,
          template.message,
          template.type,
          `/dashboard/applications/${data.application_id}`
        );
      } catch (notificationError) {
        debug('Error creating interview notification:', notificationError);
        // Don't fail the interview scheduling if notification fails
      }
    }

    return data;
  } catch (error) {
    console.error('Error scheduling interview:', error);
    throw error;
  }
}

// Update interview status
export async function updateInterviewStatus(
  interviewId: string,
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled',
  userId: string
) {
  try {
    const { data, error } = await supabase
      .from('interview_schedules')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', interviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating interview status:', error);
    throw error;
  }
}

// Reschedule interview
export async function rescheduleInterview(
  interviewId: string,
  newDate: string,
  userId: string,
  sendNotification: boolean = true
) {
  try {
    const { data, error } = await supabase
      .from('interview_schedules')
      .update({ 
        scheduled_date: newDate,
        status: 'rescheduled',
        updated_at: new Date().toISOString()
      })
      .eq('id', interviewId)
      .select(`
        *,
        application:applications (
          *,
          job:jobs (*)
        )
      `)
      .single();

    if (error) throw error;

    // Send notification if requested
    if (sendNotification && data.application) {
      try {
        const jobTitle = data.application.job?.title || 'the position';
        const companyName = data.application.job?.company?.name || 'the company';
        const interviewDate = new Date(data.scheduled_date).toLocaleString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });

        await createNotification(
          data.application.user_id,
          'Interview Rescheduled',
          `Your interview for ${jobTitle} at ${companyName} has been rescheduled to ${interviewDate}.`,
          'application_update',
          `/dashboard/applications/${data.application_id}`
        );
      } catch (notificationError) {
        console.error('Error creating rescheduling notification:', notificationError);
      }
    }

    return data;
  } catch (error) {
    console.error('Error rescheduling interview:', error);
    throw error;
  }
}

// Cancel interview
export async function cancelInterview(
  interviewId: string,
  userId: string,
  reason?: string,
  sendNotification: boolean = true
) {
  try {
    const { data, error } = await supabase
      .from('interview_schedules')
      .update({ 
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', interviewId)
      .select(`
        *,
        application:applications (
          id,
          user_id,
          job:jobs (
            id,
            title,
            company:companies (
              id,
              name
            )
          )
        )
      `)
      .single();

    if (error) throw error;

    // Send notification if requested
    if (sendNotification && data.application) {
      try {
        const jobTitle = data.application.job?.title || 'the position';
        const companyName = data.application.job?.company?.name || 'the company';

        await createNotification(
          data.application.user_id,
          'Interview Cancelled',
          `Your interview for ${jobTitle} at ${companyName} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
          'application_update',
          `/dashboard/applications/${data.application_id}`
        );
      } catch (notificationError) {
        console.error('Error creating cancellation notification:', notificationError);
      }
    }

    return data;
  } catch (error) {
    console.error('Error cancelling interview:', error);
    throw error;
  }
}

// Submit interview feedback
export async function submitInterviewFeedback(feedbackData: InterviewFeedbackData) {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized');
      throw new Error('Database connection not available');
    }

    // Check if feedback already exists
    const { data: existingFeedback, error: checkError } = await supabase
      .from('interview_feedback')
      .select('id')
      .eq('interview_id', feedbackData.interview_id)
      .eq('created_by', feedbackData.created_by)
      .maybeSingle();

    if (checkError) throw checkError;

    let result;
    
    if (existingFeedback) {
      // Update existing feedback
      const { data, error } = await supabase
        .from('interview_feedback')
        .update({
          rating: feedbackData.rating,
          strengths: feedbackData.strengths,
          weaknesses: feedbackData.weaknesses,
          notes: feedbackData.notes,
          recommendation: feedbackData.recommendation,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFeedback.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new feedback
      const { data, error } = await supabase
        .from('interview_feedback')
        .insert({
          interview_id: feedbackData.interview_id,
          rating: feedbackData.rating,
          strengths: feedbackData.strengths,
          weaknesses: feedbackData.weaknesses,
          notes: feedbackData.notes,
          recommendation: feedbackData.recommendation,
          created_by: feedbackData.created_by
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Update interview status to completed
    await supabase
      .from('interview_schedules')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackData.interview_id);

    return result;
  } catch (error) {
    console.error('Error submitting interview feedback:', error);
    throw error;
  }
}

// Get interviews for an employer
export async function getEmployerInterviews(
  employerId: string,
  filters: {
    applicationId?: string;
    jobId?: string;
    status?: string;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<any[]> {
  try {
    if (!supabase) {
      debug('Supabase client not initialized');
      return [];
    }

    debug('Getting employer interviews for:', employerId, 'with filters:', filters);
    
    // First get the interviews without the feedback to avoid relationship errors
    let query = supabase.from('interview_schedules')
      .select(`
        *,
        application:applications (
          id,
          user_id,
          first_name, 
          last_name, 
          email, 
          phone, 
          job:jobs (
            id,
            title,
            company_id,
            created_by,
            company:companies (
              id,
              name,
              logo_url
            )
          )
        )
      `)
      .order('scheduled_date', { ascending: true });

    // Apply filters
    if (filters?.applicationId) {
      debug('Filtering by application ID:', filters.applicationId);
      query = query.eq('application_id', filters.applicationId); 
    } else if (filters?.jobId) {
      debug('Filtering by job ID:', filters.jobId);
      query = query.eq('application.job_id', filters.jobId);
    } else {
      // Only filter by employer if not filtering by specific application or job
      debug('Filtering by employer ID:', employerId);
      query = query.eq('application.job.created_by', employerId);
    }

    if (filters?.status) {
      debug('Filtering by status:', filters.status);
      query = query.eq('status', filters.status);
    }

    if (filters?.upcoming) {
      const now = new Date().toISOString();
      debug('Filtering for upcoming interviews after:', now);
      query = query.gt('scheduled_date', now);
    }

    if (filters?.limit) {
      debug('Limiting results to:', filters.limit);
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      debug('Setting offset to:', filters.offset);
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    debug('Executing interview query...');
    const { data: interviews, error } = await query;

    if (error) throw error;
    
    debug('Got interviews:', interviews?.length || 0);
    
    // Now get feedback separately for each interview
    if (interviews && interviews.length > 0) {
      try {
        const interviewIds = interviews.map(interview => interview.id);
        debug('Getting feedback for interviews:', interviewIds);
        
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('interview_feedback')
          .select('*')
          .in('interview_id', interviewIds);
          
        if (feedbackError) {
          debug('Error fetching feedback:', feedbackError);
        } else if (feedbackData) {
          debug('Got feedback data:', feedbackData.length);
          
          // Attach feedback to the corresponding interviews
          return interviews.map(interview => ({
            ...interview,
            feedback: feedbackData.filter(f => f.interview_id === interview.id)
          }));
        }
      } catch (feedbackError) {
        debug('Error processing feedback:', feedbackError);
      }
    }
    
    return interviews || [];
  } catch (error) {
    debug('Error fetching employer interviews:', error);
    return []; // Return empty array instead of throwing to prevent UI crashes
  }
}

// Get interviews for a candidate
export async function getCandidateInterviews(
  userId: string,
  filters: {
    applicationId?: string;
    jobId?: string;
    status?: string;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<any[]> {
  try {
    if (!supabase) {
      debug('Supabase client not initialized');
      return [];
    }

    debug('Getting candidate interviews for:', userId, 'with filters:', filters);
    let query = supabase
      .from('interview_schedules')
      .select(`
        *,
        application:applications!inner (
          id,
          user_id,
          job:jobs!left (
            id,
            title,
            company:companies!left (
              id,
              name,
              logo_url
            )
          )
        )
      `)
      .eq('application.user_id', userId)
      .order('scheduled_date', { ascending: true });

    // Apply filters
    if (filters?.applicationId) {
      query = query.eq('application_id', filters.applicationId);
    }

    if (filters?.jobId) {
      query = query.eq('application.job_id', filters.jobId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.upcoming) {
      const now = new Date().toISOString();
      query = query.gt('scheduled_date', now);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    debug('Successfully fetched candidate interviews:', data?.length || 0);
    return data || [];
  } catch (error) {
    debug('Error fetching candidate interviews:', error);
    return []; // Return empty array instead of throwing to prevent UI crashes
  }
}

// Get interview details
export async function getInterviewDetails(interviewId: string) {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return null;
    }

    // First get the interview schedule
    const { data: interviewData, error: interviewError } = await supabase
      .from('interview_schedules')
      .select(`
        *,
        application:applications (
          id,
          user_id,
          first_name,
          last_name,
          email,
          job:jobs (
            id,
            title,
            company:companies (
              id,
              name
            )
          )
        )
      `)
      .eq('id', interviewId)
      .single();

    if (interviewError) throw interviewError;
    
    // Then get feedback separately
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('interview_feedback')
      .select('*')
      .eq('interview_id', interviewId);
      
    if (feedbackError && feedbackError.code !== 'PGRST116') {
      console.error('Error fetching feedback:', feedbackError);
    }
    
    // Combine the data
    return {
      ...interviewData,
      feedback: feedbackData || []
    };
  } catch (error) {
    console.error('Error fetching interview details:', error);
    throw error;
  }
}

// Get upcoming interviews
export async function getUpcomingInterviews(userId: string, role: 'employer' | 'job_seeker', limit: number = 5) {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return [];
    }

    const now = new Date().toISOString();
    
    if (role === 'employer') {
      const { data, error } = await supabase
        .from('interview_schedules')
        .select(`
          *,
          application:applications (
            *,
            job:jobs (*)
          )
        `)
        .eq('application.job.created_by', userId)
        .eq('status', 'scheduled')
        .gt('scheduled_date', now)
        .order('scheduled_date', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } else {
      const { data, error } = await supabase
        .from('interview_schedules')
        .select(`
          *,
          application:applications!inner (
            *,
            job:jobs!left (*)
          )
        `)
        .eq('application.user_id', userId)
        .eq('status', 'scheduled')
        .gt('scheduled_date', now)
        .order('scheduled_date', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    }
  } catch (error) {
    console.error('Error fetching upcoming interviews:', error);
    throw error;
  }
}

// Get interview statistics
export async function getInterviewStatistics(employerId: string) {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return { total: 0, upcoming: 0, completed: 0, cancelled: 0, today: 0 };
    }

    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('interview_schedules')
      .select(`
        *,
        application:applications!left (job:jobs(*))
      `)
      .eq('application.job.created_by', employerId);

    if (error) {
      console.error('Error fetching interview statistics:', error);
      return { total: 0, upcoming: 0, completed: 0, cancelled: 0, today: 0 };
    }

    const stats = {
      total: data.length,
      upcoming: data.filter(i => i?.status === 'scheduled' && new Date(i.scheduled_date) > new Date()).length,
      completed: data.filter(i => i.status === 'completed').length || 0,
      cancelled: data.filter(i => i.status === 'cancelled').length || 0,
      today: data.filter(i => {
        if (!i.scheduled_date) return false;
        const interviewDate = new Date(i.scheduled_date);
        const today = new Date();
        return (
          interviewDate.getDate() === today.getDate() &&
          interviewDate.getMonth() === today.getMonth() &&
          interviewDate.getFullYear() === today.getFullYear()
        );
      }).length || 0
    };

    return stats;
  } catch (error) {
    console.error('Error fetching interview statistics:', error);
    throw error;
  }
}