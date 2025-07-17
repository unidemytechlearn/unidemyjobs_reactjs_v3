import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Briefcase, 
  Users, 
  TrendingUp, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Download,
  ExternalLink,
  X,
  Linkedin,
  Github,
  Globe,
  AlertTriangle,
  Phone,
  Mail,
  Award
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { 
  getEmployerStats, 
  getEmployerCompany, 
  getEmployerJobs, 
  getEmployerApplications,
  updateApplicationStatus,
  toggleJobStatus,
  deleteJob,
  createJob,
  updateJob,
  upsertCompany
} from '../lib/employer';
import { getApplicationStatusTimeline } from '../lib/applications';
import InterviewsTab from './InterviewsTab';
import InterviewScheduleModal from './InterviewScheduleModal';

interface EmployerDashboardProps {
  onNavigate?: (page: string, jobId?: string) => void;
}

const EmployerDashboard = ({ onNavigate }: EmployerDashboardProps) => {
  const { user, profile, isAuthenticated } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'applications' | 'interviews' | 'company' | 'analytics'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false);
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);
  const [isViewApplicationModalOpen, setIsViewApplicationModalOpen] = useState(false);
  const [showCompanyRequiredAlert, setShowCompanyRequiredAlert] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [selectedJobForEdit, setSelectedJobForEdit] = useState<any>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newJobData, setNewJobData] = useState({
    title: '',
    description: '',
    location: '',
    job_type: 'Full Time',
    experience_level: 'Mid-level',
    salary_min: '',
    salary_max: '',
    is_remote: false,
    application_deadline: '',
    requirements: [''],
    benefits: [''],
    skills_required: ['']
  });
  const [companyData, setCompanyData] = useState({
    name: '',
    description: '',
    industry: 'Technology',
    size_range: '1-50',
    location: '',
    website_url: '',
    founded_year: new Date().getFullYear(),
    specialties: [] as string[],
    benefits: [] as string[],
    culture_description: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load employer data
  useEffect(() => {
    const loadEmployerData = async () => {
      if (!user || !isAuthenticated) return;
      
      setLoading(true);
      try {
        // Load data sequentially to handle potential errors better
        let statsData = null;
        let companyData = null;
        let jobsData = [];

        try {
          companyData = await getEmployerCompany(user.id);
        } catch (error) {
          console.error('Error loading company data:', error);
        }

        // If company data exists, update the form state
        if (companyData) {
          setCompanyData({
            name: companyData.name || '',
            description: companyData.description || '',
            industry: companyData.industry || 'Technology',
            size_range: companyData.size_range || '1-50',
            location: companyData.location || '',
            website_url: companyData.website_url || '',
            founded_year: companyData.founded_year || new Date().getFullYear(),
            specialties: companyData.specialties || [],
            benefits: companyData.benefits || [],
            culture_description: companyData.culture_description || ''
          });
        }

        try {
          jobsData = await getEmployerJobs(user.id, { limit: 10 });
        } catch (error) {
          console.error('Error loading jobs data:', error);
        }

        try {
          statsData = await getEmployerStats(user.id);
        } catch (error) {
          console.error('Error loading stats data:', error);
          // Provide fallback stats if the main query fails
          statsData = {
            total_jobs: jobsData.length,
            active_jobs: jobsData.filter(job => job.is_active).length,
            total_applications: 0,
            pending_applications: 0,
            company_id: companyData?.id || ''
          };
        }
        
        setStats(statsData);
        setCompany(companyData);
        setJobs(jobsData);
      } catch (error) {
        console.error('Error in loadEmployerData:', error);
        // Set fallback data to prevent complete failure
        setStats({
          total_jobs: 0,
          active_jobs: 0,
          total_applications: 0,
          pending_applications: 0,
          company_id: ''
        });
        setCompany(null);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    loadEmployerData();
  }, [user, isAuthenticated]);

  // Load applications when applications tab is active
  useEffect(() => {
    const loadApplications = async () => {
      if (!user || activeTab !== 'applications') return;
      
      setApplicationsLoading(true);
      try {
        const applicationsData = await getEmployerApplications(user.id, {
          status: statusFilter === 'all' ? undefined : statusFilter,
          jobId: selectedJob === 'all' ? undefined : selectedJob,
          limit: 50
        });
        setApplications(applicationsData);
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setApplicationsLoading(false);
      }
    };

    loadApplications();
  }, [user, activeTab, statusFilter, selectedJob]);

  // Clear error and success messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    if (!user) return;
    
    try {
      await updateApplicationStatus(applicationId, newStatus, user.id);
      // Refresh applications
      const applicationsData = await getEmployerApplications(user.id, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        jobId: selectedJob === 'all' ? undefined : selectedJob,
        limit: 50
      });
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status');
    }
  };

  const handleToggleJobStatus = async (jobId: string) => {
    if (!user) return;
    
    try {
      await toggleJobStatus(jobId, user.id);
      // Refresh jobs
      const jobsData = await getEmployerJobs(user.id, { limit: 10 });
      setJobs(jobsData);
    } catch (error) {
      console.error('Error toggling job status:', error);
      alert('Failed to update job status');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!user) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this job? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      await deleteJob(jobId, user.id);
      // Refresh jobs
      const jobsData = await getEmployerJobs(user.id, { limit: 10 });
      setJobs(jobsData);
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job');
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!company) {
      setShowCompanyRequiredAlert(true);
      setIsNewJobModalOpen(false);
      setActiveTab('company');
      return;
    }
    
    try {
      // Format the data
      const jobData = {
        ...newJobData,
        salary_min: newJobData.salary_min ? parseInt(newJobData.salary_min as string) : null,
        salary_max: newJobData.salary_max ? parseInt(newJobData.salary_max as string) : null,
        requirements: newJobData.requirements.filter(req => req.trim() !== ''),
        benefits: newJobData.benefits.filter(benefit => benefit.trim() !== ''),
        skills_required: newJobData.skills_required.filter(skill => skill.trim() !== '')
      };
      
      await createJob(jobData, user.id);
      
      // Refresh jobs
      const jobsData = await getEmployerJobs(user.id, { limit: 10 });
      setJobs(jobsData);
      
      // Reset form and close modal
      setNewJobData({
        title: '',
        description: '',
        location: '',
        job_type: 'Full Time',
        experience_level: 'Mid-level',
        salary_min: '',
        salary_max: '',
        is_remote: false,
        application_deadline: '',
        requirements: [''],
        benefits: [''],
        skills_required: ['']
      });
      setIsNewJobModalOpen(false);
      setSuccess('Job created successfully!');
    } catch (error) {
      console.error('Error creating job:', error);
      setError('Failed to create job. Please make sure you have a company profile set up.');
    }
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedJobForEdit) return;
    
    try {
      // Format the data
      const jobData = {
        ...selectedJobForEdit,
        salary_min: selectedJobForEdit.salary_min ? parseInt(selectedJobForEdit.salary_min as string) : null,
        salary_max: selectedJobForEdit.salary_max ? parseInt(selectedJobForEdit.salary_max as string) : null,
        requirements: selectedJobForEdit.requirements.filter((req: string) => req.trim() !== ''),
        benefits: selectedJobForEdit.benefits.filter((benefit: string) => benefit.trim() !== ''),
        skills_required: selectedJobForEdit.skills_required.filter((skill: string) => skill.trim() !== '')
      };
      
      await updateJob(selectedJobForEdit.id, jobData, user.id);
      
      // Refresh jobs
      const jobsData = await getEmployerJobs(user.id, { limit: 10 });
      setJobs(jobsData);
      
      // Close modal
      setIsEditJobModalOpen(false);
      setSelectedJobForEdit(null);
      setSuccess('Job updated successfully!');
    } catch (error) {
      console.error('Error updating job:', error);
      setError('Failed to update job.');
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      // Format the data
      const formattedData = {
        ...companyData,
        founded_year: companyData.founded_year ? parseInt(companyData.founded_year.toString()) : null,
        specialties: companyData.specialties.filter(spec => spec.trim() !== ''),
        benefits: companyData.benefits.filter(benefit => benefit.trim() !== '')
      };
      
      await upsertCompany(formattedData, user.id);
      
      // Refresh company data
      const updatedCompany = await getEmployerCompany(user.id);
      setCompany(updatedCompany);
      
      // Close modal
      setIsEditCompanyModalOpen(false);
      setSuccess('Company profile updated successfully!');
    } catch (error) {
      console.error('Error updating company:', error);
      setError('Failed to update company profile.');
    }
  };

  const handleViewApplication = async (application: any) => {
    setSelectedApplication(application);
    setIsViewApplicationModalOpen(true);
  };

  const handleEditJob = (job: any) => {
    setSelectedJobForEdit({
      ...job,
      salary_min: job.salary_min?.toString() || '',
      salary_max: job.salary_max?.toString() || '',
      requirements: job.requirements || [''],
      benefits: job.benefits || [''],
      skills_required: job.skills_required || ['']
    });
    setIsEditJobModalOpen(true);
  };

  // Helper functions for form arrays
  const addFormArrayItem = (formState: any, setFormState: React.Dispatch<React.SetStateAction<any>>, field: string) => {
    setFormState({
      ...formState,
      [field]: [...formState[field], '']
    });
  };

  const removeFormArrayItem = (formState: any, setFormState: React.Dispatch<React.SetStateAction<any>>, field: string, index: number) => {
    setFormState({
      ...formState,
      [field]: formState[field].filter((_: any, i: number) => i !== index)
    });
  };

  const updateFormArrayItem = (formState: any, setFormState: React.Dispatch<React.SetStateAction<any>>, field: string, index: number, value: string) => {
    const newArray = [...formState[field]];
    newArray[index] = value;
    setFormState({
      ...formState,
      [field]: newArray
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'submitted': 'bg-blue-100 text-blue-700',
      'under_review': 'bg-yellow-100 text-yellow-700',
      'interview_scheduled': 'bg-purple-100 text-purple-700',
      'interview_completed': 'bg-indigo-100 text-indigo-700',
      'offer_made': 'bg-green-100 text-green-700',
      'accepted': 'bg-emerald-100 text-emerald-700',
      'rejected': 'bg-red-100 text-red-700',
      'withdrawn': 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!isAuthenticated || profile?.role !== 'employer') {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">This page is only accessible to employers.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading employer dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error and Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {profile?.first_name}! Manage your jobs and applications.
                {!company && (
                  <span className="ml-2 text-red-600 font-medium">
                    (Please set up your company profile first)
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-6 w-6" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Company Required Alert */}
        {showCompanyRequiredAlert && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Company profile required!</strong> Please create your company profile before posting jobs.
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setShowCompanyRequiredAlert(false)}
                    className="inline-flex rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_jobs || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.active_jobs || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_applications || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pending_applications || 0}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'jobs', label: 'Jobs', icon: Briefcase },
              { id: 'applications', label: 'Applications', icon: Users },
              { id: 'interviews', label: 'Interviews', icon: Calendar },
              { id: 'company', label: 'Company', icon: Building },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Jobs */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
                
                <div className="space-y-4">
                  {jobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{job.title}</h4>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {job.location}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {job.application_count} applications
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {job.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      if (!company) {
                        setShowCompanyRequiredAlert(true);
                        setActiveTab('company');
                      } else {
                        setIsNewJobModalOpen(true);
                      }
                    }}
                    className={`w-full py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 ${
                      company 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    }`}
                    title={company ? "Post a new job" : "Please create a company profile first"}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Post New Job</span>
                  </button>
                  <button 
                    onClick={() => setIsEditCompanyModalOpen(true)}
                    className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    <Building className="h-4 w-4" />
                    <span>Update Company Profile</span>
                  </button>
                  <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Export Applications</span>
                  </button>
                </div>
              </div>

              {/* Company Info */}
              {company && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Profile</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Company Name</p>
                      <p className="font-medium text-gray-900">{company.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Industry</p>
                      <p className="font-medium text-gray-900">{company.industry || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">{company.location || 'Not specified'}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('company')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Edit Profile →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-6">
            {/* Jobs Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manage Jobs</h3>
                <p className="text-gray-600">Create, edit, and manage your job postings</p>
              </div>
              <button 
                onClick={() => {
                  if (!company) {
                    setShowCompanyRequiredAlert(true);
                    setActiveTab('company');
                  } else {
                    setIsNewJobModalOpen(true);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                  company 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
                title={company ? "Create a new job" : "Please create a company profile first"}
              >
                <Plus className="h-4 w-4" />
                <span>Post New Job</span>
              </button>
            </div>

            {/* Jobs List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {jobs.map((job) => (
                  <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{job.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            job.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {job.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {job.is_featured && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              Featured
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {job.location}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {job.job_type}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {job.application_count} applications
                          </span>
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {job.view_count} views
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {job.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                          <span>Updated: {new Date(job.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleToggleJobStatus(job.id)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            job.is_active 
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {job.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditJob(job)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-6">
            {/* Applications Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Applications</h3>
                <p className="text-gray-600">Review and manage job applications</p>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export Applications</span>
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="interview_scheduled">Interview Scheduled</option>
                    <option value="offer_made">Offer Made</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job</label>
                  <select
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Jobs</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search applicants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Applications List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {applicationsLoading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No applications found</h4>
                  <p className="text-gray-600">Applications will appear here when candidates apply to your jobs.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {applications.map((application) => (
                    <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {application.first_name} {application.last_name}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                              {formatStatus(application.status)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                            <span>{application.email}</span>
                            {application.phone && <span>{application.phone}</span>}
                            <span>Applied to: {application.job?.title}</span>
                          </div>
                          
                          {application.cover_letter && (
                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                              {application.cover_letter}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Applied: {new Date(application.applied_at).toLocaleDateString()}</span>
                            {application.years_experience && (
                              <span>Experience: {application.years_experience}</span>
                            )}
                            {application.expected_salary && (
                              <span>Expected: {application.expected_salary}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <select
                            value={application.status}
                            onChange={(e) => handleStatusUpdate(application.id, e.target.value)}
                            className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="submitted">Submitted</option>
                            <option value="under_review">Under Review</option>
                            <option value="interview_scheduled">Interview Scheduled</option>
                            <option value="interview_completed">Interview Completed</option>
                            <option value="offer_made">Offer Made</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          
                          <button 
                            onClick={() => handleViewApplication(application)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {application.resume_url && (
                            <button
                              onClick={() => window.open(application.resume_url, '_blank')}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'interviews' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Management</h2>
              <p className="text-gray-600">Schedule and manage interviews with candidates</p>
            </div>
            
            <InterviewsTab onRefresh={() => {}} />
          </div>
        )}

        {activeTab === 'company' && (
          <div className="max-w-4xl">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Company Profile</h3>
                {company ? (
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setIsEditCompanyModalOpen(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditCompanyModalOpen(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2 animate-pulse"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Company Profile</span>
                  </button>
                )}
              </div>
              
              {company ? (
                <div className="space-y-6">
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      <img
                        src={company.logo_url || 'https://images.pexels.com/photos/267371/pexels-photo-267371.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop'}
                        alt={`${company.name} logo`}
                        className="w-24 h-24 rounded-xl object-cover border border-gray-200 shadow-sm"
                      />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">{company.name}</h4>
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="text-gray-600">{company.industry}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{company.size_range} employees</span>
                        {company.founded_year && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">Founded {company.founded_year}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{company.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3">About</h5>
                      <p className="text-gray-600 leading-relaxed">{company.description}</p>
                      
                      {company.culture_description && (
                        <div className="mt-4">
                          <h5 className="font-semibold text-gray-900 mb-3">Company Culture</h5>
                          <p className="text-gray-600 leading-relaxed">{company.culture_description}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      {company.website_url && (
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-3">Website</h5>
                          <a 
                            href={company.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 flex items-center space-x-2"
                          >
                            <Globe className="h-4 w-4" />
                            <span>{company.website_url.replace(/^https?:\/\//, '')}</span>
                          </a>
                        </div>
                      )}
                      
                      {company.specialties && company.specialties.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-3">Specialties</h5>
                          <div className="flex flex-wrap gap-2">
                            {company.specialties.map((specialty, index) => (
                              <span 
                                key={index}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {company.benefits && company.benefits.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-3">Benefits</h5>
                          <div className="flex flex-wrap gap-2">
                            {company.benefits.map((benefit, index) => (
                              <span 
                                key={index}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                              >
                                {benefit}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Company Profile Required</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    <strong>Important:</strong> You must create a company profile before you can post jobs. 
                    This information will be displayed to job seekers.
                  </p>
                  <button 
                    onClick={() => setIsEditCompanyModalOpen(true)}
                    className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium animate-pulse"
                  >
                    Create Profile Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h4>
              <p className="text-gray-600">Detailed analytics and insights will be available here.</p>
            </div>
          </div>
        )}
        
        {/* New Job Modal */}
        {isNewJobModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Post New Job</h2>
                <button
                  onClick={() => setIsNewJobModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <form onSubmit={handleCreateJob} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={newJobData.title}
                      onChange={(e) => setNewJobData({...newJobData, title: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Senior Frontend Developer"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location *
                      </label>
                      <input
                        type="text"
                        value={newJobData.location}
                        onChange={(e) => setNewJobData({...newJobData, location: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., San Francisco, CA"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Type *
                      </label>
                      <select
                        value={newJobData.job_type}
                        onChange={(e) => setNewJobData({...newJobData, job_type: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                        <option value="Freelancing">Freelancing</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Level
                      </label>
                      <select
                        value={newJobData.experience_level}
                        onChange={(e) => setNewJobData({...newJobData, experience_level: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Entry-level">Entry-level</option>
                        <option value="Mid-level">Mid-level</option>
                        <option value="Senior">Senior</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Application Deadline
                      </label>
                      <input
                        type="date"
                        value={newJobData.application_deadline}
                        onChange={(e) => setNewJobData({...newJobData, application_deadline: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Salary
                      </label>
                      <input
                        type="number"
                        value={newJobData.salary_min}
                        onChange={(e) => setNewJobData({...newJobData, salary_min: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 80000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Salary
                      </label>
                      <input
                        type="number"
                        value={newJobData.salary_max}
                        onChange={(e) => setNewJobData({...newJobData, salary_max: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 120000"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="is_remote"
                        checked={newJobData.is_remote}
                        onChange={(e) => setNewJobData({...newJobData, is_remote: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_remote" className="ml-2 text-sm text-gray-700">
                        This is a remote position
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Description *
                    </label>
                    <textarea
                      value={newJobData.description}
                      onChange={(e) => setNewJobData({...newJobData, description: e.target.value})}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Describe the role, responsibilities, and ideal candidate..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requirements
                    </label>
                    <div className="space-y-2">
                      {newJobData.requirements.map((req, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={req}
                            onChange={(e) => updateFormArrayItem(newJobData, setNewJobData, 'requirements', index, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 3+ years of React experience"
                          />
                          <button
                            type="button"
                            onClick={() => removeFormArrayItem(newJobData, setNewJobData, 'requirements', index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addFormArrayItem(newJobData, setNewJobData, 'requirements')}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        + Add Requirement
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Benefits
                    </label>
                    <div className="space-y-2">
                      {newJobData.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={benefit}
                            onChange={(e) => updateFormArrayItem(newJobData, setNewJobData, 'benefits', index, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Health insurance"
                          />
                          <button
                            type="button"
                            onClick={() => removeFormArrayItem(newJobData, setNewJobData, 'benefits', index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addFormArrayItem(newJobData, setNewJobData, 'benefits')}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        + Add Benefit
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Skills
                    </label>
                    <div className="space-y-2">
                      {newJobData.skills_required.map((skill, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={skill}
                            onChange={(e) => updateFormArrayItem(newJobData, setNewJobData, 'skills_required', index, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., React"
                          />
                          <button
                            type="button"
                            onClick={() => removeFormArrayItem(newJobData, setNewJobData, 'skills_required', index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addFormArrayItem(newJobData, setNewJobData, 'skills_required')}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        + Add Skill
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setIsNewJobModalOpen(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      Post Job
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Job Modal */}
        {isEditJobModalOpen && selectedJobForEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Edit Job</h2>
                <button
                  onClick={() => {
                    setIsEditJobModalOpen(false);
                    setSelectedJobForEdit(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <form onSubmit={handleUpdateJob} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={selectedJobForEdit.title}
                      onChange={(e) => setSelectedJobForEdit({...selectedJobForEdit, title: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Senior Frontend Developer"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location *
                      </label>
                      <input
                        type="text"
                        value={selectedJobForEdit.location}
                        onChange={(e) => setSelectedJobForEdit({...selectedJobForEdit, location: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., San Francisco, CA"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Type *
                      </label>
                      <select
                        value={selectedJobForEdit.job_type}
                        onChange={(e) => setSelectedJobForEdit({...selectedJobForEdit, job_type: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                        <option value="Freelancing">Freelancing</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Level
                      </label>
                      <select
                        value={selectedJobForEdit.experience_level}
                        onChange={(e) => setSelectedJobForEdit({...selectedJobForEdit, experience_level: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Entry-level">Entry-level</option>
                        <option value="Mid-level">Mid-level</option>
                        <option value="Senior">Senior</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Application Deadline
                      </label>
                      <input
                        type="date"
                        value={selectedJobForEdit.application_deadline?.split('T')[0] || ''}
                        onChange={(e) => setSelectedJobForEdit({...selectedJobForEdit, application_deadline: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Salary
                      </label>
                      <input
                        type="number"
                        value={selectedJobForEdit.salary_min}
                        onChange={(e) => setSelectedJobForEdit({...selectedJobForEdit, salary_min: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 80000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Salary
                      </label>
                      <input
                        type="number"
                        value={selectedJobForEdit.salary_max}
                        onChange={(e) => setSelectedJobForEdit({...selectedJobForEdit, salary_max: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 120000"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="edit_is_remote"
                        checked={selectedJobForEdit.is_remote}
                        onChange={(e) => setSelectedJobForEdit({...selectedJobForEdit, is_remote: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="edit_is_remote" className="ml-2 text-sm text-gray-700">
                        This is a remote position
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Description *
                    </label>
                    <textarea
                      value={selectedJobForEdit.description}
                      onChange={(e) => setSelectedJobForEdit({...selectedJobForEdit, description: e.target.value})}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Describe the role, responsibilities, and ideal candidate..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requirements
                    </label>
                    <div className="space-y-2">
                      {selectedJobForEdit.requirements?.map((req: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={req}
                            onChange={(e) => updateFormArrayItem(selectedJobForEdit, setSelectedJobForEdit, 'requirements', index, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 3+ years of React experience"
                          />
                          <button
                            type="button"
                            onClick={() => removeFormArrayItem(selectedJobForEdit, setSelectedJobForEdit, 'requirements', index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addFormArrayItem(selectedJobForEdit, setSelectedJobForEdit, 'requirements')}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        + Add Requirement
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Benefits
                    </label>
                    <div className="space-y-2">
                      {selectedJobForEdit.benefits?.map((benefit: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={benefit}
                            onChange={(e) => updateFormArrayItem(selectedJobForEdit, setSelectedJobForEdit, 'benefits', index, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Health insurance"
                          />
                          <button
                            type="button"
                            onClick={() => removeFormArrayItem(selectedJobForEdit, setSelectedJobForEdit, 'benefits', index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addFormArrayItem(selectedJobForEdit, setSelectedJobForEdit, 'benefits')}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        + Add Benefit
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Skills
                    </label>
                    <div className="space-y-2">
                      {selectedJobForEdit.skills_required?.map((skill: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={skill}
                            onChange={(e) => updateFormArrayItem(selectedJobForEdit, setSelectedJobForEdit, 'skills_required', index, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., React"
                          />
                          <button
                            type="button"
                            onClick={() => removeFormArrayItem(selectedJobForEdit, setSelectedJobForEdit, 'skills_required', index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addFormArrayItem(selectedJobForEdit, setSelectedJobForEdit, 'skills_required')}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        + Add Skill
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditJobModalOpen(false);
                        setSelectedJobForEdit(null);
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      Update Job
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Company Modal */}
        {isEditCompanyModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {company ? 'Edit Company Profile' : 'Create Company Profile'}
                  </h2>
                  <p className="text-sm font-normal text-gray-500 mt-1">
                    Complete your company profile to start posting jobs
                  </p>
                </div>
                <button
                  onClick={() => setIsEditCompanyModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <form onSubmit={handleUpdateCompany} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Acme Corporation"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={companyData.description}
                      onChange={(e) => setCompanyData({...companyData, description: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Tell us about your company..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Industry *
                      </label>
                      <select
                        name="industry"
                        value={companyData.industry}
                        onChange={(e) => setCompanyData({...companyData, industry: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Finance">Finance</option>
                        <option value="Education">Education</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Retail">Retail</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Media & Entertainment">Media & Entertainment</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Size *
                      </label>
                      <select
                        name="size_range"
                        value={companyData.size_range}
                        onChange={(e) => setCompanyData({...companyData, size_range: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select company size</option>
                        <option value="1-50">1-50 employees</option>
                        <option value="50-200">50-200 employees</option>
                        <option value="200-500">200-500 employees</option>
                        <option value="500-1000">500-1000 employees</option>
                        <option value="1000-5000">1000-5000 employees</option>
                        <option value="5000+">5000+ employees</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={companyData.location}
                      onChange={(e) => setCompanyData({...companyData, location: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., San Francisco, CA"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Founded Year
                    </label>
                    <input
                      type="number"
                      name="founded_year"
                      value={companyData.founded_year}
                      onChange={(e) => setCompanyData({...companyData, founded_year: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website URL
                    </label>
                    <input
                      type="url"
                      name="website_url"
                      value={companyData.website_url}
                      onChange={(e) => setCompanyData({...companyData, website_url: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      name="logo_url"
                      value={companyData.logo_url || ''}
                      onChange={(e) => setCompanyData({...companyData, logo_url: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Culture
                    </label>
                    <textarea
                      name="culture_description"
                      value={companyData.culture_description}
                      onChange={(e) => setCompanyData({...companyData, culture_description: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Describe your company culture and values..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialties (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={companyData.specialties.join(', ')}
                      onChange={(e) => {
                        const value = e.target.value;
                        const items = value.split(',').map(item => item.trim()).filter(item => item);
                        setCompanyData({
                          ...companyData,
                          specialties: items
                        });
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Cloud Computing, Machine Learning, Mobile Development"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Benefits (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={companyData.benefits.join(', ')}
                      onChange={(e) => {
                        const value = e.target.value;
                        const items = value.split(',').map(item => item.trim()).filter(item => item);
                        setCompanyData({
                          ...companyData,
                          benefits: items
                        });
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Health Insurance, Remote Work, Flexible Hours"
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsEditCompanyModalOpen(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      {company ? 'Update Company Profile' : 'Create Company Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* View Application Modal */}
        {isViewApplicationModalOpen && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                  <p className="text-gray-600">
                    {selectedApplication.first_name} {selectedApplication.last_name} - {selectedApplication.job?.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsViewApplicationModalOpen(false);
                    setSelectedApplication(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Applicant Information */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-4">Applicant Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.first_name} {selectedApplication.last_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{selectedApplication.email}</p>
                        </div>
                        {selectedApplication.phone && (
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium text-gray-900">{selectedApplication.phone}</p>
                          </div>
                        )}
                        {selectedApplication.years_experience && (
                          <div>
                            <p className="text-sm text-gray-500">Experience</p>
                            <p className="font-medium text-gray-900">{selectedApplication.years_experience}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Cover Letter */}
                    {selectedApplication.cover_letter && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4">Cover Letter</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Skills */}
                    {selectedApplication.skills && selectedApplication.skills.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedApplication.skills.map((skill: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Additional Information */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-4">Additional Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedApplication.expected_salary && (
                          <div>
                            <p className="text-sm text-gray-500">Expected Salary</p>
                            <p className="font-medium text-gray-900">{selectedApplication.expected_salary}</p>
                          </div>
                        )}
                        {selectedApplication.current_salary && (
                          <div>
                            <p className="text-sm text-gray-500">Current Salary</p>
                            <p className="font-medium text-gray-900">{selectedApplication.current_salary}</p>
                          </div>
                        )}
                        {selectedApplication.notice_period && (
                          <div>
                            <p className="text-sm text-gray-500">Notice Period</p>
                            <p className="font-medium text-gray-900">{selectedApplication.notice_period}</p>
                          </div>
                        )}
                        {selectedApplication.availability_date && (
                          <div>
                            <p className="text-sm text-gray-500">Available From</p>
                            <p className="font-medium text-gray-900">
                              {new Date(selectedApplication.availability_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-500">Remote Preferred</p>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.is_remote_preferred ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Willing to Relocate</p>
                          <p className="font-medium text-gray-900">
                            {selectedApplication.willing_to_relocate ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Status */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-4">Application Status</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Current Status</p>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApplication.status)}`}>
                            {formatStatus(selectedApplication.status)}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Update Status</p>
                          <select
                            value={selectedApplication.status}
                            onChange={(e) => handleStatusUpdate(selectedApplication.id, e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="submitted">Submitted</option>
                            <option value="under_review">Under Review</option>
                            <option value="interview_scheduled">Interview Scheduled</option>
                            <option value="interview_completed">Interview Completed</option>
                            <option value="offer_made">Offer Made</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    {/* Links */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-4">Links & Documents</h3>
                      <div className="space-y-3">
                        {selectedApplication.resume_url && (
                          <a
                            href={selectedApplication.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                          >
                            <FileText className="h-4 w-4" />
                            <span>View Resume</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        
                        {selectedApplication.linkedin_url && (
                          <a
                            href={selectedApplication.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                          >
                            <Linkedin className="h-4 w-4" />
                            <span>LinkedIn Profile</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        
                        {selectedApplication.github_url && (
                          <a
                            href={selectedApplication.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-gray-600 hover:text-gray-700"
                          >
                            <Github className="h-4 w-4" />
                            <span>GitHub Profile</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        
                        {selectedApplication.portfolio_url && (
                          <a
                            href={selectedApplication.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
                          >
                            <Globe className="h-4 w-4" />
                            <span>Portfolio</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Application Info */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-4">Application Info</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Applied On</p>
                          <p className="font-medium text-gray-900">
                            {new Date(selectedApplication.applied_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Last Updated</p>
                          <p className="font-medium text-gray-900">
                            {new Date(selectedApplication.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Source</p>
                          <p className="font-medium text-gray-900 capitalize">
                            {selectedApplication.application_source || 'Website'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setIsViewApplicationModalOpen(false);
                    setSelectedApplication(null);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {selectedApplication && (
        <InterviewScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          application={selectedApplication}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default EmployerDashboard;