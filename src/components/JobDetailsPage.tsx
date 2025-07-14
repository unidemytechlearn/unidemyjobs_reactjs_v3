import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Clock, DollarSign, Building, Star, Calendar, Users, Share2, Bookmark, ExternalLink, CheckCircle, Briefcase, Globe, Eye, MessageSquare } from 'lucide-react';
import ApplyModal from './ApplyModal';
import { useAuthContext } from './AuthProvider';
import { hasUserAppliedToJob } from '../lib/supabase';
import SignUpModal from './SignUpModal';
import SignInModal from './SignInModal';

interface JobDetailsPageProps {
  jobId: string;
  onNavigate: (page: string, jobId?: string) => void;
}

const JobDetailsPage = ({ jobId, onNavigate }: JobDetailsPageProps) => {
  const { isAuthenticated } = useAuthContext();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(false);

  useEffect(() => {
    const loadJobDetails = async () => {
      try {
        setLoading(true);
        // Import getJobs dynamically to avoid circular imports
        const { getJobs } = await import('../lib/supabase');
        const jobs = await getJobs();
        const foundJob = jobs.find(j => j.id === jobId);
        
        if (foundJob) {
          // Transform job data to match expected format
          const transformedJob = {
            ...foundJob,
            typeColor: getJobTypeColor(foundJob.job_type),
            salary: formatSalary(foundJob.salary_min, foundJob.salary_max, foundJob.salary_currency),
            logo: foundJob.company?.logo_url || 'https://images.pexels.com/photos/450035/pexels-photo-450035.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
            company: foundJob.company?.name || 'Unknown Company',
            postedDate: getRelativeDate(foundJob.created_at)
          };
          setJob(transformedJob);
        }
      } catch (error) {
        console.error('Error loading job details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      loadJobDetails();
    }
  }, [jobId]);

  // Check if user has already applied to this job
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (job && user && isAuthenticated) {
        setCheckingApplication(true);
        try {
          const applied = await hasUserAppliedToJob(user.id, job.id);
          setHasApplied(applied);
        } catch (error) {
          console.error('Error checking application status:', error);
        } finally {
          setCheckingApplication(false);
        }
      }
    };

    checkApplicationStatus();
  }, [job, user, isAuthenticated]);

  // Check if application deadline has passed
  const isDeadlinePassed = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  // Check if user can apply to job
  const canApplyToJob = () => {
    if (!job) return false;
    if (!isAuthenticated) return true; // Show apply button for non-authenticated users
    if (hasApplied) return false; // Already applied
    if (isDeadlinePassed(job.application_deadline)) return false; // Deadline passed
    return true;
  };

  // Get apply button text and styling
  const getApplyButtonInfo = () => {
    if (checkingApplication) {
      return { 
        text: 'Checking...', 
        disabled: true, 
        className: 'bg-gray-400 cursor-not-allowed' 
      };
    }
    
    if (!isAuthenticated) {
      return { 
        text: 'Apply for this Position', 
        disabled: false, 
        className: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
      };
    }
    
    if (hasApplied) {
      return { 
        text: 'Already Applied', 
        disabled: true, 
        className: 'bg-green-600 cursor-not-allowed' 
      };
    }
    
    if (job && isDeadlinePassed(job.application_deadline)) {
      return { 
        text: 'Application Deadline Passed', 
        disabled: true, 
        className: 'bg-gray-400 cursor-not-allowed' 
      };
    }
    
    return { 
      text: 'Apply for this Position', 
      disabled: false, 
      className: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
    };
  };

  const getJobTypeColor = (jobType: string) => {
    const colorMap: Record<string, string> = {
      'Full Time': 'bg-blue-100 text-blue-700 border-blue-200',
      'Part Time': 'bg-green-100 text-green-700 border-green-200',
      'Contract': 'bg-purple-100 text-purple-700 border-purple-200',
      'Internship': 'bg-orange-100 text-orange-700 border-orange-200',
      'Freelancing': 'bg-pink-100 text-pink-700 border-pink-200',
    };
    return colorMap[jobType] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatSalary = (min?: number, max?: number, currency: string = 'USD') => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) {
      return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    }
    if (min) return `$${(min / 1000).toFixed(0)}k+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return 'Salary not specified';
  };

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const handleApplyClick = () => {
    if (!canApplyToJob()) return;
    
    if (isAuthenticated) {
      setIsApplyModalOpen(true);
    } else {
      setIsSignUpModalOpen(true);
    }
  };

  const handleSaveJob = () => {
    setIsSaved(!isSaved);
    // TODO: Implement actual save/unsave functionality
  };

  const handleSwitchToSignIn = () => {
    setIsSignUpModalOpen(false);
    setIsSignInModalOpen(true);
  };

  const handleSwitchToSignUp = () => {
    setIsSignInModalOpen(false);
    setIsSignUpModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsSignUpModalOpen(false);
    setIsSignInModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading job details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <Briefcase className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Job not found</h3>
            <p className="text-gray-600 mb-4">The job you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => onNavigate('dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Header */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={job.logo}
                    alt={`${job.company} logo`}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-gray-100"
                  />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                    <div className="flex items-center space-x-4 text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4" />
                        <span className="font-medium">{job.company}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{job.postedDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSaveJob}
                    className={`p-3 rounded-xl border transition-colors ${
                      isSaved 
                        ? 'bg-red-50 border-red-200 text-red-600' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                  <button className="p-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Job Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Salary</p>
                      <p className="font-semibold text-gray-900">{job.salary}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600 font-medium">Experience</p>
                      <p className="font-semibold text-gray-900">{job.experience_level || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Job Type</p>
                      <p className="font-semibold text-gray-900">{job.job_type}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <Eye className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Views</p>
                      <p className="font-semibold text-gray-900">{job.view_count || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              {(() => {
                const buttonInfo = getApplyButtonInfo();
                return (
                  <button
                    onClick={handleApplyClick}
                    disabled={buttonInfo.disabled}
                    className={`w-full ${buttonInfo.className} text-white py-4 rounded-xl transition-all font-semibold text-lg shadow-lg ${!buttonInfo.disabled ? 'hover:shadow-xl transform hover:-translate-y-0.5' : ''}`}
                  >
                    {buttonInfo.text}
                  </button>
                );
              })()}
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Description</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {job.description || 'No description available for this position.'}
                </p>
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Requirements</h2>
                <ul className="space-y-3">
                  {job.requirements.map((requirement: string, index: number) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills Required */}
            {job.skills_required && job.skills_required.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Required Skills</h2>
                <div className="flex flex-wrap gap-3">
                  {job.skills_required.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Benefits & Perks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {job.benefits.map((benefit: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-gray-600">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Information */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About {job.company}</h3>
              
              <div className="space-y-4">
                {job.company?.industry && (
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Industry</p>
                      <p className="font-medium text-gray-900">{job.company.industry}</p>
                    </div>
                  </div>
                )}
                
                {job.company?.size_range && (
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Company Size</p>
                      <p className="font-medium text-gray-900">{job.company.size_range} employees</p>
                    </div>
                  </div>
                )}
                
                {job.company?.founded_year && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Founded</p>
                      <p className="font-medium text-gray-900">{job.company.founded_year}</p>
                    </div>
                  </div>
                )}
                
                {job.company?.rating && (
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Rating</p>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium text-gray-900">{job.company.rating}</span>
                        <span className="text-yellow-500">★</span>
                        {job.company.review_count && (
                          <span className="text-sm text-gray-500">({job.company.review_count} reviews)</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {job.company?.website_url && (
                  <div className="pt-4 border-t border-gray-200">
                    <a
                      href={job.company.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Globe className="h-4 w-4" />
                      <span>Visit Company Website</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {job.company?.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Company Description</h4>
                  <span className={`font-semibold ${isDeadlinePassed(job.application_deadline) ? 'text-red-600' : 'text-gray-900'}`}>
                    {job.company.description}
                    {isDeadlinePassed(job.application_deadline) && (
                      <span className="text-xs text-red-500 block">Expired</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Job Statistics */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Statistics</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Views</span>
                  <span className="font-semibold text-gray-900">{job.view_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Applications</span>
                  <span className="font-semibold text-gray-900">{job.application_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Posted</span>
                  <span className="font-semibold text-gray-900">{job.postedDate}</span>
                </div>
                {job.application_deadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Deadline</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(job.application_deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Apply */}
            {(() => {
              const buttonInfo = getApplyButtonInfo();
              const canApply = canApplyToJob();
              
              return (
                <div className={`rounded-2xl p-6 text-white ${
                  canApply ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-500'
                }`}>
                  <h3 className="text-lg font-semibold mb-3">
                    {hasApplied ? 'Application Submitted' : 
                     isDeadlinePassed(job?.application_deadline) ? 'Application Closed' : 
                     'Ready to Apply?'}
                  </h3>
                  <p className={`text-sm mb-4 ${canApply ? 'text-blue-100' : 'text-gray-200'}`}>
                    {hasApplied ? 'You have already applied for this position. Check your dashboard for updates.' :
                     isDeadlinePassed(job?.application_deadline) ? 'The application deadline for this position has passed.' :
                     'Join thousands of professionals who have found their dream job through our platform.'}
                  </p>
                  <button
                    onClick={handleApplyClick}
                    disabled={buttonInfo.disabled}
                    className={`w-full py-3 rounded-xl transition-colors font-semibold ${
                      canApply ? 'bg-white text-blue-600 hover:bg-gray-50' : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {buttonInfo.text}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {job && (
        <ApplyModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          job={job}
        />
      )}

      {/* Authentication Modals */}
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSwitchToSignIn={handleSwitchToSignIn}
        onSuccess={handleAuthSuccess}
      />
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onSwitchToSignUp={handleSwitchToSignUp}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default JobDetailsPage;