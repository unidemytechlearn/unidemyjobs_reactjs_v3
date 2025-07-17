import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Video, Users, FileText, Plus, Minus, Check, AlertTriangle } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { getInterviewTypes, scheduleInterview } from '../lib/interviews';

interface InterviewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  jobTitle: string;
  candidateName: string;
  onSuccess?: () => void;
}

const InterviewScheduleModal = ({ 
  isOpen, 
  onClose, 
  applicationId, 
  jobTitle, 
  candidateName,
  onSuccess 
}: InterviewScheduleModalProps) => {
  const { user } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [interviewTypes, setInterviewTypes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [interviewers, setInterviewers] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    type: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    meetingLink: '',
    notes: '',
    selectedInterviewers: [] as string[]
  });

  // Load interview types
  useEffect(() => {
    const loadInterviewTypes = async () => {
      try {
        const types = await getInterviewTypes();
        setInterviewTypes(types);
        if (types.length > 0) {
          setFormData(prev => ({ ...prev, type: types[0].id }));
        }
      } catch (error) {
        console.error('Error loading interview types:', error);
        setError('Failed to load interview types. Please try again.');
      }
    };

    if (isOpen) {
      loadInterviewTypes();
      // Reset form data when modal opens
      setFormData({
        type: '',
        date: '',
        time: '',
        duration: 60,
        location: '',
        meetingLink: '',
        notes: '',
        selectedInterviewers: []
      });
      setIsScheduled(false);
      setError(null);
    }
  }, [isOpen]);

  // Load team members who can be interviewers
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        // In a real implementation, you would fetch team members from your database
        // For now, we'll use mock data
        setInterviewers([
          { id: '1', name: 'Sarah Johnson (HR Director)' },
          { id: '2', name: 'Michael Chen (Engineering Lead)' },
          { id: '3', name: 'Emily Rodriguez (Product Manager)' },
          { id: '4', name: 'David Kim (Senior Developer)' }
        ]);
      } catch (error) {
        console.error('Error loading team members:', error);
      }
    };

    if (isOpen) {
      loadTeamMembers();
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleInterviewer = (interviewerId: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedInterviewers.includes(interviewerId);
      return {
        ...prev,
        selectedInterviewers: isSelected
          ? prev.selectedInterviewers.filter(id => id !== interviewerId)
          : [...prev.selectedInterviewers, interviewerId]
      };
    });
  };

  const validateForm = () => {
    if (!formData.type) {
      setError('Please select an interview type');
      return false;
    }
    if (!formData.date) {
      setError('Please select a date for the interview');
      return false;
    }
    if (!formData.time) {
      setError('Please select a time for the interview');
      return false;
    }
    if (formData.duration < 15) {
      setError('Interview duration must be at least 15 minutes');
      return false;
    }
    
    // Check if the interview is in the past
    const interviewDate = new Date(`${formData.date}T${formData.time}`);
    if (interviewDate < new Date()) {
      setError('Interview cannot be scheduled in the past');
      return false;
    }
    
    // For video interviews, meeting link is required
    if (formData.type === 'video' && !formData.meetingLink) {
      setError('Please provide a meeting link for video interviews');
      return false;
    }
    
    // For onsite interviews, location is required
    if (formData.type === 'onsite' && !formData.location) {
      setError('Please provide a location for onsite interviews');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user) {
      setError('You must be logged in to schedule interviews');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Combine date and time into a single datetime
      const scheduledAt = new Date(`${formData.date}T${formData.time}`);
      
      await scheduleInterview(
        applicationId,
        {
          type: formData.type,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: formData.duration,
          location: formData.location || undefined,
          meeting_link: formData.meetingLink || undefined,
          notes: formData.notes || undefined
        },
        formData.selectedInterviewers,
        user.id
      );
      
      setIsScheduled(true);
      
      // Call onSuccess callback after a delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error scheduling interview:', error);
      setError('Failed to schedule interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Success state
  if (isScheduled) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Interview Scheduled!</h3>
          <p className="text-gray-600 mb-6">
            The interview for {candidateName} has been scheduled successfully. 
            Notifications have been sent to all participants.
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
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Schedule Interview</h2>
            <p className="text-gray-600">
              For {candidateName} • {jobTitle}
            </p>
          </div>
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
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Interview Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select interview type</option>
                {interviewTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {interviewTypes.find(t => t.id === formData.type)?.description || ''}
              </p>
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
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
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
                    name="time"
                    value={formData.time}
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
                Duration (minutes) *
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, duration: Math.max(15, prev.duration - 15) }))}
                  className="p-2 bg-gray-100 rounded-l-lg border border-gray-200 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="15"
                  step="15"
                  className="w-24 py-2 px-3 text-center border-t border-b border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, duration: prev.duration + 15 }))}
                  className="p-2 bg-gray-100 rounded-r-lg border border-gray-200 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <div className="ml-4 flex space-x-2">
                  {[30, 45, 60, 90].map(duration => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, duration }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        formData.duration === duration
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {duration} min
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Location or Meeting Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location {formData.type === 'onsite' && '*'}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Office address or meeting room"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={formData.type === 'onsite'}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Link {formData.type === 'video' && '*'}
                </label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="url"
                    name="meetingLink"
                    value={formData.meetingLink}
                    onChange={handleInputChange}
                    placeholder="Zoom, Google Meet, or Teams link"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={formData.type === 'video'}
                  />
                </div>
              </div>
            </div>

            {/* Interviewers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interviewers
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-48 overflow-y-auto">
                {interviewers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No team members available</p>
                ) : (
                  <div className="space-y-2">
                    {interviewers.map(interviewer => (
                      <div 
                        key={interviewer.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                            <Users className="h-4 w-4" />
                          </div>
                          <span className="text-gray-700">{interviewer.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleInterviewer(interviewer.id)}
                          className={`p-2 rounded-full ${
                            formData.selectedInterviewers.includes(interviewer.id)
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {formData.selectedInterviewers.includes(interviewer.id) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Selected interviewers will receive notifications about this interview
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional information about the interview"
                  rows={4}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                These notes will be visible to both the candidate and interviewers
              </p>
            </div>
          </form>
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
            disabled={isSubmitting}
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