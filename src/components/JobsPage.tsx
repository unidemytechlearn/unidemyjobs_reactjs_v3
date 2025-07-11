import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Filter, SlidersHorizontal, Grid, List, ChevronDown, Bookmark, Clock, DollarSign, Building } from 'lucide-react';
import ApplyModal from './ApplyModal';
import { getJobs } from '../lib/supabase';

const jobTypes = [
  { id: 'full-time', label: 'Full Time', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'part-time', label: 'Part Time', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'contract', label: 'Contract', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'internship', label: 'Internship', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'freelancing', label: 'Freelancing', color: 'bg-pink-100 text-pink-700 border-pink-200' }
];

const categories = ['All Categories', 'Technology', 'Design', 'Marketing', 'Management', 'Sales', 'Finance'];
const experienceLevels = ['All Levels', 'Entry-level', 'Mid-level', 'Senior', 'Executive'];
const locations = ['All Locations', 'Remote', 'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Los Angeles, CA', 'Boston, MA'];

const JobsPage = () => {
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [displayedJobs, setDisplayedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const JOBS_PER_PAGE = 6;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedExperience, setSelectedExperience] = useState('All Levels');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedJob, setSelectedJob] = useState<typeof allJobs[0] | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [error, setError] = useState<string>('');

  // Helper functions
  const getJobTypeColor = (jobType: string) => {
    const colorMap: Record<string, string> = {
      'Full Time': 'bg-blue-100 text-blue-700',
      'Part Time': 'bg-green-100 text-green-700',
      'Contract': 'bg-purple-100 text-purple-700',
      'Internship': 'bg-orange-100 text-orange-700',
      'Freelancing': 'bg-pink-100 text-pink-700',
    };
    return colorMap[jobType] || 'bg-gray-100 text-gray-700';
  };

  const formatSalary = (min?: number, max?: number, currency: string = 'USD') => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) {
      return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    }
    if (min) return `$${(min / 1000).toFixed(0)}k+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return 'Salary not specified';
  };

  const getCategoryFromJobType = (jobType: string) => {
    // Simple mapping - you can make this more sophisticated
    return 'Technology';
  };

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  // Define filteredJobs
  const filteredJobs = useMemo(() => {
    if (!displayedJobs || displayedJobs.length === 0) return [];
    
    let filtered = displayedJobs.filter(job => {
      const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (job.company && job.company.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesJobType = selectedJobTypes.length === 0 || 
                            selectedJobTypes.some(type => 
                              job.type?.toLowerCase().replace(' ', '-') === type
                            );
      
      const matchesCategory = selectedCategory === 'All Categories' || job.category === selectedCategory;
      const matchesExperience = selectedExperience === 'All Levels' || job.experience === selectedExperience;
      const matchesLocation = selectedLocation === 'All Locations' || 
                             job.location === selectedLocation || 
                             (selectedLocation === 'Remote' && job.remote);

      return matchesSearch && matchesJobType && matchesCategory && matchesExperience && matchesLocation;
    });

    // Sort jobs
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at || b.postedDate).getTime() - new Date(a.created_at || a.postedDate).getTime());
    } else if (sortBy === 'salary') {
      filtered.sort((a, b) => {
        const getSalaryValue = (salary: string) => {
          if (!salary) return 0;
          const match = salary.match(/\$(\d+)k?/);
          return match ? parseInt(match[1]) * (salary.includes('k') ? 1000 : 1) : 0;
        };
        return getSalaryValue(b.salary) - getSalaryValue(a.salary);
      });
    }

    return filtered;
  }, [displayedJobs, searchTerm, selectedJobTypes, selectedCategory, selectedExperience, selectedLocation, sortBy]);

  // Load jobs from database
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Starting to fetch jobs...');
        
        const fetchedJobs = await getJobs();
        console.log('Fetched jobs:', fetchedJobs);
        console.log('Total jobs fetched:', fetchedJobs.length);
        
        if (!fetchedJobs || fetchedJobs.length === 0) {
          console.log('No jobs found in database');
          setAllJobs([]);
          setDisplayedJobs([]);
          setHasMoreJobs(false);
          return;
        }
        
        const jobsWithMockData = fetchedJobs.map(job => ({
          ...job,
          company: job.company?.name || 'Unknown Company',
          type: job.job_type || 'Full Time',
          salary: formatSalary(job.salary_min, job.salary_max, job.salary_currency),
          logo: job.company?.logo_url || 'https://images.pexels.com/photos/450035/pexels-photo-450035.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
          featured: job.is_featured || false,
          typeColor: getJobTypeColor(job.job_type || 'Full Time'),
          category: getCategoryFromJobType(job.job_type || 'Full Time'),
          experience: job.experience_level || 'Mid-level',
          remote: job.is_remote || false,
          postedDate: getRelativeDate(job.created_at),
          description: job.description || 'No description available',
        }));
        
        console.log('Processed jobs:', jobsWithMockData.length);
        setAllJobs(jobsWithMockData);
        setDisplayedJobs(jobsWithMockData);
        setHasMoreJobs(false); // Show all jobs initially
        setCurrentPage(1);
      } catch (error) {
        console.error('Error loading jobs:', error);
        setError('Failed to load jobs. Please try again.');
        setAllJobs([]);
        setDisplayedJobs([]);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  // Debug: Log when jobs change
  useEffect(() => {
    console.log('All jobs count:', allJobs.length);
    console.log('Displayed jobs count:', displayedJobs.length);
    console.log('Filtered jobs count:', filteredJobs.length);
    console.log('Has more jobs:', hasMoreJobs);
  }, [allJobs, displayedJobs, filteredJobs, hasMoreJobs]);

  const handleApplyClick = (job: typeof allJobs[0]) => {
    setSelectedJob(job);
    setIsApplyModalOpen(true);
  };

  const JobCard = ({ job, isListView = false }: { job: typeof allJobs[0], isListView?: boolean }) => (
    <div className={`group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden ${isListView ? 'flex items-center space-x-6' : ''}`}>
      {job.featured && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
          Featured
        </div>
      )}

      <div className={`${isListView ? 'flex-shrink-0' : ''}`}>
        <img
          src={job.logo}
          alt={`${job.company} logo`}
          className="w-16 h-16 rounded-xl object-cover"
        />
      </div>

      <div className={`${isListView ? 'flex-1' : 'mt-4'}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-xl group-hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
            <p className="text-gray-600 text-sm">{job.company}</p>
          </div>
          {!isListView && (
            <button className="text-gray-400 hover:text-red-500 transition-colors">
              <Bookmark className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className={`space-y-3 mb-4 ${isListView ? 'flex items-center space-y-0 space-x-6' : ''}`}>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="h-4 w-4 mr-2" />
            {job.location}
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Clock className="h-4 w-4 mr-2" />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.typeColor}`}>
              {job.type}
            </span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <DollarSign className="h-4 w-4 mr-2" />
            {job.salary}
          </div>
          {isListView && (
            <button className="text-gray-400 hover:text-red-500 transition-colors">
              <Bookmark className="h-5 w-5" />
            </button>
          )}
        </div>

        {!isListView && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {job.description}
          </p>
        )}

        <div className={`${isListView ? 'flex items-center justify-between' : ''}`}>
          <div className={`${isListView ? '' : 'flex items-center justify-between'}`}>
            <span className="text-gray-500 text-sm">
              {job.postedDate}
            </span>
            {isListView && (
              <button 
                onClick={() => handleApplyClick(job)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Apply Now
              </button>
            )}
          </div>
          {!isListView && (
            <button 
              onClick={() => handleApplyClick(job)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Jobs</h1>
              {loading ? (
                <p className="text-gray-600 mt-2">Loading all jobs...</p>
              ) : error ? (
                <p className="text-red-600 mt-2">{error}</p>
              ) : (
                <p className="text-gray-600 mt-2">
                  Showing {filteredJobs.length} of {allJobs.length} jobs
                  {allJobs.length > 0 && ` • Total in database: ${allJobs.length}`}
                </p>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 min-w-80">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="salary">Highest Salary</option>
              </select>

              <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                    <div>
                      <div className="w-32 h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="w-24 h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">
              <Building className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Jobs</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Building className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">
              {allJobs.length === 0 
                ? 'No jobs are currently available in the database.' 
                : 'Try adjusting your filters or search terms'
              }
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} isListView={viewMode === 'list'} />
            ))}
          </div>
        )}
      </div>

      {selectedJob && (
        <ApplyModal
          isOpen={isApplyModalOpen}
          onClose={() => {
            setIsApplyModalOpen(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
        />
      )}
    </div>
  );
};

export default JobsPage;