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
  totalApplications: number;
  pendingApplications: number;
  interviewsScheduled: number;
  offersReceived: number;
}> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching application analytics:', error);
      return {
        totalApplications: 0,
        pendingApplications: 0,
        interviewsScheduled: 0,
        offersReceived: 0
      };
    }

    const analytics = {
      totalApplications: data.length,
      pendingApplications: data.filter(app => ['submitted', 'under_review'].includes(app.status)).length,
      interviewsScheduled: data.filter(app => ['interview_scheduled', 'interview_completed'].includes(app.status)).length,
      offersReceived: data.filter(app => app.status === 'offer_made').length
    };

    return analytics;
  } catch (error) {
    console.error('Error fetching application analytics:', error);
    return {
      totalApplications: 0,
      pendingApplications: 0,
      interviewsScheduled: 0,
      offersReceived: 0
    };
  }
}