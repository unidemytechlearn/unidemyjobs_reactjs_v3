import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Create a separate client for anonymous access to public data
export const publicSupabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

// Database types
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  location?: string;
  bio?: string;
  job_title?: string;
  company?: string;
  experience_level?: string;
  salary_range?: string;
  availability?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  resume_url?: string;
  resume_file_name?: string;
  resume_uploaded_at?: string;
  resume_file_size?: number;
  profile_visibility: string;
  show_salary: boolean;
  show_contact: boolean;
  email_notifications: boolean;
  job_alerts: boolean;
  application_updates: boolean;
  marketing_emails: boolean;
  two_factor_enabled: boolean;
  profile_views: number;
  created_at: string;
  updated_at: string;
  profile_picture_url?: string;
  profile_picture_uploaded_at?: string;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  size_range?: string;
  location?: string;
  website_url?: string;
  logo_url?: string;
  rating: number;
  review_count: number;
  founded_year?: number;
  specialties?: string[];
  benefits?: string[];
  culture_description?: string;
  is_featured: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  company_id: string;
  location: string;
  job_type: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  is_remote: boolean;
  requirements?: string[];
  benefits?: string[];
  skills_required?: string[];
  application_deadline?: string;
  is_featured: boolean;
  is_active: boolean;
  view_count: number;
  application_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface Application {
  id: string;
  job_id: string;
  user_id: string;
  status: string;
  cover_letter?: string;
  resume_url?: string;
  expected_salary?: string;
  availability_date?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  additional_info?: any;
  applied_at: string;
  updated_at: string;
  job?: Job;
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  saved_at: string;
  job?: Job;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
  created_at: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency_level?: string;
  years_experience?: number;
  created_at: string;
  skill?: Skill;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
      `, { count: 'exact' })
  action_url?: string;
  metadata?: any;
  created_at: string;
    if (limit) {
      if (offset) {
        query = query.range(offset, offset + limit - 1);
      } else {
        query = query.limit(limit);
      }
    } else if (offset) {
      query = query.range(offset, offset + 9); // Default limit of 10
    }

    const { data, error, count } = await query;
}

      return { data: [], count: 0 };
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
      (data || []).map(async (application) => {
export const signUp = async (email: string, password: string, userData: Partial<Profile>) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: userData.phone,
        location: userData.location,
        job_title: userData.job_title,
        experience_level: userData.experience_level,
        linkedin_url: userData.linkedin_url,
        portfolio_url: userData.portfolio_url,
        email_notifications: userData.email_notifications,
      });

    if (profileError) throw profileError;
  }

  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

    return { data: applicationsWithHistory, count: count || 0 };
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { data: [], count: 0 };
  }
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
};

// Profile functions
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found, return null
      return null;
    }
    throw error;
  }
  return data;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Jobs functions
export const getJobs = async (filters?: {
  search?: string;
  job_type?: string;
  location?: string;
  experience_level?: string;
  is_remote?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Job[]> => {
}): Promise<{ data: Job[]; count: number }> => {
  // Use publicSupabase to ensure anonymous access works
  let query = publicSupabase
    .from('jobs')
    .select(`
      *,
      company:companies(*)
    `, { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.job_type) {
    query = query.eq('job_type', filters.job_type);
  }

  if (filters?.location) {
    query = query.eq('location', filters.location);
  }

  if (filters?.experience_level) {
    query = query.eq('experience_level', filters.experience_level);
  }

  if (filters?.is_remote !== undefined) {
    query = query.eq('is_remote', filters.is_remote);
  }

  if (filters?.limit) {
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + filters.limit - 1);
    } else {
      query = query.limit(filters.limit);
    }
  } else if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + 9); // Default limit of 10
  }


  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
  
  return { data: data || [], count: count || 0 };
};

export const isJobSaved = async (userId: string, jobId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('id')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
};

// Companies functions
export const getCompanies = async (filters?: {
  search?: string;
  industry?: string;
  size_range?: string;
  location?: string;
  limit?: number;
  offset?: number;
}): Promise<Company[]> => {
}): Promise<{ data: Company[]; count: number }> => {
  // Use publicSupabase to ensure anonymous access works
  let query = publicSupabase
    .from('companies')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true });

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.industry) {
    query = query.eq('industry', filters.industry);
  }

  if (filters?.size_range) {
    query = query.eq('size_range', filters.size_range);
  }

  if (filters?.location) {
    query = query.eq('location', filters.location);
  }

  if (filters?.limit) {
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + filters.limit - 1);
    } else {
      query = query.limit(filters.limit);
    }
  } else if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + 9); // Default limit of 10
  }


  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
};

// Skills functions
export const getSkills = async (): Promise<Skill[]> => {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getUserSkills = async (userId: string): Promise<UserSkill[]> => {
  const { data, error } = await supabase
    .from('user_skills')
    .select(`
      *,
      skill:skills(*)
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
};

// Notifications functions
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
export const getUserNotifications = async (userId: string, limit?: number, offset?: number): Promise<{ data: Notification[]; count: number }> => {
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (limit) {
    if (offset) {
      query = query.range(offset, offset + limit - 1);
    } else {
      query = query.limit(limit);
    }
  } else if (offset) {
    query = query.range(offset, offset + 9); // Default limit of 10
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
};

// Saved Jobs functions
export const getUserSavedJobs = async (userId: string): Promise<SavedJob[]> => {
export const getUserSavedJobs = async (userId: string, limit?: number, offset?: number): Promise<{ data: SavedJob[]; count: number }> => {
  let query = supabase
export const getUserApplications = async (userId: string, limit?: number, offset?: number): Promise<{ data: any[]; count: number }> => {
    .from('saved_jobs')
    let query = supabase
      *,
      job:jobs(
        *,
        company:companies(*)
      )
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  if (limit) {
    if (offset) {
      query = query.range(offset, offset + limit - 1);
    } else {
      query = query.limit(limit);
    }
  } else if (offset) {
    query = query.range(offset, offset + 9); // Default limit of 10
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
};

export const saveJob = async (userId: string, jobId: string) => {
  const { data, error } = await supabase
    .from('saved_jobs')
    .insert({
      user_id: userId,
      job_id: jobId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const unsaveJob = async (userId: string, jobId: string) => {
  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('user_id', userId)
    .eq('job_id', jobId);

  if (error) throw error;
};

// File upload functions
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;
  return data;
};

export const getFileUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
};