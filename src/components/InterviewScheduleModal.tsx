import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Video, Users, MessageSquare, Check, AlertCircle, Mail } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { scheduleInterview, getInterviewTypes, getApplicationById } from '../lib/interviews';
import { getJobs } from '../lib/supabase';

interface InterviewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  application?: any;
  applicationId?: string;
  jobId?: string;
  onSuccess?: () => void;
}

const InterviewScheduleModal = ({ isOpen, onClose, application, applicationId, jobId, onSuccess }: InterviewScheduleModalProps) => {
  const { user } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [error, setError] = useState('');
  const [interviewTypes, setInterviewTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>('');
  const [loadingApplications, setLoadingApplications] = useState(false);
  
  const [formData, setFormData] = useState({
    interviewType: '',
    scheduledDate: '',
    scheduledTime: '10:00',
    duration: 60,
    location: '',
    meetingLink: '',
    notes: '',
    sendNotification: true,
  });

  // Load applications for selection if no specific application is provided
  useEffect(() => {
    const loadApplications = async () => {
      if (!user || !isOpen) return;
      
      // If we already have a specific application, no need to load others
      if (application || applicationId) {
        if (applicationId) {
          setSelectedApplicationId(applicationId);
        }
        return;
      }
      
      try {
        setLoadingApplications(true);
        
        // Import dynamically to avoid circular dependencies
        const { getEmployerApplications } = await import('../lib/employer');
        
        // Get applications for this employer
        const filters: any = {};
        if (jobId) filters.jobId = jobId;
        
        const applicationsData = await getEmployerApplications(user.id, filters);
        setApplications(applicationsData);
        
        // Set the first application as selected if available
        if (applicationsData.length > 0) {
          setSelectedApplicationId(applicationsData[0].id);
        }
      } catch (error) {
        console.error('Error loading applications:', error);
        setError('Failed to load applications. Please try again.');
      } finally {
        setLoadingApplications(false);
      }
    };
    
    loadApplications();
  }, [isOpen, user, application, applicationId, jobId]);

  // Load application details when selectedApplicationId changes
  useEffect(() => {
    const loadApplicationDetails = async () => {
      if (!selectedApplicationId || !isOpen) return;
      
      try {
        const appDetails = await getApplicationById(selectedApplicationId);
        if (appDetails) {
          console.log("Loaded application details:", appDetails);
        }
      } catch (error) {
        console.error('Error loading application details:', error);
      }
    };
    
    loadApplicationDetails();
  }, [selectedApplicationId, isOpen]);

  // Load interview types
  useEffect(() => {
    if (!isOpen) return;
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const loadInterviewTypes = async () => {
      try {
        setLoading(true);
        const types = await getInterviewTypes();
        setInterviewTypes(types);
        // Set default interview type
        if (types.length > 0) {
          setFormData(prev => ({
            ...prev, 
            interviewType: types[0].id,
            scheduledDate: tomorrowStr,
            scheduledTime: '10:00'
          }));
        }
      } catch (error) {
        console.error('Error loading interview types:', error);
        setError('Failed to load interview types. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadInterviewTypes();
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleApplicationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedApplicationId(e.target.value);
  };

  const validateForm = () => {
    if (!selectedApplicationId && !application?.id) {
      setError('Please select an application');
      return false;
    }
    
    if (!formData.interviewType) {
      setError('Please select an interview type');
      return false;
    }
    if (!formData.scheduledDate) {
      setError('Please select a date for the interview');
      return false;
    }
    if (!formData.scheduledTime) {
      setError('Please select a time for the interview');
      return false;
    }
    
    // Validate that the date is in the future
    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      setError('Interview must be scheduled in the future');
      return false;
    }
    
    // For video interviews, require a meeting link
    if (formData.interviewType === 'video' && !formData.meetingLink) {
      setError('Please provide a meeting link for the video interview');
      return false;
    }
    
    // For in-person interviews, require a location
    if (formData.interviewType === 'in_person' && !formData.location) {
      setError('Please provide a location for the in-person interview');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      if (!application) {
        setError("No application selected. Please try again.");
      }
      return;
    }
    
    if (!application?.id) {
      setError("Application data is missing. Please try again.");
      return;
    }
    
    if (!user) {
      setError("Missing user or application data. Please try again.");
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    // Determine which application ID to use
    const appId = application?.id || selectedApplicationId;
    
    if (!appId) {
      setError('No application selected');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Combine date and time
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      
      // Create interview schedule
      const interviewData = {
        application_id: appId,
        interview_type: formData.interviewType,
        scheduled_date: scheduledDateTime.toISOString(),
        duration_minutes: formData.duration,
        location: formData.location,
        meeting_link: formData.meetingLink,
        notes: formData.notes,
        status: 'scheduled',
        created_by: user.id,
        send_notification: formData.sendNotification
      };
      
      await scheduleInterview(interviewData);

      setIsScheduled(true);
      setTimeout(() => {
        onSuccess?.();
        resetModal();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to schedule interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setIsScheduled(false);
    setError('');
    setFormData({
      interviewType: interviewTypes.length > 0 ? interviewTypes[0].id : '',
      scheduledDate: '',
      scheduledTime: '10:00',
      duration: 60,
      location: '',
      meetingLink: '',
      notes: '',
      sendNotification: true,
    });
    onClose();
  };

  if (!isOpen) {
    console.log("Modal is not open, returning null");
    return null;
  }

  // Get current date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];
  
  // Get interview type details
  const selectedInterviewType = interviewTypes.find(type => type.id === formData.interviewType);

  if (isScheduled) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Interview Scheduled!</h3>
          <p className="text-gray-600 mb-6">
            The interview has been successfully scheduled and the candidate has been notified.
          </p>
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Updating application status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Schedule Interview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading interview options...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Application Selection - only show if no specific application is provided */}
              {!application && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Candidate/Application *
                  </label>
                  {loadingApplications ? (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading applications...</span>
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                      <p>No applications available. Please create a job and receive applications first.</p>
                    </div>
                  ) : (
                    <select
                      value={selectedApplicationId}
                      onChange={handleApplicationChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select an application</option>
                      {applications.map((app) => (
                        <option key={app.id} value={app.id}>
                          {app.first_name} {app.last_name} - {app.job?.title || 'Unknown Job'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Interview Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {interviewTypes.map((type) => (
                    <label
                      key={type.id}
                      className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all 
                        ${formData.interviewType === type.id
                          ? 'border-2 border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <input
                        type="radio"
                        name="interviewType"
                        value={type.id}
                        checked={formData.interviewType === type.id}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: type.color || '#3B82F6' }}
                        >
                          {type.id === 'phone' && <Phone className="h-5 w-5" />}
                          {type.id === 'video' && <Video className="h-5 w-5" />}
                          {type.id === 'technical' && <Code className="h-5 w-5" />}
                          {type.id === 'panel' && <Users className="h-5 w-5" />}
                          {type.id === 'in_person' && <Building className="h-5 w-5" />}
                          {type.id === 'final' && <CheckCircle className="h-5 w-5" />}
                          {!['phone', 'video', 'technical', 'panel', 'in_person', 'final'].includes(type.id) && 
                            <Calendar className="h-5 w-5" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{type.name}</p>
                          <p className="text-xs text-gray-500">{type.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleInputChange}
                      min={today}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="time"
                      name="scheduledTime"
                      value={formData.scheduledTime}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              {/* Location or Meeting Link */}
              {formData.interviewType === 'in_person' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Enter the interview location"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={formData.interviewType === 'in_person'}
                    />
                  </div>
                </div>
              ) : formData.interviewType === 'video' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Link *
                  </label>
                  <div className="relative">
                    <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="url"
                      name="meetingLink"
                      value={formData.meetingLink}
                      onChange={handleInputChange}
                      placeholder="https://meet.google.com/... or https://zoom.us/..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={formData.interviewType === 'video'}
                    />
                  </div>
                </div>
              ) : null}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes for Candidate
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Add any additional information or instructions for the candidate..."
                    rows={4}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Notification Option */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendNotification"
                  name="sendNotification"
                  checked={formData.sendNotification}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="sendNotification" className="ml-2 text-sm text-gray-700">
                  Send email notification to candidate
                </label>
              </div>

              {/* Preview */}
              {selectedInterviewType && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Interview Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" 
                           style={{ backgroundColor: selectedInterviewType?.color || '#3B82F6' }}>
                        <div className="flex items-center justify-center h-full">
                          {selectedInterviewType?.id === 'phone' ? <Phone className="h-3 w-3 text-white" /> : 
                           selectedInterviewType?.id === 'video' ? <Video className="h-3 w-3 text-white" /> : 
                           selectedInterviewType?.id === 'technical' ? <Code className="h-3 w-3 text-white" /> : 
                           selectedInterviewType?.id === 'panel' ? <Users className="h-3 w-3 text-white" /> : 
                           selectedInterviewType?.id === 'in_person' ? <Building className="h-3 w-3 text-white" /> : 
                           selectedInterviewType?.id === 'final' ? <CheckCircle className="h-3 w-3 text-white" /> : 
                           <Calendar className="h-3 w-3 text-white" />
                          }
                        </div>
                      </div>
                      <span className="font-medium">{selectedInterviewType?.name || 'Interview'}</span>
                    </div>
                    {formData.scheduledDate && formData.scheduledTime && (
                      <p>
                        <Calendar className="h-4 w-4 inline mr-2 text-gray-500" />
                        {new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric'
                        })}
                      </p>
                    )}
                    <p>
                      <Clock className="h-4 w-4 inline mr-2 text-gray-500" />
                      {formData.duration} minutes
                    </p>
                    {formData.location && (
                      <p>
                        <MapPin className="h-4 w-4 inline mr-2 text-gray-500" />
                        {formData.location}
                      </p>
                    )}
                    {formData.meetingLink && (
                      <p>
                        <Video className="h-4 w-4 inline mr-2 text-gray-500" />
                        <a href={formData.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {formData.meetingLink}
                        </a>
                      </p>
                    )}
                    {formData.sendNotification && (
                      <p className="text-green-600">
                        <Mail className="h-4 w-4 inline mr-2" />
                        Candidate will be notified
                      </p>
                    )}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Scheduling...</span>
              </>
            ) : (
              <span>Schedule Interview</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduleModal;

function Phone(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
}

function Building(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white" {...props}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>;
}

function Code(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white" {...props}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>;
}

function CheckCircle(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
}