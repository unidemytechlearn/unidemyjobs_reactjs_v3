import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Video, AlertTriangle, Check, Mail, History } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { rescheduleInterview, getInterviewTypes } from '../lib/interviews';

interface InterviewRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: any;
  onSuccess?: () => void;
}

const InterviewRescheduleModal = ({ isOpen, onClose, interview, onSuccess }: InterviewRescheduleModalProps) => {
  const { user } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRescheduled, setIsRescheduled] = useState(false);
  const [error, setError] = useState('');
  const [interviewTypes, setInterviewTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleHistory, setRescheduleHistory] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    newDate: '',
    newTime: '10:00',
    duration: 60,
    location: '',
    meetingLink: '',
    reason: '',
    notes: '',
    sendNotification: true,
  });

  // Load interview types and set initial form data
  useEffect(() => {
    if (!isOpen || !interview) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const types = await getInterviewTypes();
        setInterviewTypes(types);
        
        // Set form data from current interview
        const currentDate = new Date(interview.scheduled_date);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        setFormData({
          newDate: tomorrow.toISOString().split('T')[0],
          newTime: currentDate.toTimeString().slice(0, 5),
          duration: interview.duration_minutes || 60,
          location: interview.location || '',
          meetingLink: interview.meeting_link || '',
          reason: '',
          notes: interview.notes || '',
          sendNotification: true,
        });
        
        // Load reschedule history (mock data for now)
        setRescheduleHistory([
          {
            id: 1,
            original_date: interview.scheduled_date,
            reason: 'Initial scheduling',
            changed_by: 'System',
            changed_at: interview.created_at
          }
        ]);
        
      } catch (error) {
        console.error('Error loading interview data:', error);
        setError('Failed to load interview data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, interview]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
    
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.newDate) {
      setError('Please select a new date for the interview');
      return false;
    }
    if (!formData.newTime) {
      setError('Please select a new time for the interview');
      return false;
    }
    if (!formData.reason.trim()) {
      setError('Please provide a reason for rescheduling');
      return false;
    }
    
    // Validate that the new date is in the future
    const newDateTime = new Date(`${formData.newDate}T${formData.newTime}`);
    if (newDateTime <= new Date()) {
      setError('New interview time must be in the future');
      return false;
    }
    
    // Validate that the new date is different from current
    const currentDateTime = new Date(interview.scheduled_date);
    if (newDateTime.getTime() === currentDateTime.getTime()) {
      setError('Please select a different date and time');
      return false;
    }
    
    // For video interviews, require a meeting link
    if (interview.interview_type === 'video' && !formData.meetingLink.trim()) {
      setError('Please provide a meeting link for the video interview');
      return false;
    }
    
    // For in-person interviews, require a location
    if (interview.interview_type === 'in_person' && !formData.location.trim()) {
      setError('Please provide a location for the in-person interview');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user || !interview) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Combine date and time
      const newDateTime = new Date(`${formData.newDate}T${formData.newTime}`);
      
      await rescheduleInterview(
        interview.id,
        newDateTime.toISOString(),
        user.id,
        formData.sendNotification
      );
      
      setIsRescheduled(true);
      setTimeout(() => {
        onSuccess?.();
        resetModal();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setIsRescheduled(false);
    setError('');
    setFormData({
      newDate: '',
      newTime: '10:00',
      duration: 60,
      location: '',
      meetingLink: '',
      reason: '',
      notes: '',
      sendNotification: true,
    });
    onClose();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  if (isRescheduled) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Interview Rescheduled!</h3>
          <p className="text-gray-600 mb-6">
            The interview has been successfully rescheduled and the candidate has been notified.
          </p>
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Updating calendar...</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Reschedule Interview</h2>
              <p className="text-gray-600">
                {interview?.application?.job?.title} - {interview?.application?.first_name} {interview?.application?.last_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Current Interview Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Interview Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">
                {formatDateTime(interview?.scheduled_date)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">{interview?.duration_minutes || 60} minutes</span>
            </div>
            {interview?.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">{interview.location}</span>
              </div>
            )}
            {interview?.meeting_link && (
              <div className="flex items-center space-x-2">
                <Video className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">Video call scheduled</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading interview details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Reason for Rescheduling */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rescheduling *
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Please explain why you need to reschedule this interview..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              {/* New Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="date"
                      name="newDate"
                      value={formData.newDate}
                      onChange={handleInputChange}
                      min={today}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="time"
                      name="newTime"
                      value={formData.newTime}
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

              {/* Location or Meeting Link based on interview type */}
              {interview?.interview_type === 'in_person' ? (
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
                      placeholder="Enter the new interview location"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={interview?.interview_type === 'in_person'}
                    />
                  </div>
                </div>
              ) : interview?.interview_type === 'video' ? (
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
                      required={interview?.interview_type === 'video'}
                    />
                  </div>
                </div>
              ) : null}

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional information for the candidate..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
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
                  Send email notification to candidate about the schedule change
                </label>
              </div>

              {/* Preview */}
              {formData.newDate && formData.newTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">New Interview Schedule</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <Calendar className="h-4 w-4 inline mr-2 text-gray-500" />
                      {formatDateTime(`${formData.newDate}T${formData.newTime}`)}
                    </p>
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
                        Video call updated
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

              {/* Reschedule History */}
              {rescheduleHistory.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <History className="h-4 w-4 mr-2" />
                    Schedule History
                  </h4>
                  <div className="space-y-2">
                    {rescheduleHistory.map((entry, index) => (
                      <div key={entry.id || index} className="text-sm text-gray-600">
                        <span className="font-medium">
                          {formatDateTime(entry.original_date)}
                        </span>
                        {entry.reason && entry.reason !== 'Initial scheduling' && (
                          <span className="ml-2">- {entry.reason}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <AlertTriangle className="h-4 w-4 inline mr-1 text-yellow-500" />
            Rescheduling will notify the candidate and update all calendar entries
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || loading}
              className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Rescheduling...</span>
                </>
              ) : (
                <span>Reschedule Interview</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRescheduleModal;