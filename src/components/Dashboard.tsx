import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { 
  User, 
  Briefcase, 
  Heart, 
  Bell, 
  Settings, 
  FileText, 
  Calendar,
  TrendingUp,
  MapPin,
  Clock,
  DollarSign,
  Building,
  Star,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company_id: string;
  location: string;
  job_type: string;
  experience_level: string;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  is_remote: boolean;
  description: string;
  requirements: string[];
  benefits: string[];
  skills_required: string[];
  is_featured: boolean;
  view_count: number;
  application_count: number;
  created_at: string;
  companies?: {
    name: string;
    logo_url: string;
    industry: string;
  };
}

interface Application {
  id: string;
  job_id: string;
  status: string;
  applied_at: string;
  jobs: Job;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string;
  location: string;
  bio: string;
  experience_level: string;
  availability: string;
  profile_views: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [loadingSavedJobs, setLoadingSavedJobs] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchApplications();
      fetchSavedJobs();
      fetchJobs();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            *,
            companies (
              name,
              logo_url,
              industry
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingApplications(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('job_id')
        .eq('user_id', user?.id);

      if (error) throw error;
      setSavedJobs(data?.map(item => item.job_id) || []);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    } finally {
      setLoadingSavedJobs(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            name,
            logo_url,
            industry
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'interview_scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'interview_completed':
        return 'bg-indigo-100 text-indigo-800';
      case 'offer_made':
        return 'bg-green-100 text-green-800';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Send className="h-4 w-4" />;
      case 'under_review':
        return <Eye className="h-4 w-4" />;
      case 'interview_scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'interview_completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'offer_made':
        return <Star className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'withdrawn':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const JobCard: React.FC<{ job: Job; showFullDetails?: boolean }> = ({ job, showFullDetails = false }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {job.companies?.logo_url ? (
            <img 
              src={job.companies.logo_url} 
              alt={job.companies.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{job.title}</h3>
            <p className="text-gray-600">{job.companies?.name}</p>
          </div>
        </div>
        {job.is_featured && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <MapPin className="h-3 w-3 mr-1" />
          {job.location}
        </span>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Briefcase className="h-3 w-3 mr-1" />
          {job.job_type}
        </span>
        {job.experience_level && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <TrendingUp className="h-3 w-3 mr-1" />
            {job.experience_level}
          </span>
        )}
        {job.is_remote && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Remote
          </span>
        )}
      </div>

      {job.salary_min && job.salary_max && (
        <div className="flex items-center text-gray-600 mb-3">
          <DollarSign className="h-4 w-4 mr-1" />
          <span className="text-sm">
            {job.salary_currency} {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}
          </span>
        </div>
      )}

      {showFullDetails && (
        <div className="mb-4">
          <p className="text-gray-600 text-sm line-clamp-3">{job.description}</p>
          {job.skills_required && job.skills_required.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {job.skills_required.slice(0, 3).map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {skill}
                  </span>
                ))}
                {job.skills_required.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    +{job.skills_required.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            {job.view_count} views
          </span>
          <span className="flex items-center">
            <Send className="h-4 w-4 mr-1" />
            {job.application_count} applications
          </span>
        </div>
        <span className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          {new Date(job.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.first_name || 'User'}!
          </h1>
          <p className="text-gray-600">
            Manage your job applications and track your career progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saved Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{savedJobs.length}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profile Views</p>
                <p className="text-2xl font-bold text-gray-900">{profile?.profile_views || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Interviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications.filter(app => app.status === 'interview_scheduled').length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'applications', label: 'My Applications', icon: FileText },
                { id: 'saved-jobs', label: 'Saved Jobs', icon: Heart },
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h3>
                  {loadingApplications ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading applications...</p>
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h4>
                      <p className="text-gray-600 mb-6">Start applying to jobs to see them here</p>
                      <button
                        onClick={() => setActiveTab('browse-jobs')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                      >
                        Browse Jobs
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.slice(0, 5).map((application) => (
                        <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {application.jobs.companies?.logo_url ? (
                                <img 
                                  src={application.jobs.companies.logo_url} 
                                  alt={application.jobs.companies.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Building className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium text-gray-900">{application.jobs.title}</h4>
                                <p className="text-sm text-gray-600">{application.jobs.companies?.name}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                {getStatusIcon(application.status)}
                                <span className="ml-1">{formatStatus(application.status)}</span>
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(application.applied_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'applications' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">All Applications</h3>
                {loadingApplications ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading applications...</p>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h4>
                    <p className="text-gray-600 mb-6">Start applying to jobs to see them here</p>
                    <button
                      onClick={() => setActiveTab('browse-jobs')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      Browse Jobs
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div key={application.id} className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            {application.jobs.companies?.logo_url ? (
                              <img 
                                src={application.jobs.companies.logo_url} 
                                alt={application.jobs.companies.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Building className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">{application.jobs.title}</h4>
                              <p className="text-gray-600">{application.jobs.companies?.name}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="flex items-center text-sm text-gray-500">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {application.jobs.location}
                                </span>
                                <span className="flex items-center text-sm text-gray-500">
                                  <Briefcase className="h-4 w-4 mr-1" />
                                  {application.jobs.job_type}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                              {getStatusIcon(application.status)}
                              <span className="ml-2">{formatStatus(application.status)}</span>
                            </span>
                            <p className="text-sm text-gray-500 mt-2">
                              Applied {new Date(application.applied_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {application.jobs.salary_min && application.jobs.salary_max && (
                          <div className="flex items-center text-gray-600 mb-3">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              {application.jobs.salary_currency} {application.jobs.salary_min.toLocaleString()} - {application.jobs.salary_max.toLocaleString()}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {application.jobs.skills_required?.slice(0, 5).map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-white text-gray-700 text-xs rounded border">
                              {skill}
                            </span>
                          ))}
                          {application.jobs.skills_required && application.jobs.skills_required.length > 5 && (
                            <span className="px-2 py-1 bg-white text-gray-700 text-xs rounded border">
                              +{application.jobs.skills_required.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'saved-jobs' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Saved Jobs</h3>
                {loadingSavedJobs ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading saved jobs...</p>
                  </div>
                ) : savedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No saved jobs yet</h4>
                    <p className="text-gray-600 mb-6">Start browsing and save jobs you're interested in</p>
                    <button
                      onClick={() => setActiveTab('browse-jobs')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      Browse Jobs
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {allJobs
                      .filter(job => savedJobs.includes(job.id))
                      .map((job) => (
                        <JobCard key={job.id} job={job} showFullDetails />
                      ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
                {profile ? (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <p className="text-gray-900">{profile.first_name} {profile.last_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                        <p className="text-gray-900">{profile.job_title || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <p className="text-gray-900">{profile.location || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                        <p className="text-gray-900">{profile.experience_level || 'Not specified'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                        <p className="text-gray-900">{profile.bio || 'No bio provided'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Complete your profile</h4>
                    <p className="text-gray-600">Add your information to get better job recommendations</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h3>
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Notification Preferences</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700">Email notifications for new job matches</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700">Application status updates</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Weekly job digest</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Privacy Settings</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700">Make profile visible to recruiters</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700">Show salary expectations</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;