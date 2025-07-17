import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Plus, Video, MapPin, User, Building } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { getInterviewsForCandidate, getInterviewsForInterviewer } from '../lib/interviews';
import InterviewDetailsModal from './InterviewDetailsModal';

interface InterviewCalendarProps {
  userRole: 'candidate' | 'employer';
  onScheduleInterview?: () => void;
}

const InterviewCalendar = ({ userRole, onScheduleInterview }: InterviewCalendarProps) => {
  const { user } = useAuthContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<string | null>(null);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);

  // Load interviews
  useEffect(() => {
    const loadInterviews = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        let interviewsData;
        
        if (userRole === 'candidate') {
          interviewsData = await getInterviewsForCandidate(user.id);
        } else {
          interviewsData = await getInterviewsForInterviewer(user.id);
        }
        
        setInterviews(interviewsData);
      } catch (err) {
        console.error('Error loading interviews:', err);
        setError('Failed to load interviews. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadInterviews();
  }, [user, userRole]);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the last day of the previous month
    const lastDayPrevMonth = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Add days from previous month to fill the first week
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, lastDayPrevMonth - i),
        isCurrentMonth: false,
        hasInterviews: false,
        interviews: []
      });
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayInterviews = interviews.filter(interview => {
        const interviewDate = new Date(interview.scheduled_at);
        return (
          interviewDate.getFullYear() === date.getFullYear() &&
          interviewDate.getMonth() === date.getMonth() &&
          interviewDate.getDate() === date.getDate()
        );
      });
      
      days.push({
        date,
        isCurrentMonth: true,
        hasInterviews: dayInterviews.length > 0,
        interviews: dayInterviews
      });
    }
    
    // Add days from next month to complete the last week
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
          hasInterviews: false,
          interviews: []
        });
      }
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  
  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleInterviewClick = (interviewId: string) => {
    setSelectedInterview(interviewId);
    setIsInterviewModalOpen(true);
  };

  const handleInterviewUpdate = () => {
    // Reload interviews after an update
    if (user) {
      setLoading(true);
      if (userRole === 'candidate') {
        getInterviewsForCandidate(user.id)
          .then(setInterviews)
          .catch(err => {
            console.error('Error reloading interviews:', err);
            setError('Failed to reload interviews.');
          })
          .finally(() => setLoading(false));
      } else {
        getInterviewsForInterviewer(user.id)
          .then(setInterviews)
          .catch(err => {
            console.error('Error reloading interviews:', err);
            setError('Failed to reload interviews.');
          })
          .finally(() => setLoading(false));
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInterviewTypeName = (type: string) => {
    const typeNames: Record<string, string> = {
      'phone': 'Phone',
      'video': 'Video',
      'technical': 'Technical',
      'behavioral': 'Behavioral',
      'panel': 'Panel',
      'onsite': 'Onsite',
      'final': 'Final'
    };
    return typeNames[type] || type;
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Interview Calendar</h3>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <span className="text-gray-900 font-medium">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          {userRole === 'employer' && onScheduleInterview && (
            <button
              onClick={onScheduleInterview}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading interviews...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <Calendar className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Interviews</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="space-y-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map((day, dayIndex) => {
                    const isToday = new Date().toDateString() === day.date.toDateString();
                    const isSelected = selectedDate?.toDateString() === day.date.toDateString();
                    
                    return (
                      <div
                        key={dayIndex}
                        onClick={() => handleDateClick(day.date)}
                        className={`min-h-24 p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-100 border border-blue-300'
                            : isToday
                            ? 'bg-yellow-50 border border-yellow-200'
                            : day.isCurrentMonth
                            ? 'hover:bg-gray-100'
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        } ${day.hasInterviews ? 'ring-2 ring-blue-200' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-sm font-medium ${
                            isToday ? 'text-blue-700' : 
                            day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {day.date.getDate()}
                          </span>
                          
                          {day.hasInterviews && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
                              {day.interviews.length}
                            </span>
                          )}
                        </div>
                        
                        {/* Interview List */}
                        <div className="mt-1 space-y-1">
                          {day.interviews.slice(0, 2).map(interview => (
                            <div
                              key={interview.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInterviewClick(interview.id);
                              }}
                              className={`p-1 rounded text-xs ${getStatusColor(interview.status)} hover:opacity-80 transition-opacity cursor-pointer truncate`}
                            >
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTime(interview.scheduled_at)}</span>
                              </div>
                              <div className="truncate">
                                {getInterviewTypeName(interview.type)} - 
                                {userRole === 'candidate' 
                                  ? interview.application?.job?.company?.name
                                  : `${interview.application?.first_name} ${interview.application?.last_name}`
                                }
                              </div>
                            </div>
                          ))}
                          
                          {day.interviews.length > 2 && (
                            <div className="text-xs text-blue-600 font-medium">
                              +{day.interviews.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            
            {/* Selected Date Details */}
            {selectedDate && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">
                  Interviews on {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h4>
                
                {calendarDays.find(day => 
                  day.date.toDateString() === selectedDate.toDateString()
                )?.interviews.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No interviews scheduled for this day</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {calendarDays.find(day => 
                      day.date.toDateString() === selectedDate.toDateString()
                    )?.interviews.map(interview => (
                      <div
                        key={interview.id}
                        onClick={() => handleInterviewClick(interview.id)}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(interview.status)}`}>
                              {interview.type === 'video' ? (
                                <Video className="h-5 w-5" />
                              ) : interview.type === 'onsite' ? (
                                <MapPin className="h-5 w-5" />
                              ) : (
                                <Calendar className="h-5 w-5" />
                              )}
                            </div>
                            
                            <div>
                              <h5 className="font-medium text-gray-900">
                                {getInterviewTypeName(interview.type)} Interview
                              </h5>
                              <p className="text-sm text-gray-600">
                                {formatTime(interview.scheduled_at)} • {interview.duration_minutes} minutes
                              </p>
                            </div>
                          </div>
                          
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                            {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userRole === 'candidate' ? (
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">
                                {interview.application?.job?.company?.name}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">
                                {interview.application?.first_name} {interview.application?.last_name}
                              </span>
                            </div>
                          )}
                          
                          {interview.location && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">{interview.location}</span>
                            </div>
                          )}
                          
                          {interview.meeting_link && (
                            <div className="flex items-center space-x-2">
                              <Video className="h-4 w-4 text-gray-400" />
                              <a
                                href={interview.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                Join Meeting
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Interview Details Modal */}
      {selectedInterview && (
        <InterviewDetailsModal
          isOpen={isInterviewModalOpen}
          onClose={() => {
            setIsInterviewModalOpen(false);
            setSelectedInterview(null);
          }}
          interviewId={selectedInterview}
          onUpdate={handleInterviewUpdate}
        />
      )}
    </div>
  );
};

export default InterviewCalendar;