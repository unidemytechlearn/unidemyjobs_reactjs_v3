import { supabase } from './supabase';

export interface ApplicationData {
  job_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  cover_letter?: string;
  resume_url?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  website_url?: string;
  expected_salary?: string;
  current_salary?: string;
  availability_date?: string;
  years_experience?: string;
  notice_period?: string;
  skills?: string[];
  referral_source?: string;
  is_remote_preferred?: boolean;
  willing_to_relocate?: boolean;
  additional_info?: any;
  screening_answers?: any;
  application_source?: string;
}

export interface ApplicationFile {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  attachmentType: 'resume' | 'cover_letter' | 'portfolio' | 'certificate' | 'other';
}

export async function submitApplication(applicationData: ApplicationData) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .insert({
        job_id: applicationData.job_id,
        user_id: applicationData.user_id,
        first_name: applicationData.first_name,
        last_name: applicationData.last_name,
        email: applicationData.email,
        phone: applicationData.phone,
        cover_letter: applicationData.cover_letter,
        resume_url: applicationData.resume_url,
        portfolio_url: applicationData.portfolio_url,
        linkedin_url: applicationData.linkedin_url,
        github_url: applicationData.github_url,
        website_url: applicationData.website_url,
        expected_salary: applicationData.expected_salary,
        current_salary: applicationData.current_salary,
        availability_date: applicationData.availability_date,
        years_experience: applicationData.years_experience,
        notice_period: applicationData.notice_period,
        skills: applicationData.skills,
        referral_source: applicationData.referral_source,
        is_remote_preferred: applicationData.is_remote_preferred,
        willing_to_relocate: applicationData.willing_to_relocate,
        additional_info: applicationData.additional_info,
        screening_answers: applicationData.screening_answers,
        application_source: applicationData.application_source || 'website',
        status: 'submitted'
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting application:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error submitting application:', error);
    throw error;
  }
}

export async function uploadApplicationFile(
  file: File,
  userId: string,
  applicationId: string,
  attachmentType: 'resume' | 'cover_letter' | 'portfolio' | 'certificate' | 'other'
) {
  try {
    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${applicationId}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('application-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('application-attachments')
      .getPublicUrl(uploadData.path);

    // Save file record to database
    const { error: dbError } = await supabase
      .from('application_attachments')
      .insert({
        application_id: applicationId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: publicUrl,
        attachment_type: attachmentType
      });

    if (dbError) {
      throw dbError;
    }

    return publicUrl;
  } catch (error) {
    console.error('Error uploading application file:', error);
    throw error;
  }
}

export async function hasUserAppliedToJob(userId: string, jobId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .limit(1);

    if (error) {
      console.error('Error checking application status:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking application status:', error);
    return false;
  }
}

export async function getUserApplications(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs (
          id,
          title,
          company_id,
          location,
          job_type,
          company:companies (
            name,
            logo_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('Error fetching user applications:', error);
      return [];
    }

    // For each application, fetch its status history
    const applicationsWithHistory = await Promise.all(
      (data || []).map(async (application) => {
        try {
          const { data: historyData, error: historyError } = await supabase
            .from('application_status_history')
            .select('*')
            .eq('application_id', application.id)
            .order('created_at', { ascending: false });

          if (historyError) throw historyError;

          // Also fetch from the new timeline table if it exists
          let timelineData = [];
          try {
            const { data: timeline, error: timelineError } = await supabase
              .from('application_status_timeline')
              .select('*')
              .eq('application_id', application.id)
              .order('created_at', { ascending: false });

            if (!timelineError && timeline) {
              timelineData = timeline;
            }
          } catch (e) {
            // Timeline table might not exist yet, ignore error
          }

          return {
            ...application,
            status_history: historyData || [],
            status_timeline: timelineData || []
          };
        } catch (err) {
          console.error(`Error fetching history for application ${application.id}:`, err);
          return {
            ...application,
            status_history: [],
            status_timeline: []
          };
        }
      })
    );

    return applicationsWithHistory;
  } catch (error) {
    console.error('Error fetching user applications:', error);
    return [];
  }
}

export async function getApplicationStatusTimeline(applicationId: string): Promise<any[]> {
  try {
    // Try the new timeline table first
    const { data: timelineData, error: timelineError } = await supabase
      .from('application_status_timeline')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    if (!timelineError && timelineData && timelineData.length > 0) {
      return timelineData;
    }

    // Fall back to the status history table
    const { data: historyData, error: historyError } = await supabase
      .from('application_status_history')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching application status timeline:', historyError);
      return [];
    }

    return historyData || [];
  } catch (error) {
    console.error('Error fetching application status timeline:', error);
    return [];
  }
}

