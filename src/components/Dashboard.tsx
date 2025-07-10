import React, { useState } from 'react';
import { User, Briefcase, Heart, FileText, TrendingUp, Bell, Search, Filter, MapPin, Clock, DollarSign, Building, Star, Share2, Eye, Calendar, Award, Target, Users, CheckCircle } from 'lucide-react';
import ApplyModal from './ApplyModal';
import ProfilePage from './ProfilePage';
import { getUserApplications, getApplicationAnalytics } from '../lib/applications';
import { useAuthContext } from './AuthProvider';
import { getJobs } from '../lib/supabase';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const { isAuthenticated, loading } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'browse-jobs' | 'saved-jobs' | 'applications' | 'profile'>('overview');
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationStats, setApplicationStats] = useState<any>(null);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedJobType, setSelectedJobType] = useState('All Types');
  const [savedJobs, setSavedJobs] = useState<string[]>(['a1b2c3d4-e5f6-7890-1234-567890abcdef', 'c3d4e5f6-g7h8-9012-3456-789012cdefgh', 'e5f6g7h8-i9j0-1234-5678-901234efghij']);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const { user } = useAuthContext();

  // Don't render anything while loading
  if (loading) {
    return null;
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    if (onNavigate) {
      onNavigate('home');
    }
    return null;
  }

  // Load user applications and analytics
  React.useEffect(() => {
    const loadApplicationData = async () => {
      if (user && activeTab === 'applications') {
        setLoadingApplications(true);
        try {
          const [userApps, analytics] = await Promise.all([
            getUserApplications(user.id),
            getApplicationAnalytics(user.id)
          ]);
          setApplications(userApps);
          setApplicationStats(analytics);
        } catch (error) {
          console.error('Error loading application data:', error);
        } finally {
          setLoadingApplications(false);
        }
      }
    };

    loadApplicationData();
  }, [user, activeTab]);

  // Load jobs from database
  React.useEffect(() => {
    const loadJobs = async () => {
      try {
        const fetchedJobs = await getJobs();
        const jobsWithMockData = fetchedJobs.map(job => ({
          ...job,
          company: job.company?.name || 'Unknown Company',
          type: job.job_type,
          salary: formatSalary(job.salary_min, job.salary_max, job.salary_currency),
          logo: job.company?.logo_url || 'https://images.pexels.com/photos/450035/pexels-photo-450035.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
          rating: job.company?.rating || 4.5,
          employees: getEmployeeCount(job.company?.size_range),
          description: job.description,
          requirements: job.requirements || ['Experience required', 'Team player', 'Good communication skills'],
          benefits: job.benefits || ['Health Insurance', 'Flexible Hours', 'Remote Work'],
          category: getCategoryFromJobType(job.job_type),
          postedDate: getRelativeDate(job.created_at),
        }));
        setAllJobs(jobsWithMockData);
      } catch (error) {
        console.error('Error loading jobs:', error);
      } finally {
        setLoadingJobs(false);
      }
    };

    loadJobs();
  }, []);

  const formatSalary = (min?: number, max?: number, currency: string = 'USD') => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) {
      return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    }
    if (min) return `$${(min / 1000).toFixed(0)}k+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return 'Salary not specified';
  };

  const getEmployeeCount = (sizeRange?: string) => {
    const sizeMap: Record<string, string> = {
      '1-50': '1-50',
      '50-200': '50-200',
      '200-500': '200-500',
      '500-1000': '500-1000',
      '1000-5000': '1000-5000',
      '5000+': '5000+',
    };
    return sizeMap[sizeRange || ''] || '100+';
  };

  const getCategoryFromJobType = (jobType: string) => {
    const categoryMap: Record<string, string> = {
      'Full Time': 'Technology',
      'Part Time': 'Technology',
      'Contract': 'Design',
      'Internship': 'Technology',
      'Freelancing': 'Marketing',
    };
    return categoryMap[jobType] || 'Technology';
  };

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  // Update stats when applications change
  React.useEffect(() => {
    if (user && applications.length > 0) {
      getApplicationAnalytics(user.id).then(setApplicationStats);
    }
  }, [applications, user]);

  const stats = applicationStats ? [
    { label: 'Profile Views', value: '1,247', icon: Eye, color: 'text-blue-600' },
    { label: 'Applications Sent', value: applicationStats.total_applications.toString(), icon: FileText, color: 'text-green-600' },
    { label: 'Saved Jobs', value: savedJobs.length.toString(), icon: Heart, color: 'text-red-600' },
    { label: 'Response Rate', value: `${applicationStats.response_rate}%`, icon: TrendingUp, color: 'text-purple-600' },
  ] : [
    { label: 'Profile Views', value: '1,247', icon: Eye, color: 'text-blue-600' },
    { label: 'Applications Sent', value: '0', icon: FileText, color: 'text-green-600' },
    { label: 'Saved Jobs', value: savedJobs.length.toString(), icon: Heart, color: 'text-red-600' },
    { label: 'Response Rate', value: '0%', icon: TrendingUp, color: 'text-purple-600' },
  ];

  const categories = ['All Categories', 'Technology', 'Design', 'Marketing', 'Management'];
  const jobTypes = ['All Types', 'Full Time', 'Part Time', 'Contract', 'Remote'];

  const filteredJobs = allJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || job.category === selectedCategory;
    const matchesType = selectedJobType === 'All Types' || job.type === selectedJobType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const recommendedJobs = allJobs.slice(0, 3);

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleApplyClick = (job: any) => {
    setSelectedJob(job);
    setIsApplyModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'submitted': 'bg-blue-100 text-blue-700',
      'under_review': 'bg-yellow-100 text-yellow-700',
      'interview_scheduled': 'bg-purple-100 text-purple-700',
      'interview_completed': 'bg-indigo-100 text-indigo-700',
      'offer_made': 'bg-green-100 text-green-700',
      'accepted': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700',
      'withdrawn': 'bg-gray-100 text-gray-700',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const JobCard = ({ job, showFullDetails = false }: { job: any, showFullDetails?: boolean }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <img
            src={job.logo}
            alt={`${job.company} logo`}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
            <p className="text-gray-600">{job.company}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-600">{job.rating}</span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-600">{job.employees} employees</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => toggleSaveJob(job.id)}
            className={`p-2 rounded-lg transition-colors ${
              savedJobs.includes(job.id)
                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            <Heart className={`h-5 w-5 ${savedJobs.includes(job.id) ? 'fill-current' : ''}`} />
          </button>
          <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-gray-600 text-sm">
          <MapPin className="h-4 w-4 mr-2" />
          {job.location}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-600 text-sm">
            <Clock className="h-4 w-4 mr-2" />
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {job.type}
            </span>
          </div>
          <span className="text-sm text-gray-500">{job.postedDate}</span>
        </div>
        <div className="flex items-center text-gray-600 text-sm">
          <DollarSign className="h-4 w-4 mr-2" />
          {job.salary}
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>

      {showFullDetails && (
        <div className="space-y-4 mb-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
            <ul className="space-y-1">
              {job.requirements.map((req: string, index: number) => (
                <li key={index} className="text-sm text-gray-600 flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Benefits</h4>
            <div className="flex flex-wrap gap-2">
              {job.benefits.map((benefit: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                >
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={() => handleApplyClick(job)}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Apply Now
        </button>
        <button className="px-4 py-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium">
          View Details
        </button>
      </div>
    </div>
  );

  if (activeTab === 'profile') {
    return <ProfilePage onNavigate={onNavigate} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your job search overview.</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('browse-jobs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'browse-jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Browse Jobs
            </button>
            <button
              onClick={() => setActiveTab('saved-jobs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'saved-jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Saved Jobs ({savedJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      </div>
                      <Icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('browse-jobs')}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <Search className="h-6 w-6 text-blue-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Browse Jobs</h4>
                  <p className="text-gray-600 text-sm">Find new opportunities</p>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <User className="h-6 w-6 text-green-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Update Profile</h4>
                  <p className="text-gray-600 text-sm">Keep your profile current</p>
                </button>
                <button className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left">
                  <FileText className="h-6 w-6 text-purple-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Update Resume</h4>
                  <p className="text-gray-600 text-sm">Upload latest version</p>
                </button>
              </div>
            </div>

            {/* Recommended Jobs */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
                <button
                  onClick={() => setActiveTab('browse-jobs')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </button>
              </div>
              {loadingJobs ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 mb-4">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {recommendedJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Browse Jobs Tab */}
        {activeTab === 'browse-jobs' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search jobs, companies, or keywords..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {jobTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {filteredJobs.length} Jobs Found
                </h3>
              </div>
              {loadingJobs ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 mb-4">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} showFullDetails />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Saved Jobs Tab */}
        {activeTab === 'saved-jobs' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Your Saved Jobs ({savedJobs.length})
              </h3>
              {savedJobs.length === 0 ? (
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
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            {/* Application Analytics */}
            {applicationStats && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Application Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">{applicationStats.total_applications}</div>
                    <div className="text-gray-600 text-sm">Total Applications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">{applicationStats.applications_this_month}</div>
                    <div className="text-gray-600 text-sm">This Month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">{applicationStats.response_rate}%</div>
                    <div className="text-gray-600 text-sm">Response Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-2">{applicationStats.interview_rate}%</div>
                    <div className="text-gray-600 text-sm">Interview Rate</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Your Applications</h3>
                {applications.length > 0 && (
                  <span className="text-sm text-gray-500">{applications.length} total applications</span>
                )}
              </div>
              
              {loadingApplications ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h4>
                  <p className="text-gray-600 mb-6">Start applying to jobs to track your applications here</p>
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
                    <div key={application.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          {application.job?.company?.logo_url && (
                            <img
                              src={application.job.company.logo_url}
                              alt={`${application.job.company.name} logo`}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <h4 className="font-semibold text-gray-900">{application.job?.title}</h4>
                            <p className="text-gray-600">{application.job?.company?.name}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Applied on {new Date(application.applied_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                          {formatStatus(application.status)}
                        </span>
                      </div>
                      
                      {application.job && (
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {application.job.location}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {application.job.job_type}
                          </div>
                          {application.expected_salary && (
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {application.expected_salary}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Application Timeline */}
                      {application.status_history && application.status_history.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Application Timeline</h5>
                          <div className="space-y-2">
                            {application.status_history.slice(0, 3).map((history: any, index: number) => (
                              <div key={history.id} className="flex items-center text-sm text-gray-600">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                                <span>{formatStatus(history.new_status)}</span>
                                <span className="mx-2">•</span>
                                <span>{new Date(history.created_at).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upcoming Interviews */}
                      {application.interviews && application.interviews.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Upcoming Interviews</h5>
                          {application.interviews.map((interview: any) => (
                            <div key={interview.id} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                              <div>
                                <p className="font-medium text-blue-900">{interview.interview_type} Interview</p>
                                <p className="text-sm text-blue-700">
                                  {new Date(interview.scheduled_date).toLocaleDateString()} at{' '}
                                  {new Date(interview.scheduled_date).toLocaleTimeString()}
                                </p>
                              </div>
                              <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {selectedJob && (
        <ApplyModal
          isOpen={isApplyModalOpen}
          onClose={() => {
            setIsApplyModalOpen(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
        />
      )}
    </div>
  );
};

export default Dashboard;