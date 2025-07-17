import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Video, Users, Building, Phone, CheckCircle, AlertTriangle, MoreHorizontal, Plus, Search, Filter, ChevronDown, ChevronUp, Star, MessageSquare, CheckSquare, XSquare } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { getEmployerInterviews, getInterviewTypes, getCandidateInterviews, getApplicationById, debug } from '../lib/interviews';
import InterviewScheduleModal from './InterviewScheduleModal';
import InterviewFeedbackModal from './InterviewFeedbackModal';

interface InterviewsTabProps {
  applicationId?: string;
  jobId?: string;
  onRefresh?: () => void;
}

const InterviewsTab = ({ applicationId, jobId, onRefresh }: InterviewsTabProps) => {
  const { user, profile } = useAuthContext();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [interviewTypes, setInterviewTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [loadingApplication, setLoadingApplication] = useState(false);

  // Load interviews
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        console.log('No user found, skipping interview data load');
        return;
      }
      
      try {
        setLoading(true);
        setError('');

        console.log('Loading interview data for user:', user.id);
        
        // Load interview types
        console.log('Loading interview types...');
        const types = await getInterviewTypes();
        console.log('Interview types loaded:', types.length);
        setInterviewTypes(types);

        // Then load interviews based on user role
        if (profile?.role === 'employer') {
          console.log('Loading employer interviews...');
          const filters: any = {};
          if (applicationId) filters.applicationId = applicationId;
          if (jobId) filters.jobId = jobId;
          
          console.log('Fetching employer interviews with filters:', filters);
          const interviewsData = await getEmployerInterviews(user.id, filters);
          console.log('Employer interviews loaded:', interviewsData.length);
          setInterviews(interviewsData);
        } else {
          // For job seekers
          console.log('Loading candidate interviews...');
          if (!user.id) {
            throw new Error('User ID is missing');
          }
          const filters: any = {};
          if (applicationId) filters.applicationId = applicationId;
          if (jobId) filters.jobId = jobId;
          
          try {
            const interviewsData = await getCandidateInterviews(user.id, filters);
            console.log('Candidate interviews loaded:', interviewsData);
            setInterviews(interviewsData || []);
          } catch (interviewError) {
            console.error('Error loading candidate interviews:', interviewError);
            setInterviews([]);
            setError('Failed to load interviews. Please try refreshing the page.');
          }
        }
      } catch (err: any) {
        console.error('Error loading interviews:', err);
        setError(err.message || 'Failed to load interviews. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, applicationId, jobId]);

  // Filter and sort interviews
  const filteredInterviews = interviews
    .filter(interview => {
      // Filter by status
      if (filterStatus !== 'all' && interview.status !== filterStatus) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const candidate = `${interview.application?.first_name} ${interview.application?.last_name}`.toLowerCase();
        const jobTitle = interview.application?.job?.title?.toLowerCase() || '';
        const company = interview.application?.job?.company?.name?.toLowerCase() || '';
        
        return (
          candidate.includes(searchTerm.toLowerCase()) ||
          jobTitle.includes(searchTerm.toLowerCase()) ||
          company.includes(searchTerm.toLowerCase())
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by selected field
      if (sortBy === 'date') {
        const dateA = new Date(a.scheduled_date).getTime();
        const dateB = new Date(b.scheduled_date).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      if (sortBy === 'candidate') {
        const candidateA = `${a.application?.first_name} ${a.application?.last_name}`.toLowerCase();
        const candidateB = `${b.application?.first_name} ${b.application?.last_name}`.toLowerCase();
        return sortDirection === 'asc'
          ? candidateA.localeCompare(candidateB)
          : candidateB.localeCompare(candidateA);
      }
      
      if (sortBy === 'job') {
        const jobA = a.application?.job?.title?.toLowerCase() || '';
        const jobB = b.application?.job?.title?.toLowerCase() || '';
        return sortDirection === 'asc'
          ? jobA.localeCompare(jobB)
          : jobB.localeCompare(jobA);
      }
      
      return 0;
    });

  const handleScheduleInterview = (application: any) => {
    setSelectedApplication(application);
    setIsScheduleModalOpen(true);
    console.log("Opening schedule modal with application:", application);
  };

  const handleScheduleButtonClick = async () => {
    if (!applicationId) {
      setError('Please select an application first to schedule an interview');
      console.error('No application ID provided for interview scheduling');
      return;
    }
    
    setLoadingApplication(true);
    try {
      // Fetch the application details first
      console.log('Fetching application details for interview scheduling, ID:', applicationId);
      const application = await getApplicationById(applicationId);
      if (application) {
        console.log("Fetched application for interview:", application);
        handleScheduleInterview(application);
      } else {
        console.error('Application not found for ID:', applicationId);
        setError('Could not find application details');
      }
    } catch (err) {
      console.error('Error fetching application for interview:', err);
      setError('Failed to load application details');
    } finally {
      setLoadingApplication(false);
    }
  };

  const handleAddFeedback = (interview: any) => {
    setSelectedInterview(interview);
    setIsFeedbackModalOpen(true);
  };

  const handleToggleDropdown = (interviewId: string) => {
    setActiveDropdown(activeDropdown === interviewId ? null : interviewId);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleInterviewSuccess = () => {
    // Reload interviews
    if (onRefresh) {
      onRefresh();
    } else {
      // Reload interviews directly
      if (user) {
        const filters: any = {};
        if (applicationId) filters.applicationId = applicationId;
        if (jobId) filters.jobId = jobId;
        
        getEmployerInterviews(user.id, filters)
          .then(data => setInterviews(data))
          .catch(err => console.error('Error reloading interviews:', err));
      }
    }
  };

  const getInterviewTypeDetails = (typeId: string) => {
    return interviewTypes.find(type => type.id === typeId) || {
      name: 'Interview',
      color: '#6B7280',
      icon: 'calendar'
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Calendar className="h-3 w-3 mr-1" />
            Scheduled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XSquare className="h-3 w-3 mr-1" />
            Cancelled
          </span>
        );
      case 'rescheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Rescheduled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getInterviewTypeIcon = (typeId: string) => {
    switch (typeId) {
      case 'phone':
        return <Phone className="h-5 w-5 text-white" />; 
      case 'video':
        return <Video className="h-5 w-5 text-white" />;
      case 'technical':
        return <Code className="h-5 w-5 text-white" />;
      case 'panel':
        return <Users className="h-5 w-5 text-white" />;
      case 'in_person':
        return <Building className="h-5 w-5 text-white" />;
      case 'final':
        return <CheckCircle className="h-5 w-5 text-white" />;
      default:
        return <Calendar className="h-5 w-5 text-white" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const isUpcoming = (dateString: string) => {
    const date = new Date(dateString);
    return date > new Date();
  };

  const isPast = (dateString: string) => {
    const date = new Date(dateString);
    return date < new Date();
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2 text-gray-600">Loading interviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Interviews</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">
          {applicationId 
            ? 'Interviews for This Application' 
            : jobId 
              ? 'Interviews for This Job' 
              : 'All Interviews'}
        </h2>
        
        <div className="flex items-center space-x-2">
          {profile?.role === 'employer' && (
            <button
              onClick={() => {
                if (applicationId) {
                  handleScheduleButtonClick();
                } else {
                  setError('Please select an application first to schedule an interview');
                }
              }}
              className={`flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                loadingApplication ? 'opacity-75 cursor-wait' : ''
              }`}
              disabled={!applicationId || loadingApplication}
            >
              {loadingApplication ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Schedule Interview</span>
                </>
              )}
            </button>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search candidates or jobs..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="date">Interview Date</option>
                  <option value="candidate">Candidate Name</option>
                  <option value="job">Job Title</option>
                </select>
                <button
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {sortDirection === 'asc' ? (
                    <ChevronUp className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interviews List */}
      {filteredInterviews.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Interviews Found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {applicationId
              ? "No interviews have been scheduled for this application yet."
              : jobId
              ? "No interviews have been scheduled for this job yet."
              : "No interviews match your current filters."}
          </p>
          {profile?.role === 'employer' && applicationId && (
            <button
              onClick={() => {
                // Find the application object
                handleScheduleButtonClick();
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule First Interview
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((interview) => {
            const typeDetails = getInterviewTypeDetails(interview.interview_type);
            const hasFeedback = interview.feedback && interview.feedback.length > 0;
            
            return (
              <div
                key={interview.id}
                className={`bg-white border border-gray-200 rounded-xl overflow-hidden transition-all ${
                  isToday(interview.scheduled_date)
                    ? 'ring-2 ring-blue-500'
                    : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: typeDetails.color || '#6B7280' }}
                      >
                        {getInterviewTypeIcon(interview.interview_type)}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{typeDetails.name}</h3>
                          {getStatusBadge(interview.status)}
                          {interview.scheduled_date && isToday(interview.scheduled_date) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Today
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm">
                          {interview.application?.job?.title} at {interview.application?.job?.company?.name}
                        </p>
                        
                        <p className="text-gray-600 text-sm">
                          Candidate: {interview.application?.first_name} {interview.application?.last_name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {interview.scheduled_date ? formatDate(interview.scheduled_date) : 'Date not set'}
                        </div>
                        <div className="text-gray-600 text-sm">
                          {interview.scheduled_date ? formatTime(interview.scheduled_date) : 'Time not set'} • {interview.duration_minutes || 60} min
                        </div>
                      </div>
                      
                      <div className="relative">
                        <button
                          onClick={() => handleToggleDropdown(interview.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        
                        {activeDropdown === interview.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            {profile?.role === 'employer' && interview.status === 'scheduled' && isPast(interview.scheduled_date) && (
                              <button
                                onClick={() => handleAddFeedback(interview)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Add Feedback
                              </button>
                            )}
                            
                            {profile?.role === 'employer' && interview.status === 'scheduled' && isUpcoming(interview.scheduled_date) && (
                              <>
                                <button
                                  onClick={() => {/* TODO: Implement reschedule */}}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                                >
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => {/* TODO: Implement cancel */}}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
                                >
                                  <XSquare className="h-4 w-4 mr-2" />
                                  Cancel
                                </button>
                              </>
                            )}
                            
                            {interview.status === 'scheduled' && isPast(interview.scheduled_date) && (
                              <button
                                onClick={() => {/* TODO: Implement mark as completed */}}
                                className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors flex items-center"
                              >
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Mark as Completed
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {interview.location && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{interview.location}</span>
                      </div>
                    )}
                    
                    {interview.meeting_link && (
                      <div className="flex items-center text-gray-600">
                        <Video className="h-4 w-4 mr-2 flex-shrink-0" />
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
                    
                    {interview.interviewer_ids && interview.interviewer_ids.length > 0 && (
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{interview.interviewer_ids.length} interviewers</span>
                      </div>
                    )}
                  </div>
                  
                  {interview.notes && (
                    <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                      <p className="font-medium text-gray-700 mb-1">Notes:</p>
                      <p>{interview.notes}</p>
                    </div>
                  )}
                  
                  {hasFeedback && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Feedback</h4>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className="h-4 w-4"
                              fill={interview.feedback[0].rating >= star ? '#FBBF24' : 'none'}
                              stroke={interview.feedback[0].rating >= star ? '#FBBF24' : '#D1D5DB'}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {interview.feedback[0].recommendation && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium text-gray-700">Recommendation: </span>
                          <span className={`
                            ${interview.feedback[0].recommendation === 'strong_yes' ? 'text-green-600' : ''}
                            ${interview.feedback[0].recommendation === 'yes' ? 'text-green-600' : ''}
                            ${interview.feedback[0].recommendation === 'maybe' ? 'text-yellow-600' : ''}
                            ${interview.feedback[0].recommendation === 'no' ? 'text-red-600' : ''}
                            ${interview.feedback[0].recommendation === 'strong_no' ? 'text-red-600' : ''}
                          `}>
                            {interview.feedback[0].recommendation === 'strong_yes' && 'Strong Yes'}
                            {interview.feedback[0].recommendation === 'yes' && 'Yes'}
                            {interview.feedback[0].recommendation === 'maybe' && 'Maybe'}
                            {interview.feedback[0].recommendation === 'no' && 'No'} 
                            {interview.feedback[0].recommendation === 'strong_no' && 'Strong No'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {selectedApplication && (
        <InterviewScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          application={selectedApplication}
          onSuccess={handleInterviewSuccess}
        />
      )}
      
      {selectedInterview && (
        <InterviewFeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          interview={selectedInterview}
          onSuccess={handleInterviewSuccess}
        />
      )}
    </div>
  );
};

export default InterviewsTab;

// Import these components from lucide-react
function Code(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>;
}