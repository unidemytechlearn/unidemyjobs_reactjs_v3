import { supabase } from './supabase';
import { createNotification, NotificationTemplates } from './notifications';

export interface InterviewType {
  id: string;
  name: string;
  description: string;
  order_index: number;
}

export interface InterviewStatus {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  order_index: number;
}

export interface Interview {
  id: string;
  application_id: string;
  type: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  location?: string;
  meeting_link?: string;
  notes?: string;
  feedback?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewParticipant {
  id: string;
  interview_id: string;
  user_id: string;
  role: 'interviewer' | 'candidate' | 'observer';
  status: 'invited' | 'confirmed' | 'declined' | 'attended' | 'no_show';
  notes?: string;
  created_at: string;
}

export interface InterviewFeedback {
  id: string;
  interview_id: string;
  evaluator_id: string;
  rating?: number;
  strengths?: string;
  weaknesses?: string;
  notes?: string;
  recommendation?: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  is_visible_to_candidate: boolean;
  created_at: string;
  updated_at: string;
}

export interface InterviewWithDetails extends Interview {
  application?: any;
  job?: any;
  company?: any;
  participants?: InterviewParticipant[];
  feedback?: InterviewFeedback[];
  type_details?: InterviewType;
  status_details?: InterviewStatus;
}

// Get all interview types
export const getInterviewTypes = async (): Promise<InterviewType[]> => {
  try {
    const { data, error } = await supabase
      .from('interview_types')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching interview types:', error);
    throw error;
  }
};

// Get all interview statuses
export const getInterviewStatuses = async (): Promise<InterviewStatus[]> => {
  try {
    const { data, error } = await supabase
      .from('interview_statuses')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching interview statuses:', error);
    throw error;
  }
};

// Schedule a new interview
export const scheduleInterview = async (
  applicationId: string,
  interviewData: {
    type: string;
    scheduled_at: string;
    duration_minutes: number;
    location?: string;
    meeting_link?: string;
    notes?: string;
  },
  participantIds: string[],
  createdBy: string
): Promise<Interview> => {
  try {
    // Start a transaction
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .insert({
        application_id: applicationId,
        type: interviewData.type,
        status: 'scheduled',
        scheduled_at: interviewData.scheduled_at,
        duration_minutes: interviewData.duration_minutes,
        location: interviewData.location,
        meeting_link: interviewData.meeting_link,
        notes: interviewData.notes,
        created_by: createdBy
      })
      .select()
      .single();

    if (interviewError) throw interviewError;

    // Get the candidate ID from the application
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('user_id')
      .eq('id', applicationId)
      .single();

    if (appError) throw appError;

    // Add the candidate as a participant
    const { error: candidateError } = await supabase
      .from('interview_participants')
      .insert({
        interview_id: interview.id,
        user_id: application.user_id,
        role: 'candidate',
        status: 'invited'
      });

    if (candidateError) throw candidateError;

    // Add other participants (interviewers)
    if (participantIds.length > 0) {
      const interviewers = participantIds.map(userId => ({
        interview_id: interview.id,
        user_id: userId,
        role: 'interviewer',
        status: 'invited'
      }));

      const { error: interviewersError } = await supabase
        .from('interview_participants')
        .insert(interviewers);

      if (interviewersError) throw interviewersError;
    }

    // Send notification to candidate (this is also handled by the database trigger,
    // but we're doing it here as well for redundancy)
    try {
      // Get job and company details for the notification
      const { data: jobData } = await supabase
        .from('applications')
        .select(`
          job:jobs (
            id,
            title,
            company:companies (
              id,
              name
            )
          )
        `)
        .eq('id', applicationId)
        .single();

      if (jobData) {
        const template = NotificationTemplates.INTERVIEW_SCHEDULED(
          jobData.job.title,
          jobData.job.company.name,
          new Date(interviewData.scheduled_at).toLocaleString(),
          interviewData.type
        );
        
        await createNotification(
          application.user_id,
          template.title,
          template.message,
          'interview_scheduled',
          `/dashboard/applications/${applicationId}`,
          {
            interview_id: interview.id,
            scheduled_at: interviewData.scheduled_at,
            duration_minutes: interviewData.duration_minutes,
            type: interviewData.type
          }
        );
      }
    } catch (notificationError) {
      console.error('Error creating interview notification:', notificationError);
      // Don't fail the interview creation if notification fails
    }

    return interview;
  } catch (error) {
    console.error('Error scheduling interview:', error);
    throw error;
  }
};

// Update an existing interview
export const updateInterview = async (
  interviewId: string,
  updates: Partial<Interview>
): Promise<Interview> => {
  try {
    // Remove fields that shouldn't be updated
    const { id, created_at, created_by, application_id, ...validUpdates } = updates as any;
    
    const { data, error } = await supabase
      .from('interviews')
      .update(validUpdates)
      .eq('id', interviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating interview:', error);
    throw error;
  }
};

// Cancel an interview
export const cancelInterview = async (
  interviewId: string,
  reason?: string
): Promise<Interview> => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .update({
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : undefined
      })
      .eq('id', interviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error cancelling interview:', error);
    throw error;
  }
};

// Reschedule an interview
export const rescheduleInterview = async (
  interviewId: string,
  newSchedule: {
    scheduled_at: string;
    duration_minutes?: number;
    location?: string;
    meeting_link?: string;
    notes?: string;
  }
): Promise<Interview> => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .update({
        status: 'rescheduled',
        scheduled_at: newSchedule.scheduled_at,
        duration_minutes: newSchedule.duration_minutes,
        location: newSchedule.location,
        meeting_link: newSchedule.meeting_link,
        notes: newSchedule.notes
      })
      .eq('id', interviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error rescheduling interview:', error);
    throw error;
  }
};

// Mark interview as completed
export const completeInterview = async (
  interviewId: string,
  notes?: string
): Promise<Interview> => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .update({
        status: 'completed',
        notes: notes
      })
      .eq('id', interviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error completing interview:', error);
    throw error;
  }
};

// Get interviews for a specific application
export const getInterviewsByApplication = async (
  applicationId: string
): Promise<InterviewWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        type_details:interview_types!type(*),
        status_details:interview_statuses!status(*),
        participants:interview_participants(*)
      `)
      .eq('application_id', applicationId)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching interviews by application:', error);
    throw error;
  }
};

// Get interviews for a specific job
export const getInterviewsByJob = async (
  jobId: string
): Promise<InterviewWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        application:applications!application_id(
          id,
          user_id,
          first_name,
          last_name,
          email
        ),
        type_details:interview_types!type(*),
        status_details:interview_statuses!status(*)
      `)
      .eq('application.job_id', jobId)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching interviews by job:', error);
    throw error;
  }
};

// Get interviews for a specific user (candidate)
export const getInterviewsForCandidate = async (
  userId: string
): Promise<InterviewWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('interview_participants')
      .select(`
        interview:interviews(
          *,
          application:applications!application_id(
            id,
            job:jobs(
              id,
              title,
              company:companies(
                id,
                name,
                logo_url
              )
            )
          ),
          type_details:interview_types!type(*),
          status_details:interview_statuses!status(*)
        )
      `)
      .eq('user_id', userId)
      .eq('role', 'candidate')
      .order('scheduled_at', { foreignTable: 'interviews', ascending: true });

    if (error) throw error;
    
    // Flatten the structure
    return data?.map(item => ({
      ...item.interview,
      participants: [{ user_id: userId, role: 'candidate' }]
    })) || [];
  } catch (error) {
    console.error('Error fetching interviews for candidate:', error);
    throw error;
  }
};

// Get interviews for a specific user (interviewer)
export const getInterviewsForInterviewer = async (
  userId: string
): Promise<InterviewWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('interview_participants')
      .select(`
        interview:interviews(
          *,
          application:applications!application_id(
            id,
            first_name,
            last_name,
            email,
            job:jobs(
              id,
              title,
              company:companies(
                id,
                name,
                logo_url
              )
            )
          ),
          type_details:interview_types!type(*),
          status_details:interview_statuses!status(*)
        )
      `)
      .eq('user_id', userId)
      .eq('role', 'interviewer')
      .order('scheduled_at', { foreignTable: 'interviews', ascending: true });

    if (error) throw error;
    
    // Flatten the structure
    return data?.map(item => ({
      ...item.interview,
      participants: [{ user_id: userId, role: 'interviewer' }]
    })) || [];
  } catch (error) {
    console.error('Error fetching interviews for interviewer:', error);
    throw error;
  }
};

