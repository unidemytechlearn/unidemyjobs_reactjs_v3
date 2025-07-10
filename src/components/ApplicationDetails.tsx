import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Clock, DollarSign, Calendar, FileText, CheckCircle, XCircle, Award, Mail, Phone, Briefcase, User, Link, Download } from 'lucide-react';
import ApplicationStatusTimeline from './ApplicationStatusTimeline';
import { updateApplicationStatus } from '../lib/applications';
import { useAuthContext } from './AuthProvider';

interface ApplicationDetailsProps {
  application: any;
  onBack: () => void;
  onStatusUpdate?: () => void;
}

const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({ 
  application, 
  onBack,
  onStatusUpdate
}) => {
  const { user } = useAuthContext();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusOptions, setShowStatusOptions] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!user || !application) return;
    
    setIsUpdatingStatus(true);
    try {
      const success = await updateApplicationStatus(application.id, newStatus);
      if (success && onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    } finally {
      setIsUpdatingStatus(false);
      setShowStatusOptions(false);
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

  const getNextPossibleStatuses = (currentStatus: string) => {
    const statusFlow: Record<string, string[]> = {
      'submitted': ['under_review', 'rejected', 'withdrawn'],
      'under_review': ['interview_scheduled', 'rejected', 'withdrawn'],
      'interview_scheduled': ['interview_completed', 'rejected', 'withdrawn'],
      'interview_completed': ['offer_made', 'rejected', 'withdrawn'],
      'offer_made': ['accepted', 'rejected', 'withdrawn'],
      'accepted': ['withdrawn'],
      'rejected': [],
      'withdrawn': []
    };
    
    return statusFlow[currentStatus] || [];
  };

  if (!application) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Application not found</p>
      </div>
    );
  }

  const nextPossibleStatuses = getNextPossibleStatuses(application.status);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h3 className="text-xl font-semibold text-gray-900">Application Details</h3>
      </div>

      {/* Job and Company Info */}
      <div className="flex items-start space-x-4 mb-6">
        {application.job?.company?.logo_url && (
          <img
            src={application.job.company.logo_url}
            alt={`${application.job.company.name} logo`}
            className="w-16 h-16 rounded-lg object-cover"
          />
        )}
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{application.job?.title}</h4>
          <p className="text-gray-600">{application.job?.company?.name}</p>
          
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {application.job?.location}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {application.job?.job_type}
            </div>
            {application.expected_salary && (
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                {application.expected_salary}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h5 className="font-medium text-gray-900">Application Status</h5>
          <div className="relative">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
              {formatStatus(application.status)}
            </span>
            
            {nextPossibleStatuses.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowStatusOptions(!showStatusOptions)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showStatusOptions ? 'Hide options' : 'Update status'}
                </button>
                
                {showStatusOptions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div className="py-1">
                      {nextPossibleStatuses.map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(status)}
                          disabled={isUpdatingStatus}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {formatStatus(status)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <ApplicationStatusTimeline 
            applicationId={application.id}
            currentStatus={application.status}
          />
        </div>
      </div>

      {/* Application Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h5 className="font-medium text-gray-900 mb-3">Personal Information</h5>
          <div className="space-y-3">
            <div className="flex items-start">
              <User className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {application.first_name} {application.last_name}
                </p>
                <p className="text-xs text-gray-500">Name</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Mail className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">{application.email}</p>
                <p className="text-xs text-gray-500">Email</p>
              </div>
            </div>
            
            {application.phone && (
              <div className="flex items-start">
                <Phone className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{application.phone}</p>
                  <p className="text-xs text-gray-500">Phone</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h5 className="font-medium text-gray-900 mb-3">Professional Information</h5>
          <div className="space-y-3">
            {application.years_experience && (
              <div className="flex items-start">
                <Briefcase className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{application.years_experience}</p>
                  <p className="text-xs text-gray-500">Experience</p>
                </div>
              </div>
            )}
            
            {application.availability_date && (
              <div className="flex items-start">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(application.availability_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">Availability</p>
                </div>
              </div>
            )}
            
            {application.skills && application.skills.length > 0 && (
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <div className="flex flex-wrap gap-1">
                    {application.skills.map((skill: string, index: number) => (
                      <span 
                        key={index}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Skills</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cover Letter */}
      {application.cover_letter && (
        <div className="mb-6">
          <h5 className="font-medium text-gray-900 mb-3">Cover Letter</h5>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 whitespace-pre-line">{application.cover_letter}</p>
          </div>
        </div>
      )}

      {/* Resume and Attachments */}
      {(application.resume_url || (application.attachments && application.attachments.length > 0)) && (
        <div className="mb-6">
          <h5 className="font-medium text-gray-900 mb-3">Attachments</h5>
          <div className="space-y-2">
            {application.resume_url && (
              <a 
                href={application.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-5 w-5 text-blue-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Resume</p>
                  <p className="text-xs text-gray-500">View or download your resume</p>
                </div>
                <Download className="h-4 w-4 text-gray-400" />
              </a>
            )}
            
            {application.attachments && application.attachments.map((attachment: any) => (
              <a 
                key={attachment.id}
                href={attachment.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-5 w-5 text-blue-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                  <p className="text-xs text-gray-500">{attachment.attachment_type}</p>
                </div>
                <Download className="h-4 w-4 text-gray-400" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* External Links */}
      {(application.linkedin_url || application.github_url || application.portfolio_url || application.website_url) && (
        <div>
          <h5 className="font-medium text-gray-900 mb-3">External Links</h5>
          <div className="space-y-2">
            {application.linkedin_url && (
              <a 
                href={application.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <Link className="h-4 w-4 mr-2" />
                LinkedIn Profile
              </a>
            )}
            
            {application.github_url && (
              <a 
                href={application.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <Link className="h-4 w-4 mr-2" />
                GitHub Profile
              </a>
            )}
            
            {application.portfolio_url && (
              <a 
                href={application.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <Link className="h-4 w-4 mr-2" />
                Portfolio
              </a>
            )}
            
            {application.website_url && (
              <a 
                href={application.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <Link className="h-4 w-4 mr-2" />
                Personal Website
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetails;