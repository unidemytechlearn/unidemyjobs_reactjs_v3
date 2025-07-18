import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Download, Mail, Phone, Eye, CheckCircle, XCircle, Clock, User, FileText, Star, Calendar, MapPin, Briefcase, ChevronDown, ChevronUp, MoreHorizontal, MessageSquare } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { getEmployerApplications, updateApplicationStatus } from '../lib/employer';
import { JobApplicationDetailsModal } from './JobApplicationDetailsModal';
import InterviewScheduleModal from './InterviewScheduleModal';

interface JobApplicationsPageProps {
  jobId?: string;
  onNavigate?: (page: string, data?: any) => void;
}

const JobApplicationsPage = ({ jobId, onNavigate }: JobApplicationsPageProps) => {
  const { user, profile } = useAuthContext();
  const [applications, setApplications] = useState<any[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState('');
  const [processingBulkAction, setProcessingBulkAction] = useState(false);

  // Load applications
  useEffect(() => {
    const loadApplications = async () => {
      if (!user || profile?.role !== 'employer') return;
      
      try {
        setLoading(true);
        setError('');
        
        const filters: any = {};
        if (jobId) filters.jobId = jobId;
        
        const applicationsData = await getEmployerApplications(user.id, filters);
        setApplications(applicationsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [user, profile?.role, jobId]);

  // Filter and sort applications
  useEffect(() => {
    let filtered = applications;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        `${app.first_name} ${app.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
        case 'oldest':
          return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter, sortBy]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'submitted': 'bg-blue-100 text-blue-700 border-blue-200',
      'under_review': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'interview_scheduled': 'bg-purple-100 text-purple-700 border-purple-200',
      'interview_completed': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'offer_made': 'bg-green-100 text-green-700 border-green-200',
      'accepted': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'rejected': 'bg-red-100 text-red-700 border-red-200',
      'withdrawn': 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      'submitted': <FileText className="h-4 w-4" />,
      'under_review': <Eye className="h-4 w-4" />,
      'interview_scheduled': <Calendar className="h-4 w-4" />,
      'interview_completed': <CheckCircle className="h-4 w-4" />,
      'offer_made': <Star className="h-4 w-4" />,
      'accepted': <CheckCircle className="h-4 w-4" />,
      'rejected': <XCircle className="h-4 w-4" />,
      'withdrawn': <ArrowLeft className="h-4 w-4" />,
    };
    return icons[status] || <FileText className="h-4 w-4" />;
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleApplicationClick = (application: any) => {
    setSelectedApplication(application);
    setIsDetailsModalOpen(true);
  };

  const handleScheduleInterview = (application: any) => {
    setSelectedApplication(application);
    setIsScheduleModalOpen(true);
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      await updateApplicationStatus(applicationId, newStatus, user!.id);
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedApplications.length === 0) return;
    
    setProcessingBulkAction(true);
    try {
      await Promise.all(
        selectedApplications.map(appId => 
          updateApplicationStatus(appId, bulkAction, user!.id)
        )
      );
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          selectedApplications.includes(app.id) ? { ...app, status: bulkAction } : app
        )
      );
      
      setSelectedApplications([]);
      setBulkAction('');
    } catch (error) {
      console.error('Error processing bulk action:', error);
      alert('Failed to process bulk action');
    } finally {
      setProcessingBulkAction(false);
    }
  };

  const toggleApplicationSelection = (applicationId: string) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const selectAllApplications = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(filteredApplications.map(app => app.id));
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses', count: applications.length },
    { value: 'submitted', label: 'New Applications', count: applications.filter(a => a.status === 'submitted').length },
    { value: 'under_review', label: 'Under Review', count: applications.filter(a => a.status === 'under_review').length },
    { value: 'interview_scheduled', label: 'Interview Scheduled', count: applications.filter(a => a.status === 'interview_scheduled').length },
    { value: 'interview_completed', label: 'Interview Completed', count: applications.filter(a => a.status === 'interview_completed').length },
    { value: 'offer_made', label: 'Offer Made', count: applications.filter(a => a.status === 'offer_made').length },
    { value: 'accepted', label: 'Accepted', count: applications.filter(a => a.status === 'accepted').length },
    { value: 'rejected', label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading applications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => onNavigate?.('employer-dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {jobId ? 'Job Applications' : 'All Applications'}
              </h1>
              <p className="text-gray-600 mt-2">
                {filteredApplications.length} of {applications.length} applications
              </p>
            </div>
            
            {selectedApplications.length > 0 && (
              <div className="flex items-center space-x-3">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Bulk Actions</option>
                  <option value="under_review">Move to Review</option>
                  <option value="interview_scheduled">Schedule Interview</option>
                  <option value="rejected">Reject</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || processingBulkAction}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingBulkAction ? 'Processing...' : `Apply to ${selectedApplications.length}`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="status">Status</option>
              </select>
              
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Status Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      statusFilter === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.count} applications</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Applications List */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Applications</h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'No applications match your current filters.'
                : 'No applications have been received yet.'
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                  onChange={selectAllApplications}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
                />
                <div className="grid grid-cols-12 gap-4 w-full text-sm font-medium text-gray-700">
                  <div className="col-span-3">Candidate</div>
                  <div className="col-span-2">Position</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Applied Date</div>
                  <div className="col-span-2">Experience</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {filteredApplications.map((application) => (
                <div
                  key={application.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedApplications.includes(application.id)}
                      onChange={() => toggleApplicationSelection(application.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
                    />
                    
                    <div className="grid grid-cols-12 gap-4 w-full items-center">
                      {/* Candidate */}
                      <div className="col-span-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {application.first_name?.[0]}{application.last_name?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {application.first_name} {application.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{application.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Position */}
                      <div className="col-span-2">
                        <p className="font-medium text-gray-900">{application.job?.title}</p>
                        <p className="text-sm text-gray-600">{application.job?.company?.name}</p>
                      </div>
                      
                      {/* Status */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          <span className="ml-2">{formatStatus(application.status)}</span>
                        </span>
                      </div>
                      
                      {/* Applied Date */}
                      <div className="col-span-2">
                        <p className="text-sm text-gray-900">
                          {new Date(application.applied_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(application.applied_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      
                      {/* Experience */}
                      <div className="col-span-2">
                        <p className="text-sm text-gray-900">
                          {application.years_experience || 'Not specified'}
                        </p>
                        {application.expected_salary && (
                          <p className="text-xs text-gray-500">{application.expected_salary}</p>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="col-span-1 relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === application.id ? null : application.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        
                        {activeDropdown === application.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                              onClick={() => handleApplicationClick(application)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </button>
                            
                            {application.status === 'submitted' && (
                              <button
                                onClick={() => handleStatusChange(application.id, 'under_review')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Move to Review
                              </button>
                            )}
                            
                            {['submitted', 'under_review'].includes(application.status) && (
                              <button
                                onClick={() => handleScheduleInterview(application)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule Interview
                              </button>
                            )}
                            
                            <button
                              onClick={() => window.open(`mailto:${application.email}`, '_blank')}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </button>
                            
                            {application.resume_url && (
                              <button
                                onClick={() => window.open(application.resume_url, '_blank')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Resume
                              </button>
                            )}
                            
                            <div className="border-t border-gray-100 my-1"></div>
                            
                            <button
                              onClick={() => handleStatusChange(application.id, 'rejected')}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modals */}
        {selectedApplication && (
          <>
            <JobApplicationDetailsModal
              isOpen={isDetailsModalOpen}
              onClose={() => {
                setIsDetailsModalOpen(false);
                setSelectedApplication(null);
              }}
              application={selectedApplication}
            />
            
            <InterviewScheduleModal
              isOpen={isScheduleModalOpen}
              onClose={() => {
                setIsScheduleModalOpen(false);
                setSelectedApplication(null);
              }}
              application={selectedApplication}
              onSuccess={() => {
                setIsScheduleModalOpen(false);
                setSelectedApplication(null);
                // Reload applications
                if (user) {
                  const filters: any = {};
                  if (jobId) filters.jobId = jobId;
                  getEmployerApplications(user.id, filters).then(setApplications);
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default JobApplicationsPage;