// Get a specific interview with all details
export const getInterviewDetails = async (
  interviewId: string
): Promise<InterviewWithDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        application:applications!application_id(
          *,
          job:jobs(
            *,
            company:companies(*)
          ),
          user:profiles!user_id(*)
        ),
        participants:interview_participants(
          *,
          user:profiles!user_id(*)
        ),
        feedback:interview_feedback(
          *,
          evaluator:profiles!evaluator_id(*)
        ),
        type_details:interview_types!type(*),
        status_details:interview_statuses!status(*)
      `)
      .eq('id', interviewId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Interview not found
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching interview details:', error);
    throw error;
  }
};

// Update participant status (confirm/decline)
export const updateParticipantStatus = async (
  participantId: string,
  status: 'confirmed' | 'declined',
  notes?: string
): Promise<InterviewParticipant> => {
  try {
    const { data, error } = await supabase
      .from('interview_participants')
      .update({
        status,
        notes
      })
      .eq('id', participantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating participant status:', error);
    throw error;
  }
};

// Submit interview feedback
export const submitInterviewFeedback = async (
  interviewId: string,
  evaluatorId: string,
  feedback: {
    rating?: number;
    strengths?: string;
    weaknesses?: string;
    notes?: string;
    recommendation?: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
    is_visible_to_candidate?: boolean;
  }
): Promise<InterviewFeedback> => {
  try {
    const { data, error } = await supabase
      .from('interview_feedback')
      .insert({
        interview_id: interviewId,
        evaluator_id: evaluatorId,
        rating: feedback.rating,
        strengths: feedback.strengths,
        weaknesses: feedback.weaknesses,
        notes: feedback.notes,
        recommendation: feedback.recommendation,
        is_visible_to_candidate: feedback.is_visible_to_candidate || false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting interview feedback:', error);
    throw error;
  }
};

// Update interview feedback
export const updateInterviewFeedback = async (
  feedbackId: string,
  updates: Partial<InterviewFeedback>
): Promise<InterviewFeedback> => {
  try {
    // Remove fields that shouldn't be updated
    const { id, created_at, interview_id, evaluator_id, ...validUpdates } = updates as any;
    
    const { data, error } = await supabase
      .from('interview_feedback')
      .update(validUpdates)
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating interview feedback:', error);
    throw error;
  }
};

// Get upcoming interviews (for reminders)
export const getUpcomingInterviews = async (
  hoursAhead: number = 24
): Promise<InterviewWithDetails[]> => {
  try {
    const now = new Date();
    const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        application:applications!application_id(
          id,
          user_id,
          first_name,
          last_name,
          email,
          job:jobs(
            id,
            title,
            company:companies(
              id,
              name
            )
          )
        ),
        participants:interview_participants(
          id,
          user_id,
          role,
          status
        )
      `)
      .gte('scheduled_at', now.toISOString())
      .lt('scheduled_at', future.toISOString())
      .in('status', ['scheduled', 'confirmed'])
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching upcoming interviews:', error);
    throw error;
  }
};

// Send interview reminder
export const sendInterviewReminder = async (
  interviewId: string
): Promise<void> => {
  try {
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select(`
        *,
        application:applications!application_id(
          id,
          user_id,
          job:jobs(
            id,
            title,
            company:companies(
              id,
              name
            )
          )
        )
      `)
      .eq('id', interviewId)
      .single();

    if (interviewError) throw interviewError;

    // Create notification for candidate
    await createNotification(
      interview.application.user_id,
      'Interview Reminder',
      `Reminder: You have an interview for ${interview.application.job.title} at ${interview.application.job.company.name} scheduled for ${new Date(interview.scheduled_at).toLocaleString()}.`,
      'interview_reminder',
      `/dashboard/applications/${interview.application_id}`,
      {
        interview_id: interview.id,
        scheduled_at: interview.scheduled_at,
        duration_minutes: interview.duration_minutes,
        type: interview.type
      }
    );

    // Get all interviewers
    const { data: participants, error: participantsError } = await supabase
      .from('interview_participants')
      .select('user_id')
      .eq('interview_id', interviewId)
      .eq('role', 'interviewer');

    if (participantsError) throw participantsError;

    // Send notifications to all interviewers
    for (const participant of participants) {
      await createNotification(
        participant.user_id,
        'Interview Reminder',
        `Reminder: You have an interview scheduled for ${interview.application.job.title} at ${new Date(interview.scheduled_at).toLocaleString()}.`,
        'interview_reminder',
        `/employer-dashboard/interviews/${interview.id}`,
        {
          interview_id: interview.id,
          scheduled_at: interview.scheduled_at,
          duration_minutes: interview.duration_minutes,
          type: interview.type
        }
      );
    }
  } catch (error) {
    console.error('Error sending interview reminder:', error);
    throw error;
  }
};

// Get interview statistics for a job
export const getInterviewStatsByJob = async (
  jobId: string
): Promise<{
  total: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  upcoming: number;
  completed: number;
}> => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        id,
        status,
        type,
        scheduled_at,
        application:applications!application_id(
          job_id
        )
      `)
      .eq('application.job_id', jobId);

    if (error) throw error;

    const now = new Date();
    const stats = {
      total: data.length,
      by_status: {} as Record<string, number>,
      by_type: {} as Record<string, number>,
      upcoming: 0,
      completed: 0
    };

    // Calculate statistics
    data.forEach(interview => {
      // Count by status
      stats.by_status[interview.status] = (stats.by_status[interview.status] || 0) + 1;
      
      // Count by type
      stats.by_type[interview.type] = (stats.by_type[interview.type] || 0) + 1;
      
      // Count upcoming interviews
      const interviewDate = new Date(interview.scheduled_at);
      if (interviewDate > now && ['scheduled', 'confirmed'].includes(interview.status)) {
        stats.upcoming++;
      }
      
      // Count completed interviews
      if (interview.status === 'completed') {
        stats.completed++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching interview statistics:', error);
    throw error;
  }
};