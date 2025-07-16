import { supabase } from './supabase';

export interface EmployerStats {
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  pending_applications: number;
  company_id: string;
}

export interface JobWithApplications {
  id: string;
  title: string;
  description: string;
  location: string;
  job_type: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  is_active: boolean;
  is_featured: boolean;
  view_count: number;
  application_count: number;
  created_at: string;
  updated_at: string;
  applications?: any[];
}

// Get employer statistics
export const getEmployerStats = async (employerId: string): Promise<EmployerStats | null> => {
  try {
    // Instead of using RPC, let's manually calculate the stats to avoid SQL ambiguity
    const [jobsResult, applicationsResult] = await Promise.all([
      supabase
        .from('jobs')
        .select('id, is_active, application_count')
        .eq('created_by', employerId),
      supabase
        .from('applications')
        .select('id, status, job:jobs!inner(created_by)')
        .eq('job.created_by', employerId)
    ]);

    if (jobsResult.error) throw jobsResult.error;
    if (applicationsResult.error) throw applicationsResult.error;

    const jobs = jobsResult.data || [];
    const applications = applicationsResult.data || [];

    const stats: EmployerStats = {
      total_jobs: jobs.length,
      active_jobs: jobs.filter(job => job.is_active).length,
      total_applications: applications.length,
      pending_applications: applications.filter(app => 
        app.status === 'submitted' || app.status === 'under_review'
      ).length,
      company_id: '' // This will be set by the company query if needed
    };

    return stats;
  } catch (error) {
    console.error('Error fetching employer stats:', error);
    throw error;
  }
};

// Get employer's company
export const getEmployerCompany = async (employerId: string) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('created_by', employerId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching employer company:', error);
    throw error;
  }
};

// Create or update company
export const upsertCompany = async (companyData: any, employerId: string) => {
  try {
    // Check if company already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('created_by', employerId)
      .maybeSingle();
    
    let payload = {
      ...companyData,
      created_by: employerId,
      updated_at: new Date().toISOString()
    };
    
    // If company exists, include its ID
    if (existingCompany) {
      payload.id = existingCompany.id;
    }
    
    const { data, error } = await supabase
      .from('companies')
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting company:', error);
    throw error;
  }
};

// Get employer's jobs
export const getEmployerJobs = async (employerId: string, filters?: {
  status?: 'active' | 'inactive' | 'all';
  limit?: number;
  offset?: number;
}): Promise<JobWithApplications[]> => {
  try {
    let query = supabase
      .from('jobs')
      .select(`
        *,
        company:companies(name, logo_url),
        applications(
          id,
          status,
          first_name,
          last_name,
          email,
          applied_at
        )
      `)
      .eq('created_by', employerId)
      .order('created_at', { ascending: false });

    if (filters?.status === 'active') {
      query = query.eq('is_active', true);
    } else if (filters?.status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching employer jobs:', error);
    throw error;
  }
};

// Create new job
export const createJob = async (jobData: any, employerId: string) => {
  try {
    // Get employer's company first - this is a critical check
    const company = await getEmployerCompany(employerId);
    if (!company) {
      throw new Error('Please create a company profile first');
    }

    // Format the job data
    const formattedJobData = {
      ...jobData,
      company_id: company.id,
      created_by: employerId,
      is_active: true,
      view_count: 0,
      application_count: 0,
      salary_currency: 'USD', // Default currency
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('jobs')
      .insert(formattedJobData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

// Update job
export const updateJob = async (jobId: string, updates: any, employerId: string) => {
  try {
    // Format the updates
    const formattedUpdates = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    // Remove any properties that shouldn't be updated
    delete formattedUpdates.id;
    delete formattedUpdates.created_by;
    delete formattedUpdates.created_at;
    delete formattedUpdates.company;
    delete formattedUpdates.applications;

    const { data, error } = await supabase
      .from('jobs')
      .update(formattedUpdates)
      .eq('id', jobId)
      .eq('created_by', employerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating job:', error);
    throw error;
  }
};

// Delete job
export const deleteJob = async (jobId: string, employerId: string) => {
  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('created_by', employerId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
};

// Get applications for employer's jobs
export const getEmployerApplications = async (employerId: string, filters?: {
  status?: string;
  jobId?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    let query = supabase
      .from('applications')
      .select(`
        *,
        job:jobs!inner(
          id,
          title,
          company_id,
          created_by,
          company:companies(name, logo_url)
        )
      `)
      .eq('job.created_by', employerId)
      .order('applied_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.jobId) {
      query = query.eq('job_id', filters.jobId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching employer applications:', error);
    throw error;
  }
};

// Update application status
export const updateApplicationStatus = async (
  applicationId: string, 
  newStatus: string, 
  employerId: string,
  notes?: string
) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select(`
        *,
        job:jobs!inner(created_by)
      `)
      .single();

    if (error) throw error;

    // Verify the employer owns this job
    if (data.job.created_by !== employerId) {
      throw new Error('Unauthorized to update this application');
    }

    return data;
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

// Get application analytics
export const getApplicationAnalytics = async (employerId: string) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        status,
        applied_at,
        job:jobs!inner(created_by)
      `)
      .eq('job.created_by', employerId);

    if (error) throw error;

    const analytics = {
      total: data.length,
      by_status: {} as Record<string, number>,
      recent: data.filter(app => {
        const appliedDate = new Date(app.applied_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return appliedDate >= weekAgo;
      }).length
    };

    // Count by status
    data.forEach(app => {
      analytics.by_status[app.status] = (analytics.by_status[app.status] || 0) + 1;
    });

    return analytics;
  } catch (error) {
    console.error('Error fetching application analytics:', error);
    throw error;
  }
};

// Toggle job active status
export const toggleJobStatus = async (jobId: string, employerId: string) => {
  try {
    // First get current status
    const { data: currentJob, error: fetchError } = await supabase
      .from('jobs')
      .select('is_active')
      .eq('id', jobId)
      .eq('created_by', employerId)
      .single();

    if (fetchError) throw fetchError;

    // Toggle the status
    const { data, error } = await supabase
      .from('jobs')
      .update({
        is_active: !currentJob.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .eq('created_by', employerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error toggling job status:', error);
    throw error;
  }
};