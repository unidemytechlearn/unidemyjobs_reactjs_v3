import { supabase } from './supabase';

export interface ApplicationData {
  jobId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  expectedSalary?: string;
  currentSalary?: string;
  availabilityDate?: string;
  yearsExperience?: string;
  noticePeriod?: string;
  skills?: string[];
  referralSource?: string;
  isRemotePreferred?: boolean;
  willingToRelocate?: boolean;
  additionalInfo?: any;
  screeningAnswers?: any;
}

export interface ApplicationFile {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  attachmentType: 'resume' | 'cover_letter' | 'portfolio' | 'certificate' | 'other';
}

export async function submitApplication(applicationData: ApplicationData): Promise<{ success: boolean; error?: string; applicationId?: string }> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .insert({
        job_id: applicationData.jobId,
        user_id: applicationData.userId,
        first_name: applicationData.firstName,
        last_name: applicationData.lastName,
        email: applicationData.email,
        phone: applicationData.phone,
        cover_letter: applicationData.coverLetter,
        resume_url: applicationData.resumeUrl,
        portfolio_url: applicationData.portfolioUrl,
        linkedin_url: applicationData.linkedinUrl,
        github_url: applicationData.githubUrl,
        website_url: applicationData.websiteUrl,
        expected_salary: applicationData.expectedSalary,
        current_salary: applicationData.currentSalary,
        availability_date: applicationData.availabilityDate,
        years_experience: applicationData.yearsExperience,
        notice_period: applicationData.noticePeriod,
        skills: applicationData.skills,
        referral_source: applicationData.referralSource,
        is_remote_preferred: applicationData.isRemotePreferred,
        willing_to_relocate: applicationData.willingToRelocate,
        additional_info: applicationData.additionalInfo,
        screening_answers: applicationData.screeningAnswers,
        status: 'submitted'
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting application:', error);
      return { success: false, error: error.message };
    }

    return { success: true, applicationId: data.id };
  } catch (error) {
    console.error('Error submitting application:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function uploadApplicationFile(applicationId: string, file: ApplicationFile): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('application_attachments')
      .insert({
        application_id: applicationId,
        file_name: file.fileName,
        file_type: file.fileType,
        file_size: file.fileSize,
        file_url: file.fileUrl,
        attachment_type: file.attachmentType
      });

    if (error) {
      console.error('Error uploading application file:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error uploading application file:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function hasUserAppliedToJob(userId: string, jobId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking application status:', error);
      return false;
    }

    return !!data;
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
        jobs (
          id,
          title,
          company_id,
          location,
          job_type,
          companies (
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

    return data || [];
  } catch (error) {
    console.error('Error fetching user applications:', error);
    return [];
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