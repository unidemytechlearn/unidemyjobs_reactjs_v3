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
  role: 'job_seeker' | 'employer' | 'admin';
  company_name?: string;
  company_position?: string;
  company_size?: string;
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
  is_read: boolean;
  action_url?: string;
  metadata?: any;
  created_at: string;
}

// Auth helper functions
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const signUp = async (email: string, password: string, userData: Partial<Profile>) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: userData.phone,
        location: userData.location,
        job_title: userData.job_title,
        experience_level: userData.experience_level,
        linkedin_url: userData.linkedin_url,
        portfolio_url: userData.portfolio_url,
        email_notifications: userData.email_notifications,
        role: userData.role || 'job_seeker',
        company_name: userData.company_name,
        company_position: userData.company_position,
        company_size: userData.company_size,
      }
    }
  });

  if (error) throw error;

  // Profile will be created automatically by the database trigger

  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) throw authError;
  
  // Log successful authentication but not the credentials
  console.log('User authenticated successfully:', authData.user?.id);
  
  return authData;
};

// Role-specific sign in functions
export const signInAsJobSeeker = async (email: string, password: string) => {
  try {
    // First authenticate the user
    const authData = await signIn(email, password);
    
    if (!authData.user) {
      throw new Error('Authentication failed');
    }
    
    // Then check if they have the correct role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle();
    
    if (profileError) {
      // If we can't fetch the profile, sign out and throw an error
      await supabase.auth.signOut();
      throw new Error('Failed to verify user role');
    }
    
    if (!profileData) {
      // If no profile exists, sign out and throw an error
      await supabase.auth.signOut();
      throw new Error('User profile not found. You may need to sign up first or contact support if you believe this is an error.');
    }
    
    if (profileData.role === 'employer') {
      // If they're an employer, sign out and throw an error
      await supabase.auth.signOut();
      throw new Error('This account is registered as an employer. Please use the employer login instead by clicking "For Employers" in the navigation.');
    }
    
    // Return the auth data if everything is fine
    return authData;
  } catch (error) {
    // Make sure user is signed out if there's any error
    await supabase.auth.signOut();
    throw error;
  }
};

export const signInAsEmployer = async (email: string, password: string) => {
  try {
    // First authenticate the user
    const authData = await signIn(email, password);
    
    if (!authData.user) {
      throw new Error('Authentication failed');
    }
    
    // Then check if they have the correct role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle();
    
    if (profileError) {
      // If we can't fetch the profile, sign out and throw an error
      await supabase.auth.signOut();
      throw new Error('Failed to verify user role');
    }
    
    if (!profileData) {
      // If no profile exists, sign out and throw an error
      await supabase.auth.signOut();
      throw new Error('User profile not found. You may need to sign up first or contact support if you believe this is an error.');
    }
    
    if (profileData.role !== 'employer') {
      // If they're not an employer, sign out and throw an error
      await supabase.auth.signOut();
      throw new Error('This account is registered as a job seeker. Please use the regular login instead by clicking "Sign In" in the navigation.');
    }
    
    // Return the auth data if everything is fine
    return authData;
  } catch (error) {
    // Make sure user is signed out if there's any error
    await supabase.auth.signOut();
    throw error;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

// Google Sign In
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    }
  });

  if (error) throw error;
  return data;
};

// Google Sign In for Job Seekers
export const signInWithGoogleAsJobSeeker = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}?role=job_seeker`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    }
  });

  if (error) throw error;
  return data;
};

// Google Sign In for Employers
export const signInWithGoogleAsEmployer = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}?role=employer`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    }
  });

  if (error) throw error;
  return data;
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
    .select()
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
  
  if (data) {
    // Log successful profile retrieval but not the sensitive data
    console.log('Profile retrieved successfully for user:', userId);
  } else {
    console.warn(`No profile found for user ${userId}`);
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
  // Use publicSupabase to ensure anonymous access works
  let query = publicSupabase
    .from('jobs')
    .select(`
      *,
      company:companies(*)
    `)
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
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
  
  return data || [];
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
  // Use publicSupabase to ensure anonymous access works
  let query = publicSupabase
    .from('companies')
    .select('*')
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
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
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
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
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
  const { data, error } = await supabase
    .from('saved_jobs')
    .select(`
      *,
      job:jobs(
        *,
        company:companies(*)
      )
    `)
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  if (error) throw error;
  return data || [];
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