export async function updateApplicationStatus(
  applicationId: string, 
  newStatus: string, 
  notes?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating application status:', error);
    return false;
  }
}

export async function withdrawApplication(applicationId: string, userId: string): Promise<boolean> {
  try {
    // First verify the application belongs to the user
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('id, user_id, status')
      .eq('id', applicationId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new Error('Application not found or access denied');
    }

    // Check if application can be withdrawn
    const withdrawableStatuses = ['submitted', 'under_review', 'interview_scheduled'];
    if (!withdrawableStatuses.includes(application.status)) {
      throw new Error('This application cannot be withdrawn at its current stage');
    }

    // Update application status to withdrawn
    const { error: updateError } = await supabase
      .from('applications')
      .update({ 
        status: 'withdrawn',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }

    return true;
  } catch (error) {
    console.error('Error withdrawing application:', error);
    throw error;
  }
}

export async function getApplicationAnalytics(userId: string): Promise<{
  total_applications: number;
  pending_applications: number;
  interviews_scheduled: number;
  offers_received: number;
  applications_this_month: number;
  response_rate: number;
  interview_rate: number;
}> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('status, applied_at')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching application analytics:', error);
      return {
        total_applications: 0,
        pending_applications: 0,
        interviews_scheduled: 0,
        offers_received: 0,
        applications_this_month: 0,
        response_rate: 0,
        interview_rate: 0
      };
    }

    const totalApplications = data.length;
    const pendingApplications = data.filter(app => ['submitted', 'under_review'].includes(app.status)).length;
    const interviewsScheduled = data.filter(app => ['interview_scheduled', 'interview_completed'].includes(app.status)).length;
    const offersReceived = data.filter(app => app.status === 'offer_made').length;
    
    // Calculate applications this month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const applicationsThisMonth = data.filter(app => {
      const appliedDate = new Date(app.applied_at);
      return appliedDate.getMonth() === currentMonth && appliedDate.getFullYear() === currentYear;
    }).length;
    
    // Calculate response rate (interviews + offers / total applications)
    const responseRate = totalApplications > 0 ? ((interviewsScheduled + offersReceived) / totalApplications) * 100 : 0;
    
    // Calculate interview rate (interviews / total applications)
    const interviewRate = totalApplications > 0 ? (interviewsScheduled / totalApplications) * 100 : 0;

    const analytics = {
      total_applications: totalApplications,
      pending_applications: pendingApplications,
      interviews_scheduled: interviewsScheduled,
      offers_received: offersReceived,
      applications_this_month: applicationsThisMonth,
      response_rate: Math.round(responseRate * 100) / 100, // Round to 2 decimal places
      interview_rate: Math.round(interviewRate * 100) / 100 // Round to 2 decimal places
    };

    return analytics;
  } catch (error) {
    console.error('Error fetching application analytics:', error);
    return {
      total_applications: 0,
      pending_applications: 0,
      interviews_scheduled: 0,
      offers_received: 0,
      applications_this_month: 0,
      response_rate: 0,
      interview_rate: 0
    };
  }
}

export async function getApplicationById(applicationId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs (
          id,
          title,
          description,
          company_id,
          location,
          job_type,
          experience_level,
          salary_min,
          salary_max,
          salary_currency,
          is_remote,
          requirements,
          benefits,
          skills_required,
          application_deadline,
          is_featured,
          is_active,
          view_count,
          application_count,
          created_by,
          created_at,
          updated_at,
          company:companies (
            id,
            name,
            description,
            industry,
            size_range,
            location,
            website_url,
            logo_url,
            rating,
            review_count,
            founded_year,
            specialties,
            benefits,
            culture_description,
            is_featured,
            created_by,
            created_at,
            updated_at
          )
        )
      `)
      .eq('id', applicationId)
      .single();

    if (error) {
      console.error('Error fetching application by ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching application by ID:', error);
    return null;
  }
}

    const analytics = {
      total_applications: totalApplications,
      pending_applications: pendingApplications,
      interviews_scheduled: interviewsScheduled,
      offers_received: offersReceived,
      applications_this_month: applicationsThisMonth,
      response_rate: Math.round(responseRate * 100) / 100, // Round to 2 decimal places
      interview_rate: Math.round(interviewRate * 100) / 100 // Round to 2 decimal places
    };

    return analytics;
  } catch (error) {
    console.error('Error fetching application analytics:', error);
    return {
      total_applications: 0,
      pending_applications: 0,
      interviews_scheduled: 0,
      offers_received: 0,
      applications_this_month: 0,
      response_rate: 0,
      interview_rate: 0
    };
  }
}