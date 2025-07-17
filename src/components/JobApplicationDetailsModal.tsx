import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, DollarSign, Building, Star, Calendar, User, Mail, Phone, FileText, Download, ExternalLink, ChevronRight, CheckCircle, AlertCircle, Eye, MessageSquare, Briefcase, Globe, Linkedin, Github, ArrowLeft, Share2, Video } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { getApplicationStatusTimeline } from '../lib/applications';
import { getCandidateInterviews, getEmployerInterviews } from '../lib/interviews';

interface JobApplicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: any;
  onWithdraw?: (applicationId: string) => void;
  isWithdrawing?: boolean;
}

const JobApplicationDetailsModal = ({ 
  isOpen, 
  onClose, 
  application, 
  onWithdraw, 
  isWithdrawing = false 
}: JobApplicationDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'documents' | 'notes'>('overview');
  const { user, profile } = useAuthContext();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);

  useEffect(() => {
    const loadTimeline = async () => {
      if (application?.id) {
        setLoadingTimeline(true);
        try {
          const timelineData = await getApplicationStatusTimeline(application.id);
          setTimeline(timelineData);
        } catch (error) {
          console.error('Error loading timeline:', error);
        } finally {
          setLoadingTimeline(false);
        }
      }
    };

    if (isOpen && application) {
      loadTimeline();
    }
    
    // Load interviews if user is authenticated
    const loadInterviews = async () => {
      if (application?.id && user) {
        setLoadingInterviews(true);
        try {
          if (profile?.role === 'job_seeker') {
            const interviewsData = await getCandidateInterviews(user.id, { applicationId: application.id });
            setInterviews(interviewsData);
          } else if (profile?.role === 'employer') {
            // Import dynamically to avoid circular dependencies
            const { getEmployerInterviews } = await import('../lib/interviews');
            const interviewsData = await getEmployerInterviews(user.id, { applicationId: application.id });
            setInterviews(interviewsData);
          }
        } catch (error) {
          console.error('Error loading interviews:', error);
        } finally {
          setLoadingInterviews(false);
        }
      }
    };
    
    if (isOpen && application && user) {
      loadInterviews();
    }
  }, [isOpen, application, user, profile]);

  if (!isOpen || !application) return null;

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

  const getStatusIcon = (status: string) => {
    const statusIcons: Record<string, React.ReactNode> = {
      'submitted': <FileText className="h-4 w-4" />,
      'under_review': <Eye className="h-4 w-4" />,
      'interview_scheduled': <Calendar className="h-4 w-4" />,
      'interview_completed': <CheckCircle className="h-4 w-4" />,
      'offer_made': <Star className="h-4 w-4" />,
      'accepted': <CheckCircle className="h-4 w-4" />,
      'rejected': <X className="h-4 w-4" />,
      'withdrawn': <ArrowLeft className="h-4 w-4" />,
    };
    return statusIcons[status] || <FileText className="h-4 w-4" />;
  };

  const formatStatus = (status: string) => {
    if (!status || typeof status !== 'string') {
      return 'Unknown Status';
    }
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const canWithdraw = (status: string) => {
    return ['submitted', 'under_review', 'interview_scheduled'].includes(status);
  };

  const getWithdrawMessage = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Your application is still being reviewed and can be withdrawn.';
      case 'under_review':
        return 'Your application is currently under review and can still be withdrawn.';
      case 'interview_scheduled':
        return 'You have an interview scheduled. Withdrawing will cancel the interview.';
      case 'interview_completed':
        return 'Interview completed. Application cannot be withdrawn at this stage.';
      case 'offer_made':
        return 'An offer has been made. Please contact the company directly.';
      case 'accepted':
        return 'Application has been accepted. Cannot be withdrawn.';
      case 'rejected':
        return 'Application has already been rejected.';
      case 'withdrawn':
        return 'Application has already been withdrawn.';
      default:
        return 'Application cannot be withdrawn at this stage.';
    }
  };

  const handleWithdraw = () => {
    if (onWithdraw && application?.id) {
      onWithdraw(application.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const job = application.job;
  const company = job?.company;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <img
              src={company?.logo_url || 'https://images.pexels.com/photos/450035/pexels-photo-450035.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop'}
              alt={`${company?.name} logo`}
              className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-lg"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{job?.title}</h2>
              <p className="text-lg text-gray-600 font-medium">{company?.name}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(application.status)}`}>
                  {getStatusIcon(application.status)}
                  <span className="ml-2">{formatStatus(application.status)}</span>
                </span>
                <span className="text-sm text-gray-500">
                  Applied {new Date(application.applied_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
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
                <Eye className="h-4 w-4" />
                <span>Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'timeline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Timeline</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('interviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'interviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Video className="h-4 w-4" />
                <span>Interviews</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Documents</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Notes</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Job Details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">{job?.location || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Job Type</p>
                        <p className="font-medium text-gray-900">{job?.job_type || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Salary Range</p>
                        <p className="font-medium text-gray-900">
                          {job?.salary_min && job?.salary_max 
                            ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
                            : 'Not specified'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Experience Level</p>
                        <p className="font-medium text-gray-900">{job?.experience_level || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {job?.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
                      <p className="text-gray-600 leading-relaxed">{job.description}</p>
                    </div>
                  )}

                  {job?.requirements && job.requirements.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Requirements</h4>
                      <ul className="space-y-2">
                        {job.requirements.map((req: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 text-sm">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {job?.benefits && job.benefits.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Benefits</h4>
                      <div className="flex flex-wrap gap-2">
                        {job.benefits.map((benefit: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Application Details */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Application</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            {application.first_name} {application.last_name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{application.email}</span>
                        </div>
                        {application.phone && (
                          <div className="flex items-center space-x-3">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{application.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Professional Details</h4>
                      <div className="space-y-3">
                        {application.years_experience && (
                          <div>
                            <p className="text-sm text-gray-500">Experience</p>
                            <p className="font-medium text-gray-900">{application.years_experience}</p>
                          </div>
                        )}
                        {application.expected_salary && (
                          <div>
                            <p className="text-sm text-gray-500">Expected Salary</p>
                            <p className="font-medium text-gray-900">{application.expected_salary}</p>
                          </div>
                        )}
                        {application.notice_period && (
                          <div>
                            <p className="text-sm text-gray-500">Notice Period</p>
                            <p className="font-medium text-gray-900">{application.notice_period}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {application.cover_letter && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Cover Letter</h4>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {application.cover_letter}
                        </p>
                      </div>
                    </div>
                  )}

                  {application.skills && application.skills.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {application.skills.map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Company Info */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Industry</p>
                        <p className="font-medium text-gray-900">{company?.industry || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Star className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Rating</p>
                        <p className="font-medium text-gray-900">
                          {company?.rating ? `${company.rating}/5.0` : 'Not rated'}
                        </p>
                      </div>
                    </div>

                    {company?.website_url && (
                      <div className="flex items-center space-x-3">
                        <Globe className="h-5 w-5 text-gray-400" />
                        <a
                          href={company.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Company Website
                          <ExternalLink className="h-3 w-3 inline ml-1" />
                        </a>
                      </div>
                    )}
                  </div>

                  {company?.description && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">About Company</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{company.description}</p>
                    </div>
                  )}
                </div>

                {/* Quick Links */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
                  
                  <div className="space-y-3">
                    {application.linkedin_url && (
                      <a
                        href={application.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                        <span>LinkedIn Profile</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    
                    {application.github_url && (
                      <a
                        href={application.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 text-gray-600 hover:text-gray-700 transition-colors"
                      >
                        <Github className="h-4 w-4" />
                        <span>GitHub Profile</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    
                    {application.portfolio_url && (
                      <a
                        href={application.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        <span>Portfolio</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    
                    {application.resume_url && (
                      <a
                        href={application.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 text-green-600 hover:text-green-700 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Resume</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Application Stats */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Stats</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Application ID</span>
                      <span className="font-mono text-sm text-gray-900">
                        #{application.id.slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Applied Date</span>
                      <span className="font-medium text-gray-900">
                        {new Date(application.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Last Updated</span>
                      <span className="font-medium text-gray-900">
                        {new Date(application.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Source</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {application.application_source || 'Website'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Timeline</h3>
                <p className="text-gray-600">Track the progress of your application through each stage</p>
              </div>

              {loadingTimeline ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading timeline...</p>
                </div>
              ) : timeline.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No timeline data available</h4>
                  <p className="text-gray-600">Timeline information will appear here as your application progresses</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-8">
                    {timeline.map((event, index) => (
                      <div key={event.id || index} className="relative flex items-start space-x-6">
                        <div className={`flex-shrink-0 w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${
                          event.is_current ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getStatusIcon(event.status)}
                        </div>
                        
                        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {formatStatus(event.status)}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {formatDate(event.created_at)}
                            </span>
                          </div>
                          
                          {event.notes && (
                            <p className="text-gray-600 mb-3">{event.notes}</p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(event.status)}`}>
                              {formatStatus(event.status)}
                            </span>
                            
                            {event.is_current && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                Current Status
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interviews Tab */}
          {activeTab === 'interviews' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Scheduled Interviews</h3>
                <p className="text-gray-600">View all scheduled and past interviews for this application</p>
              </div>

              {loadingInterviews ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading interviews...</p>
                </div>
              ) : interviews.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No interviews scheduled</h4>
                  <p className="text-gray-600">No interviews have been scheduled for this application yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {interviews.map((interview) => {
                    const isPast = new Date(interview.scheduled_date) < new Date();
                    const isToday = (() => {
                      const interviewDate = new Date(interview.scheduled_date);
                      const today = new Date();
                      return (
                        interviewDate.getDate() === today.getDate() &&
                        interviewDate.getMonth() === today.getMonth() &&
                        interviewDate.getFullYear() === today.getFullYear()
                      );
                    })();
                    
                    return (
                      <div 
                        key={interview.id} 
                        className={`bg-white border rounded-xl p-6 ${
                          isToday ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                              interview.interview_type === 'phone' ? 'bg-blue-500' :
                              interview.interview_type === 'video' ? 'bg-purple-500' :
                              interview.interview_type === 'technical' ? 'bg-emerald-500' :
                              interview.interview_type === 'panel' ? 'bg-amber-500' :
                              interview.interview_type === 'in_person' ? 'bg-pink-500' :
                              interview.interview_type === 'final' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`}>
                              {interview.interview_type === 'phone' ? <Phone className="h-5 w-5" /> :
                               interview.interview_type === 'video' ? <Video className="h-5 w-5" /> :
                               interview.interview_type === 'technical' ? <Code className="h-5 w-5" /> :
                               interview.interview_type === 'panel' ? <Users className="h-5 w-5" /> :
                               interview.interview_type === 'in_person' ? <Building className="h-5 w-5" /> :
                               interview.interview_type === 'final' ? <CheckCircle className="h-5 w-5" /> :
                               <Calendar className="h-5 w-5" />}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {interview.interview_type === 'phone' ? 'Phone Interview' :
                                 interview.interview_type === 'video' ? 'Video Interview' :
                                 interview.interview_type === 'technical' ? 'Technical Interview' :
                                 interview.interview_type === 'panel' ? 'Panel Interview' :
                                 interview.interview_type === 'in_person' ? 'In-Person Interview' :
                                 interview.interview_type === 'final' ? 'Final Interview' :
                                 'Interview'}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                  interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  interview.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  interview.status === 'rescheduled' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {interview.status === 'scheduled' && <Calendar className="h-3 w-3 mr-1" />}
                                  {interview.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {interview.status === 'cancelled' && <XSquare className="h-3 w-3 mr-1" />}
                                  {interview.status === 'rescheduled' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                  <span className="capitalize">{interview.status}</span>
                                </span>
                                {isToday && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Today
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {new Date(interview.scheduled_date).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-gray-600 text-sm">
                              {new Date(interview.scheduled_date).toLocaleTimeString(undefined, {
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                              {' • '}
                              {interview.duration_minutes} min
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {interview.location && (
                            <div className="flex items-center text-gray-600">
                              <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                              <span>{interview.location}</span>
                            </div>
                          )}
                          
                          {interview.meeting_link && (
                            <div className="flex items-center text-gray-600">
                              <Video className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                              <a
                                href={interview.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline truncate max-w-xs"
                              >
                                {interview.meeting_link}
                              </a>
                            </div>
                          )}
                        </div>
                        
                        {interview.notes && (
                          <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                            <p className="font-medium text-gray-700 mb-1">Notes:</p>
                            <p>{interview.notes}</p>
                          </div>
                        )}
                        
                        {interview.feedback && interview.feedback.length > 0 && profile?.role === 'employer' && (
                          <div className="mt-4 border-t border-gray-100 pt-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">Feedback</h4>
                              {interview.feedback && interview.feedback.length > 0 && (
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className="h-4 w-4"
                                      fill={interview.feedback[0]?.rating >= star ? '#FBBF24' : 'none'}
                                      stroke={interview.feedback[0]?.rating >= star ? '#FBBF24' : '#D1D5DB'}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {interview.feedback && interview.feedback.length > 0 && interview.feedback[0]?.recommendation && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium text-gray-700">Recommendation: </span>
                                <span className={`
                                  ${interview.feedback[0]?.recommendation === 'strong_yes' ? 'text-green-600' : ''}
                                  ${interview.feedback[0]?.recommendation === 'yes' ? 'text-green-600' : ''}
                                  ${interview.feedback[0]?.recommendation === 'maybe' ? 'text-yellow-600' : ''}
                                  ${interview.feedback[0]?.recommendation === 'no' ? 'text-red-600' : ''} 
                                  ${interview.feedback[0]?.recommendation === 'strong_no' ? 'text-red-600' : ''}
                                `}>
                                  {interview.feedback[0]?.recommendation === 'strong_yes' && 'Strong Yes'}
                                  {interview.feedback[0]?.recommendation === 'yes' && 'Yes'}
                                  {interview.feedback[0]?.recommendation === 'maybe' && 'Maybe'}
                                  {interview.feedback[0]?.recommendation === 'no' && 'No'}
                                  {interview.feedback[0]?.recommendation === 'strong_no' && 'Strong No'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Documents</h3>
                <p className="text-gray-600">Documents submitted with your application</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resume */}
                {application.resume_url && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Resume</h4>
                        <p className="text-sm text-gray-600">PDF Document</p>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(application.resume_url, '_blank')}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Resume</span>
                    </button>
                  </div>
                )}

                {/* Cover Letter */}
                {application.cover_letter && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <MessageSquare className="h-8 w-8 text-green-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Cover Letter</h4>
                        <p className="text-sm text-gray-600">Text Document</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-32 overflow-y-auto">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {application.cover_letter.substring(0, 200)}
                        {application.cover_letter.length > 200 && '...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Portfolio */}
                {application.portfolio_url && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Globe className="h-8 w-8 text-purple-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Portfolio</h4>
                        <p className="text-sm text-gray-600">External Link</p>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(application.portfolio_url, '_blank')}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>View Portfolio</span>
                    </button>
                  </div>
                )}

                {/* Additional Documents Placeholder */}
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 mb-2">Additional Documents</h4>
                  <p className="text-sm text-gray-600">
                    No additional documents were submitted with this application
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Notes</h3>
                <p className="text-gray-600">Internal notes and feedback from the hiring team</p>
              </div>

              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No notes available</h4>
                <p className="text-gray-600">
                  Notes and feedback from the hiring team will appear here when available
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Application ID: #{application.id.slice(-8).toUpperCase()}
            </span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-600">
              Last updated: {new Date(application.updated_at).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {canWithdraw(application.status) ? (
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isWithdrawing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Withdrawing...</span>
                  </>
                ) : (
                  <span>Withdraw Application</span>
                )}
              </button>
            ) : (
              <div className="px-4 py-2 border border-gray-300 text-gray-500 rounded-lg bg-gray-50 font-medium cursor-not-allowed">
                Cannot Withdraw
              </div>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>

        {/* Withdraw Information */}
        {activeTab === 'overview' && (
          <div className="px-6 pb-4">
            <div className={`p-4 rounded-xl border ${
              canWithdraw(application.status) 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start space-x-3">
                <AlertCircle className={`h-5 w-5 mt-0.5 ${
                  canWithdraw(application.status) ? 'text-yellow-600' : 'text-gray-400'
                }`} />
                <div>
                  <h4 className={`font-medium ${
                    canWithdraw(application.status) ? 'text-yellow-800' : 'text-gray-700'
                  }`}>
                    Withdrawal Status
                  </h4>
                  <p className={`text-sm mt-1 ${
                    canWithdraw(application.status) ? 'text-yellow-700' : 'text-gray-600'
                  }`}>
                    {getWithdrawMessage(application.status)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplicationDetailsModal;
export { JobApplicationDetailsModal };