import React, { useState, useEffect } from 'react';
import { User, Briefcase, Heart, FileText, TrendingUp, Bell, Search, Filter, MapPin, Clock, DollarSign, Building, Star, Share2, Eye, Send, CheckCircle, XCircle, AlertCircle, Calendar, Award, Target, Users, Plus, ArrowRight, Bookmark, ExternalLink, ChevronRight, BarChart3, PieChart, Activity, Zap } from 'lucide-react';
import ApplyModal from './ApplyModal';
import ProfilePage from './ProfilePage';
import { getUserApplications, getApplicationAnalytics } from '../lib/applications';
import { useAuthContext } from './AuthProvider';
import { getJobs, getUserSavedJobs, saveJob, unsaveJob, isJobSaved } from '../lib/supabase';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const { isAuthenticated, loading, user, profile } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'browse-jobs' | 'saved-jobs' | 'applications' | 'profile'>('overview');
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationStats, setApplicationStats] = useState<any>(null);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedJobType, setSelectedJobType] = useState('All Types');
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

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
  useEffect(() => {
    const loadApplicationData = async () => {
      if (user && (activeTab === 'applications' || activeTab === 'overview')) {
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

  // Load saved jobs
  useEffect(() => {
    const loadSavedJobs = async () => {
      if (user && (activeTab === 'saved-jobs' || activeTab === 'overview')) {
        try {
          const userSavedJobs = await getUserSavedJobs(user.id);
          setSavedJobs(userSavedJobs);
          setSavedJobIds(new Set(userSavedJobs.map(savedJob => savedJob.job_id)));
        } catch (error) {
          console.error('Error loading saved jobs:', error);
        }
      }
    };

    loadSavedJobs();
  }, [user, activeTab]);

  // Load jobs from database
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const fetchedJobs = await getJobs({ limit: 20 });
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
          typeColor: getJobTypeColor(job.job_type),
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

  const getJobTypeColor = (jobType: string) => {
    const colorMap: Record<string, string> = {
      'Full Time': 'bg-blue-100 text-blue-700',
      'Part Time': 'bg-green-100 text-green-700',
      'Contract': 'bg-purple-100 text-purple-700',
      'Internship': 'bg-orange-100 text-orange-700',
      'Freelancing': 'bg-pink-100 text-pink-700',
    };
    return colorMap[jobType] || 'bg-gray-100 text-gray-700';
  };

  const stats = applicationStats ? [
    { label: 'Profile Views', value: profile?.profile_views?.toString() || '0', icon: Eye, color: 'text-blue-600', bgColor: 'bg-blue-50', change: '+12%', changeType: 'positive' },
    { label: 'Applications Sent', value: applicationStats.total_applications.toString(), icon: Send, color: 'text-green-600', bgColor: 'bg-green-50', change: '+8%', changeType: 'positive' },
    { label: 'Saved Jobs', value: savedJobs.length.toString(), icon: Heart, color: 'text-red-600', bgColor: 'bg-red-50', change: '+3', changeType: 'neutral' },
    { label: 'Response Rate', value: `${applicationStats.response_rate}%`, icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-50', change: '+5%', changeType: 'positive' },
  ] : [
    { label: 'Profile Views', value: profile?.profile_views?.toString() || '0', icon: Eye, color: 'text-blue-600', bgColor: 'bg-blue-50', change: '+12%', changeType: 'positive' },
    { label: 'Applications Sent', value: '0', icon: Send, color: 'text-green-600', bgColor: 'bg-green-50', change: '+0%', changeType: 'neutral' },
    { label: 'Saved Jobs', value: savedJobs.length.toString(), icon: Heart, color: 'text-red-600', bgColor: 'bg-red-50', change: '+3', changeType: 'neutral' },
    { label: 'Response Rate', value: '0%', icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-50', change: '+0%', changeType: 'neutral' },
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

  const toggleSaveJob = async (jobId: string) => {
    if (!user) return;

    try {
      const isCurrentlySaved = savedJobIds.has(jobId);
      
      if (isCurrentlySaved) {
        // Unsave the job
        await unsaveJob(user.id, jobId);
        setSavedJobIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        setSavedJobs(prev => prev.filter(savedJob => savedJob.job_id !== jobId));
      } else {
        // Save the job
        await saveJob(user.id, jobId);
        setSavedJobIds(prev => new Set(prev).add(jobId));
        // Refresh saved jobs list
        const userSavedJobs = await getUserSavedJobs(user.id);
        setSavedJobs(userSavedJobs);
        setSavedJobIds(new Set(userSavedJobs.map(savedJob => savedJob.job_id)));
      }
    } catch (error) {
      console.error('Error toggling save job:', error);
      alert('Failed to save/unsave job. Please try again.');
    }
  };

  const handleApplyClick = (job: any) => {
    setSelectedJob(job);
    setIsApplyModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'submitted': 'bg-blue-100 text-blue-700 border-blue-200',
      'under_review': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'interview_scheduled': 'bg-purple-100 text-purple-700 border-purple-200',
      'interview_completed': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'offer_made': 'bg-green-100 text-green-700 border-green-200',
      'accepted': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'rejected': 'bg-red-100 text-red-700 border-red-200',
      'withdrawn': 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const JobCard = ({ job, showFullDetails = false, isCompact = false }: { job: any, showFullDetails?: boolean, isCompact?: boolean }) => (
    <div className={`group bg-white border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden ${isCompact ? 'p-4' : 'p-6'}`}>
      {job.is_featured && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
          <Star className="h-3 w-3 inline mr-1" />
          Featured
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={job.logo || (typeof job.company === 'object' ? job.company?.logo_url : null) || 'https://images.pexels.com/photos/450035/pexels-photo-450035.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop'}
              alt={`${typeof job.company === 'object' ? job.company?.name : job.company} logo`}
              className="w-12 h-12 rounded-xl object-cover border border-gray-100"
            />
            {(job.rating || (typeof job.company === 'object' && job.company?.rating)) && (
              <div className="absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-full px-1 py-0.5 text-xs font-medium text-gray-600">
                <Star className="h-2.5 w-2.5 inline text-yellow-500 fill-current mr-0.5" />
                {job.rating || job.company?.rating}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
            <p className="text-gray-600 font-medium">
              {typeof job.company === 'object' ? job.company?.name : job.company}
            </p>
            <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
              <span>
                {job.employees || getEmployeeCount(typeof job.company === 'object' ? job.company?.size_range : null)} employees
              </span>
              <span>•</span>
              <span>{job.postedDate || getRelativeDate(job.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => toggleSaveJob(job.id)}
            className={`p-2 rounded-lg transition-colors ${
              savedJobIds.has(job.id)
                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            <Heart className={`h-5 w-5 ${savedJobIds.has(job.id) ? 'fill-current' : ''}`} />
          </button>
          <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center flex-wrap gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <MapPin className="h-3 w-3 mr-1" />
            {job.location}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${job.typeColor || getJobTypeColor(job.job_type || job.type)}`}>
            <Clock className="h-3 w-3 mr-1" />
            {job.type || job.job_type}
          </span>
          {job.is_remote && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <Zap className="h-3 w-3 mr-1" />
              Remote
            </span>
          )}
        </div>
        
        <div className="flex items-center text-gray-600 text-sm">
          <DollarSign className="h-4 w-4 mr-1" />
          {job.salary || formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
        </div>
      </div>

      {showFullDetails && (
        <div className="space-y-4 mb-4">
          <p className="text-gray-600 text-sm line-clamp-2">{job.description}</p>
          
          {job.requirements && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Requirements</h4>
              <ul className="space-y-1">
                {job.requirements.slice(0, 3).map((req: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {job.benefits && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Benefits</h4>
              <div className="flex flex-wrap gap-1">
                {job.benefits.slice(0, 4).map((benefit: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            {job.view_count || 0}
          </span>
          <span className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            {job.application_count || 0}
          </span>
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
            View Details
          </button>
          <button
            onClick={() => handleApplyClick(job)}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Apply Now
          </button>
        </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {profile?.first_name || 'there'}! 👋
              </h1>
              <p className="text-gray-600 mt-2">Here's your job search overview and recommendations</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className="flex items-center space-x-2 bg-white border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                <img
                  src="https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&fit=crop"
                  alt="Profile"
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('browse-jobs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'browse-jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Browse Jobs</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('saved-jobs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'saved-jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4" />
                <span>Saved Jobs ({savedJobs.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Applications</span>
                {applications.length > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                    {applications.length}
                  </span>
                )}
              </div>
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
                  <div
                    key={stat.label}
                    className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${stat.bgColor} p-3 rounded-xl`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        stat.changeType === 'positive' ? 'bg-green-100 text-green-700' :
                        stat.changeType === 'negative' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                      <p className="text-gray-600 text-sm">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('browse-jobs')}
                  className="group p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Search className="h-8 w-8 text-blue-600" />
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Browse Jobs</h4>
                  <p className="text-gray-600 text-sm">Discover new opportunities that match your skills</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('profile')}
                  className="group p-6 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <User className="h-8 w-8 text-green-600" />
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Update Profile</h4>
                  <p className="text-gray-600 text-sm">Keep your profile current to attract recruiters</p>
                </button>
                
                <button className="group p-6 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-left">
                  <div className="flex items-center justify-between mb-3">
                    <FileText className="h-8 w-8 text-purple-600" />
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Upload Resume</h4>
                  <p className="text-gray-600 text-sm">Update your resume to get better matches</p>
                </button>
              </div>
            </div>

            {/* Application Status Overview */}
            {applicationStats && applications.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Application Analytics</h3>
                  <button
                    onClick={() => setActiveTab('applications')}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"