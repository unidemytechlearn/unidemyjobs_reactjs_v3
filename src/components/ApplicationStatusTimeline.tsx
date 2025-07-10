import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Calendar, Award, FileText, Search, CheckSquare, X, ArrowRight } from 'lucide-react';
import { getApplicationStatusTimeline } from '../lib/applications';

interface ApplicationStatusTimelineProps {
  applicationId: string;
  currentStatus: string;
  compact?: boolean;
  maxItems?: number;
}

interface TimelineItem {
  id: string;
  status: string;
  notes?: string;
  created_at: string;
  is_current: boolean;
  metadata?: {
    display_name: string;
    description: string;
    color: string;
    icon: string;
    order_index: number;
  };
}

const ApplicationStatusTimeline: React.FC<ApplicationStatusTimelineProps> = ({ 
  applicationId, 
  currentStatus,
  compact = false,
  maxItems = 3
}) => {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const timelineData = await getApplicationStatusTimeline(applicationId);
        setTimeline(timelineData);
      } catch (error) {
        console.error('Error fetching application timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [applicationId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'under_review':
        return <Search className="h-4 w-4 text-yellow-600" />;
      case 'interview_scheduled':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'interview_completed':
        return <CheckSquare className="h-4 w-4 text-indigo-600" />;
      case 'offer_made':
        return <Award className="h-4 w-4 text-green-600" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'withdrawn':
        return <X className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
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

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">No status history available</p>
      </div>
    );
  }

  const displayTimeline = showAll ? timeline : timeline.slice(0, maxItems);

  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-4'}`}>
      <div className="relative pl-6">
        {/* Vertical timeline line */}
        {!compact && <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gray-200"></div>}
        
        {displayTimeline.map((item, index) => (
          <div key={item.id} className={`relative ${compact ? 'mb-1' : 'mb-4'}`}>
            {/* Timeline dot */}
            {!compact && (
              <div className={`absolute -left-6 mt-1.5 w-4 h-4 rounded-full flex items-center justify-center ${getStatusColor(item.status).split(' ')[0]}`}>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
            
            <div className="flex items-start">
              {compact && (
                <div className="mr-2 mt-0.5">
                  {getStatusIcon(item.status)}
                </div>
              )}
              
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className={`font-medium ${compact ? 'text-sm' : 'text-base'} text-gray-900`}>
                    {item.metadata?.display_name || formatStatus(item.status)}
                  </span>
                  {index === 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Current
                    </span>
                  )}
                </div>
                
                <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
                  {new Date(item.created_at).toLocaleDateString()} 
                  {!compact && ` at ${new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                </span>
                
                {!compact && item.notes && (
                  <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                )}
                
                {!compact && item.metadata?.description && (
                  <p className="text-sm text-gray-600 mt-1">{item.metadata.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {timeline.length > maxItems && !showAll && (
        <button 
          onClick={() => setShowAll(true)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
        >
          View full history
          <ArrowRight className="h-3 w-3 ml-1" />
        </button>
      )}
      
      {timeline.length > maxItems && showAll && (
        <button 
          onClick={() => setShowAll(false)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Show less
        </button>
      )}
    </div>
  );
};

export default ApplicationStatusTimeline;