import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Filter, SlidersHorizontal, Grid, List, ChevronDown, Bookmark, Clock, DollarSign, Building } from 'lucide-react';
import ApplyModal from './ApplyModal';
import { getJobs } from '../lib/supabase';

const jobTypes = [
  { id: 'full-time', label: 'Full Time', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'part-time', label: 'Part Time', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'contract', label: 'Contract', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'internship', label: 'Internship', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'freelancing', label: 'Freelancing', color: 'bg-pink-100 text-pink-700 border-pink-200' },
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

  // Load jobs from database
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        setError('');
        // Fetch all jobs from database
        const fetchedJobs = await getJobs();
        console.log('Fetched jobs:', fetchedJobs); // Debug log
        console.log('Total jobs fetched:', fetchedJobs.length); // Debug log
        const jobsWithMockData = fetchedJobs.map(job => ({
          ...job,
          company: job.company?.name || 'Unknown Company',
          type: job.job_type,
          salary: formatSalary(job.salary_min, job.salary_max, job.salary_currency),
          logo: job.company?.logo_url || 'https://images.pexels.com/photos/450035/pexels-photo-450035.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
          featured: job.is_featured,
          typeColor: getJobTypeColor(job.job_type),
          category: getCategoryFromJobType(job.job_type),
          experience: job.experience_level || 'Mid-level',
          remote: job.is_remote,
          postedDate: getRelativeDate(job.created_at),
          description: job.description,
        }));
        setAllJobs(jobsWithMockData);
        
        // Set initial displayed jobs - show first batch
        const initialJobs = jobsWithMockData.slice(0, JOBS_PER_PAGE);
        setDisplayedJobs(initialJobs);
        setHasMoreJobs(jobsWithMockData.length > JOBS_PER_PAGE);
      } catch (error) {
        console.error('Error loading jobs:', error);
        setError('Failed to load jobs. Please try again.');
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

  // Handle load more functionality
  const handleLoadMore = async () => {
    setLoadingMore(true);
    
    try {
      // Calculate next batch of jobs to show
      const nextPage = currentPage + 1;
      const startIndex = currentPage * JOBS_PER_PAGE;
      const endIndex = nextPage * JOBS_PER_PAGE;
      
      // Show more jobs from allJobs array
      if (endIndex <= allJobs.length) {
        const newJobs = allJobs.slice(startIndex, endIndex);
        setDisplayedJobs(prev => [...prev, ...newJobs]);
        setCurrentPage(nextPage);
        setHasMoreJobs(endIndex < allJobs.length);
      } else {
        // If we need more jobs, fetch from database
        const additionalJobs = await getJobs({
          limit: JOBS_PER_PAGE, 
          offset: allJobs.length 
        });
        
        if (additionalJobs.length > 0) {
          const jobsWithMockData = additionalJobs.map(job => ({
            ...job,
            company: job.company?.name || 'Unknown Company',
            type: job.job_type,
            salary: formatSalary(job.salary_min, job.salary_max, job.salary_currency),
            logo: job.company?.logo_url || 'https://images.pexels.com/photos/450035/pexels-photo-450035.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
            featured: job.is_featured,
            typeColor: getJobTypeColor(job.job_type),
            category: getCategoryFromJobType(job.job_type),
            experience: job.experience_level || 'Mid-level',
            remote: job.is_remote,
            postedDate: getRelativeDate(job.created_at),
            description: job.description,
          }));
          
          setAllJobs(prev => [...prev, ...jobsWithMockData]);
          setDisplayedJobs(prev => [...prev, ...jobsWithMockData]);
          setCurrentPage(nextPage);
          setHasMoreJobs(additionalJobs.length === JOBS_PER_PAGE);
        } else {
          setHasMoreJobs(false);
        }
      }
    } catch (error) {
      console.error('Error loading more jobs:', error);
      setError('Failed to load more jobs. Please try again.');
    } finally {
      setLoadingMore(false);
    }
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

  const getCategoryFromJobType = (jobType: string) => {
    const categoryMap: Record<string, string> = {
      'Full Time': 'Technology',
      'Part Time': 'Technology',
      'Contract': 'Design',
      'Internship': 'Technology',
      'Freelancing': 'Marketing',
    };
    return categoryMap[jobType] || 'Technology';
  };

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  const toggleJobType = (typeId: string) => {
    setSelectedJobTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleApplyClick = (job: typeof allJobs[0]) => {
    setSelectedJob(job);
    setIsApplyModalOpen(true);
  };

  const filteredJobs = useMemo(() => {
    let filtered = displayedJobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (job.company && job.company.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesJobType = selectedJobTypes.length === 0 || 
                            selectedJobTypes.some(type => 
                              job.type.toLowerCase().replace(' ', '-') === type
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
      filtered.sort((a, b) => new Date(a.postedDate).getTime() - new Date(b.postedDate).getTime());
    } else if (sortBy === 'salary') {
      filtered.sort((a, b) => {
        const getSalaryValue = (salary: string) => {
          const match = salary.match(/\$(\d+)k?/);
          return match ? parseInt(match[1]) * (salary.includes('k') ? 1000 : 1) : 0;
        };
        return getSalaryValue(b.salary) - getSalaryValue(a.salary);
      });
    }

    return filtered;
  }, [displayedJobs, searchTerm, selectedJobTypes, selectedCategory, selectedExperience, selectedLocation, sortBy]);

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
          className="w-12 h-12 rounded-lg object-cover"
        />
      </div>

      <div className={`${isListView ? 'flex-1' : 'mt-4'}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">
              {job.title}
            </h3>
            <p className="text-gray-600">{job.company}</p>
          </div>
          {!isListView && (
            <button className="text-gray-400 hover:text-red-500 transition-colors">
              <Bookmark className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className={`space-y-3 mb-6 ${isListView ? 'flex items-center space-y-0 space-x-6' : ''}`}>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="h-4 w-4 mr-2" />
            {job.location}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-600" />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.typeColor}`}>
              {job.type}
            </span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <DollarSign className="h-4 w-4 mr-2" />
            {job.salary}
          </div>
          {isListView && (
            <div className="flex items-center text-gray-500 text-sm">
              <Clock className="h-4 w-4 mr-1" />
              {job.postedDate}
            </div>
          )}
        </div>

        {!isListView && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {job.description}
          </p>
        )}

        <div className={`${isListView ? 'flex items-center space-x-4' : ''}`}>
          <button 
            onClick={() => handleApplyClick(job)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Apply Now
          </button>
          {isListView && (
            <button className="text-gray-400 hover:text-red-500 transition-colors">
              <Bookmark className="h-5 w-5" />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Jobs</h1>
              {loading ? (
                <p className="text-gray-600 mt-2">Loading all jobs...</p>
              ) : (
                <p className="text-gray-600 mt-2">
                  Showing {filteredJobs.length} of {allJobs.length} jobs
                </p>
              )}
            </div>

            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4">
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

              <div className="flex items-center space-x-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="salary">Highest Salary</option>
                  <option value="relevance">Most Relevant</option>
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden text-gray-500"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Job Types */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Job Type</h4>
                  <div className="space-y-2">
                    {jobTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => toggleJobType(type.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                          selectedJobTypes.includes(type.id)
                            ? type.color
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Category</h4>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Experience Level */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Experience Level</h4>
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {experienceLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Location</h4>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setSelectedJobTypes([]);
                    setSelectedCategory('All Categories');
                    setSelectedExperience('All Levels');
                    setSelectedLocation('All Locations');
                    setSearchTerm('');
                  }}
                  className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
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
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Building className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {error ? 'Error Loading Jobs' : 'No jobs found'}
                </h3>
                <p className="text-gray-600">
                  {error || 'Try adjusting your filters or search terms'}
                </p>
                {error && (
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} isListView={viewMode === 'list'} />
                ))}
              </div>
            )}

            {/* Load More */}
            {filteredJobs.length > 0 && hasMoreJobs && !loading && (
              <div className="text-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-gray-900 text-white px-8 py-4 rounded-xl hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading More Jobs...</span>
                    </>
                  ) : (
                    <span>Load More Jobs</span>
                  )}
                </button>
              </div>
            )}
            
            {/* End of results message */}
            {!hasMoreJobs && filteredJobs.length > 0 && !loading && (
              <div className="text-center mt-12">
                <p className="text-gray-600">You've seen all available jobs matching your criteria</p>
              </div>
            )}
          </div>
        </div>
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