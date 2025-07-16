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
  ExternalLink
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { 
  getEmployerStats, 
  getEmployerCompany, 
  getEmployerJobs, 
  getEmployerApplications,
  updateApplicationStatus,
  toggleJobStatus,
  deleteJob
} from '../lib/employer';

interface EmployerDashboardProps {
  onNavigate?: (page: string, jobId?: string) => void;
}

const EmployerDashboard = ({ onNavigate }: EmployerDashboardProps) => {
  const { user, profile, isAuthenticated } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'applications' | 'company' | 'analytics'>('overview');
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

  // Load employer data
  useEffect(() => {
    const loadEmployerData = async () => {
      if (!user || !isAuthenticated) return;
      
      setLoading(true);
      try {
        const [statsData, companyData, jobsData] = await Promise.all([
          getEmployerStats(user.id),
          getEmployerCompany(user.id),
          getEmployerJobs(user.id, { limit: 10 })
        ]);
        
        setStats(statsData);
        setCompany(companyData);
        setJobs(jobsData);
      } catch (error) {
        console.error('Error loading employer data:', error);
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {profile?.first_name}! Manage your jobs and applications.
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
                  <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Post New Job</span>
                  </button>
                  <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2">
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
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2">
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
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
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
                          
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
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

        {activeTab === 'company' && (
          <div className="max-w-4xl">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Company Profile</h3>
              
              {company ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={company.name}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                      <input
                        type="text"
                        value={company.industry || ''}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      rows={4}
                      value={company.description || ''}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Company Profile</h4>
                  <p className="text-gray-600 mb-6">Create your company profile to start posting jobs.</p>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Create Company Profile
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
      </div>
    </div>
  );
};

export default EmployerDashboard;