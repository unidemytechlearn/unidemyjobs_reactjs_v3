import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Video, Users, FileText, Check, AlertTriangle, ExternalLink, Edit, Trash2, MessageSquare, Star, Download, Mail, Phone, Building, User, ChevronRight, RefreshCw } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { getInterviewDetails, updateInterview, cancelInterview, rescheduleInterview, completeInterview, submitInterviewFeedback } from '../lib/interviews';

interface InterviewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  interviewId: string;
  onUpdate?: () => void;
}

const InterviewDetailsModal = ({ 
  isOpen, 
  onClose, 
  interviewId,
  onUpdate
}: InterviewDetailsModalProps) => {
  const { user, profile } = useAuthContext();
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'participants' | 'feedback'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    rating: 3,
    strengths: '',
    weaknesses: '',
    notes: '',
    recommendation: 'maybe' as 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no',
    is_visible_to_candidate: false
  });
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    date: '',
    time: '',
    duration: 60,
    location: '',
    meetingLink: '',
    notes: ''
  });

  // Load interview details
  useEffect(() => {
    const loadInterview = async () => {
      if (!interviewId || !isOpen) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const interviewDetails = await getInterviewDetails(interviewId);
        if (!interviewDetails) {
          setError('Interview not found');
          return;
        }
        
        setInterview(interviewDetails);
        
        // Initialize reschedule form with current values
        const scheduledDate = new Date(interviewDetails.scheduled_at);
        setRescheduleData({
          date: scheduledDate.toISOString().split('T')[0],
          time: scheduledDate.toTimeString().slice(0, 5),
          duration: interviewDetails.duration_minutes,
          location: interviewDetails.location || '',
          meetingLink: interviewDetails.meeting_link || '',
          notes: interviewDetails.notes || ''
        });
      } catch (err) {
        console.error('Error loading interview details:', err);
        setError('Failed to load interview details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadInterview();
  }, [interviewId, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (showFeedbackForm) {
      setFeedbackData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    } else if (showRescheduleForm) {
      setRescheduleData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCancelInterview = async () => {
    if (!interview || !user) return;
    
    const confirmed = window.confirm('Are you sure you want to cancel this interview? This action cannot be undone.');
    if (!confirmed) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await cancelInterview(interview.id, 'Cancelled by employer');
      onUpdate?.();
      onClose();
    } catch (err) {
      console.error('Error cancelling interview:', err);
      setError('Failed to cancel interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteInterview = async () => {
    if (!interview || !user) return;
    
    const confirmed = window.confirm('Are you sure you want to mark this interview as completed?');
    if (!confirmed) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await completeInterview(interview.id);
      onUpdate?.();
      
      // Refresh interview data
      const updatedInterview = await getInterviewDetails(interview.id);
      setInterview(updatedInterview);
      
      // Show feedback form
      setShowFeedbackForm(true);
    } catch (err) {
      console.error('Error completing interview:', err);
      setError('Failed to complete interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!interview || !user) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Combine date and time
      const scheduledAt = new Date(`${rescheduleData.date}T${rescheduleData.time}`);
      
      // Validate date is in the future
      if (scheduledAt < new Date()) {
        setError('Interview cannot be scheduled in the past');
        setIsSubmitting(false);
        return;
      }
      
      await rescheduleInterview(interview.id, {
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: rescheduleData.duration,
        location: rescheduleData.location || undefined,
        meeting_link: rescheduleData.meetingLink || undefined,
        notes: rescheduleData.notes || undefined
      });
      
      // Refresh interview data
      const updatedInterview = await getInterviewDetails(interview.id);
      setInterview(updatedInterview);
      
      // Hide reschedule form
      setShowRescheduleForm(false);
      
      // Call onUpdate callback
      onUpdate?.();
    } catch (err) {
      console.error('Error rescheduling interview:', err);
      setError('Failed to reschedule interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!interview || !user) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await submitInterviewFeedback(
        interview.id,
        user.id,
        feedbackData
      );
      
      // Refresh interview data
      const updatedInterview = await getInterviewDetails(interview.id);
      setInterview(updatedInterview);
      
      // Hide feedback form
      setShowFeedbackForm(false);
      
      // Call onUpdate callback
      onUpdate?.();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'scheduled': 'bg-blue-100 text-blue-700 border-blue-200',
      'confirmed': 'bg-green-100 text-green-700 border-green-200',
      'in_progress': 'bg-purple-100 text-purple-700 border-purple-200',
      'completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'cancelled': 'bg-red-100 text-red-700 border-red-200',
      'rescheduled': 'bg-amber-100 text-amber-700 border-amber-200',
      'no_show': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getInterviewTypeName = (type: string) => {
    const typeNames: Record<string, string> = {
      'phone': 'Phone Interview',
      'video': 'Video Interview',
      'technical': 'Technical Interview',
      'behavioral': 'Behavioral Interview',
      'panel': 'Panel Interview',
      'onsite': 'Onsite Interview',
      'final': 'Final Interview'
    };
    return typeNames[type] || type;
  };

  const getRecommendationText = (recommendation: string) => {
    const recommendations: Record<string, string> = {
      'strong_yes': 'Strong Yes',
      'yes': 'Yes',
      'maybe': 'Maybe',
      'no': 'No',
      'strong_no': 'Strong No'
    };
    return recommendations[recommendation] || recommendation;
  };

  const getRecommendationColor = (recommendation: string) => {
    const colors: Record<string, string> = {
      'strong_yes': 'bg-green-100 text-green-700 border-green-200',
      'yes': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'maybe': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'no': 'bg-red-100 text-red-700 border-red-200',
      'strong_no': 'bg-rose-100 text-rose-700 border-rose-200'
    };
    return colors[recommendation] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          {loading ? (
            <div className="flex-1">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : error ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Interview Details</h2>
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(interview.status)}`}>
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {getInterviewTypeName(interview.type)}
                </h2>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                    {interview.status_details?.name || interview.status}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-600">
                    {formatDate(interview.scheduled_at)} at {formatTime(interview.scheduled_at)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Details</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'participants'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Participants</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'feedback'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Feedback</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading interview details...</span>
            </div>
          ) : error && !interview ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Interview</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-8">
                  {/* Interview Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Interview Information</h3>
                    
                    {showRescheduleForm ? (
                      <form onSubmit={handleRescheduleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Date *
                            </label>
                            <input
                              type="date"
                              name="date"
                              value={rescheduleData.date}
                              onChange={handleInputChange}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Time *
                            </label>
                            <input
                              type="time"
                              name="time"
                              value={rescheduleData.time}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration (minutes) *
                          </label>
                          <input
                            type="number"
                            name="duration"
                            value={rescheduleData.duration}
                            onChange={handleInputChange}
                            min="15"
                            step="15"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Location
                            </label>
                            <input
                              type="text"
                              name="location"
                              value={rescheduleData.location}
                              onChange={handleInputChange}
                              placeholder="Office address or meeting room"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Meeting Link
                            </label>
                            <input
                              type="url"
                              name="meetingLink"
                              value={rescheduleData.meetingLink}
                              onChange={handleInputChange}
                              placeholder="Zoom, Google Meet, or Teams link"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                          </label>
                          <textarea
                            name="notes"
                            value={rescheduleData.notes}
                            onChange={handleInputChange}
                            placeholder="Additional information about the interview"
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          ></textarea>
                        </div>

                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowRescheduleForm(false)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            {isSubmitting ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4" />
                                <span>Reschedule</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-500">Interview Type</p>
                              <p className="font-medium text-gray-900">{getInterviewTypeName(interview.type)}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500">Date & Time</p>
                              <p className="font-medium text-gray-900">
                                {formatDate(interview.scheduled_at)} at {formatTime(interview.scheduled_at)}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500">Duration</p>
                              <p className="font-medium text-gray-900">{interview.duration_minutes} minutes</p>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            {interview.location && (
                              <div>
                                <p className="text-sm text-gray-500">Location</p>
                                <p className="font-medium text-gray-900">{interview.location}</p>
                              </div>
                            )}
                            
                            {interview.meeting_link && (
                              <div>
                                <p className="text-sm text-gray-500">Meeting Link</p>
                                <a
                                  href={interview.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                >
                                  <span>Join Meeting</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                            
                            <div>
                              <p className="text-sm text-gray-500">Status</p>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                                {interview.status_details?.name || interview.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {interview.notes && (
                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-500 mb-2">Notes</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{interview.notes}</p>
                          </div>
                        )}
                        
                        {/* Actions */}
                        {['scheduled', 'confirmed'].includes(interview.status) && (
                          <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                            <button
                              onClick={() => setShowRescheduleForm(true)}
                              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center space-x-2"
                            >
                              <RefreshCw className="h-4 w-4" />
                              <span>Reschedule</span>
                            </button>
                            
                            <button
                              onClick={handleCompleteInterview}
                              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-2"
                            >
                              <Check className="h-4 w-4" />
                              <span>Mark as Completed</span>
                            </button>
                            
                            <button
                              onClick={handleCancelInterview}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
                            >
                              <X className="h-4 w-4" />
                              <span>Cancel Interview</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Candidate Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Candidate Information</h3>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8" />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-900">
                          {interview.application?.first_name} {interview.application?.last_name}
                        </h4>
                        <p className="text-gray-600">{interview.application?.job?.title} Applicant</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">{interview.application?.email}</span>
                          </div>
                          
                          {interview.application?.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">{interview.application?.phone}</span>
                            </div>
                          )}
                          
                          {interview.application?.job?.company && (
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">Applied at {interview.application.job.company.name}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 flex space-x-3">
                          <a
                            href={`/dashboard/applications/${interview.application_id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                          >
                            <span>View Application</span>
                            <ChevronRight className="h-4 w-4" />
                          </a>
                          
                          {interview.application?.resume_url && (
                            <a
                              href={interview.application.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                            >
                              <span>View Resume</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Job Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Job Information</h3>
                    
                    <div className="flex items-start space-x-4">
                      <img
                        src={interview.application?.job?.company?.logo_url || "https://images.pexels.com/photos/450035/pexels-photo-450035.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop"}
                        alt={interview.application?.job?.company?.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-900">
                          {interview.application?.job?.title}
                        </h4>
                        <p className="text-gray-600">{interview.application?.job?.company?.name}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">{interview.application?.job?.location}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">{interview.application?.job?.job_type}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <a
                            href={`/employer-dashboard/jobs/${interview.application?.job_id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                          >
                            <span>View Job Details</span>
                            <ChevronRight className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Participants Tab */}
              {activeTab === 'participants' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Participants</h3>
                  
                  {interview.participants && interview.participants.length > 0 ? (
                    <div className="space-y-4">
                      {interview.participants.map((participant: any) => (
                        <div 
                          key={participant.id}
                          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5" />
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {participant.user?.first_name} {participant.user?.last_name || ''}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {participant.role === 'candidate' ? 'Candidate' : 
                                   participant.role === 'interviewer' ? 'Interviewer' : 
                                   'Observer'}
                                </p>
                              </div>
                            </div>
                            
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              participant.status === 'confirmed' ? 'bg-green-100 text-green-700 border border-green-200' :
                              participant.status === 'declined' ? 'bg-red-100 text-red-700 border border-red-200' :
                              participant.status === 'attended' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                              participant.status === 'no_show' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                              'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            }`}>
                              {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                            </span>
                          </div>
                          
                          {participant.user?.email && (
                            <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span>{participant.user.email}</span>
                            </div>
                          )}
                          
                          {participant.notes && (
                            <div className="mt-3 text-sm text-gray-600">
                              <p className="font-medium">Notes:</p>
                              <p>{participant.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No participants found</h4>
                      <p className="text-gray-600">There are no participants added to this interview yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback Tab */}
              {activeTab === 'feedback' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Interview Feedback</h3>
                    
                    {interview.status === 'completed' && !showFeedbackForm && (
                      <button
                        onClick={() => setShowFeedbackForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Feedback</span>
                      </button>
                    )}
                  </div>
                  
                  {showFeedbackForm ? (
                    <form onSubmit={handleFeedbackSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
                      <h4 className="font-medium text-gray-900 mb-4">Provide Interview Feedback</h4>
                      
                      {/* Rating */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Overall Rating
                        </label>
                        <div className="flex items-center space-x-2">
                          {[1, 2, 3, 4, 5].map(rating => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setFeedbackData(prev => ({ ...prev, rating }))}
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                feedbackData.rating >= rating
                                  ? 'bg-yellow-100 text-yellow-600 border border-yellow-300'
                                  : 'bg-gray-100 text-gray-400 border border-gray-200 hover:bg-gray-200'
                              }`}
                            >
                              <Star className={`h-5 w-5 ${feedbackData.rating >= rating ? 'fill-current' : ''}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Recommendation */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Recommendation
                        </label>
                        <select
                          name="recommendation"
                          value={feedbackData.recommendation}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="strong_yes">Strong Yes - Exceptional candidate</option>
                          <option value="yes">Yes - Good fit for the role</option>
                          <option value="maybe">Maybe - Some concerns but potential</option>
                          <option value="no">No - Not a good fit</option>
                          <option value="strong_no">Strong No - Significant concerns</option>
                        </select>
                      </div>
                      
                      {/* Strengths */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Strengths
                        </label>
                        <textarea
                          name="strengths"
                          value={feedbackData.strengths}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="What were the candidate's strengths?"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        ></textarea>
                      </div>
                      
                      {/* Weaknesses */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Areas for Improvement
                        </label>
                        <textarea
                          name="weaknesses"
                          value={feedbackData.weaknesses}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="What areas could the candidate improve on?"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        ></textarea>
                      </div>
                      
                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Notes
                        </label>
                        <textarea
                          name="notes"
                          value={feedbackData.notes}
                          onChange={handleInputChange}
                          rows={4}
                          placeholder="Any additional comments or observations?"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        ></textarea>
                      </div>
                      
                      {/* Visibility */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_visible_to_candidate"
                          name="is_visible_to_candidate"
                          checked={feedbackData.is_visible_to_candidate}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_visible_to_candidate" className="ml-2 text-sm text-gray-700">
                          Make feedback visible to candidate
                        </label>
                      </div>
                      
                      {/* Buttons */}
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowFeedbackForm(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              <span>Submit Feedback</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : interview.feedback && interview.feedback.length > 0 ? (
                    <div className="space-y-4">
                      {interview.feedback.map((feedback: any) => (
                        <div 
                          key={feedback.id}
                          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5" />
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {feedback.evaluator?.first_name} {feedback.evaluator?.last_name || ''}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {new Date(feedback.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRecommendationColor(feedback.recommendation)}`}>
                                {getRecommendationText(feedback.recommendation)}
                              </span>
                              
                              {feedback.is_visible_to_candidate && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                  Visible to Candidate
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Rating */}
                          {feedback.rating && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-500 mb-1">Rating</p>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star 
                                    key={star}
                                    className={`h-5 w-5 ${star <= feedback.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                                  />
                                ))}
                                <span className="ml-2 text-gray-700">{feedback.rating}/5</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Strengths */}
                          {feedback.strengths && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-500 mb-1">Strengths</p>
                              <p className="text-gray-700">{feedback.strengths}</p>
                            </div>
                          )}
                          
                          {/* Weaknesses */}
                          {feedback.weaknesses && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-500 mb-1">Areas for Improvement</p>
                              <p className="text-gray-700">{feedback.weaknesses}</p>
                            </div>
                          )}
                          
                          {/* Notes */}
                          {feedback.notes && (
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
                              <p className="text-gray-700">{feedback.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h4>
                      <p className="text-gray-600">
                        {interview.status === 'completed' 
                          ? 'The interview has been completed. Add feedback to help with the hiring decision.'
                          : 'Feedback can be added once the interview is completed.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {interview && (
              <>
                Created {new Date(interview.created_at).toLocaleDateString()} • 
                Last updated {new Date(interview.updated_at).toLocaleDateString()}
              </>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetailsModal;