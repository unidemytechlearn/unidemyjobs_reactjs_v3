import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Filter, SlidersHorizontal, Grid, List, ChevronDown, Bookmark, Clock, DollarSign, Building, X, ChevronUp } from 'lucide-react';
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedJob, setSelectedJob] = useState<typeof allJobs[0] | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Advanced filter states
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 200000]);
  const [isRemoteOnly, setIsRemoteOnly] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [datePosted, setDatePosted] = useState('any');
  const [companySize, setCompanySize] = useState('any');

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
    if (!allJobs || allJobs.length === 0) return [];
    
    let filtered = allJobs.filter(job => {
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
      
      // Advanced filters
      const matchesSalary = (() => {
        if (!job.salary_min && !job.salary_max) return true;
        const jobMin = job.salary_min || 0;
        const jobMax = job.salary_max || 999999;
        return jobMax >= salaryRange[0] && jobMin <= salaryRange[1];
      })();
      
      const matchesRemote = !isRemoteOnly || job.is_remote;
      
      const matchesCompany = selectedCompanies.length === 0 || 
                            selectedCompanies.includes(job.company?.name || '');
      
      const matchesSkills = selectedSkills.length === 0 || 
                           selectedSkills.some(skill => 
                             job.skills_required?.some((jobSkill: string) => 
                               jobSkill.toLowerCase().includes(skill.toLowerCase())
                             )
                           );
      
      const matchesDatePosted = (() => {
        if (datePosted === 'any') return true;
        const jobDate = new Date(job.created_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (datePosted) {
          case 'today': return daysDiff === 0;
          case 'week': return daysDiff <= 7;
          case 'month': return daysDiff <= 30;
          default: return true;
        }
      })();

      return matchesSearch && matchesJobType && matchesCategory && matchesExperience && 
             matchesLocation && matchesSalary && matchesRemote && matchesCompany && 
             matchesSkills && matchesDatePosted;
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
  }, [allJobs, searchTerm, selectedJobTypes, selectedCategory, selectedExperience, selectedLocation, 
      sortBy, salaryRange, isRemoteOnly, selectedCompanies, selectedSkills, datePosted]);

  // Load jobs from database
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Starting to fetch jobs...');
        
        const fetchedJobs = await getJobs({ limit: 100 });
        console.log('Fetched jobs:', fetchedJobs);
        console.log('Total jobs fetched:', fetchedJobs.length);
        
        if (!fetchedJobs || fetchedJobs.length === 0) {
          console.log('No jobs found in database - this might be normal for a new installation');
          // Don't set error for empty results, just show empty state
          setAllJobs([]);
          setDisplayedJobs([]);
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
      } catch (error) {
        console.error('Error loading jobs:', error);
        setError('Failed to load jobs. This might be a temporary issue. Please try refreshing the page.');
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

  // Get unique companies for filter
  const uniqueCompanies = useMemo(() => {
    const companies = allJobs
      .map(job => job.company?.name)
      .filter(Boolean)
      .filter((company, index, arr) => arr.indexOf(company) === index);
    return companies;
  }, [allJobs]);

  // Get unique skills for filter
  const uniqueSkills = useMemo(() => {
    const skills = allJobs
      .flatMap(job => job.skills_required || [])
      .filter((skill, index, arr) => arr.indexOf(skill) === index);
    return skills;
  }, [allJobs]);

  const toggleJobType = (typeId: string) => {
    setSelectedJobTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const toggleCompany = (company: string) => {
    setSelectedCompanies(prev => 
      prev.includes(company) 
        ? prev.filter(c => c !== company)
        : [...prev, company]
    );
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedJobTypes([]);
    setSelectedCategory('All Categories');
    setSelectedExperience('All Levels');
    setSelectedLocation('All Locations');
    setSalaryRange([0, 200000]);
    setIsRemoteOnly(false);
    setSelectedCompanies([]);
    setSelectedSkills([]);
    setDatePosted('any');
    setCompanySize('any');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedJobTypes.length > 0) count++;
    if (selectedCategory !== 'All Categories') count++;
    if (selectedExperience !== 'All Levels') count++;
    if (selectedLocation !== 'All Locations') count++;
    if (salaryRange[0] > 0 || salaryRange[1] < 200000) count++;
    if (isRemoteOnly) count++;
    if (selectedCompanies.length > 0) count++;
    if (selectedSkills.length > 0) count++;
    if (datePosted !== 'any') count++;
    return count;
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
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="lg:hidden flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal className="h-5 w-5 mr-2" />
                Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="hidden lg:flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal className="h-5 w-5 mr-2" />
                Advanced Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
              </button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="salary">Highest Salary</option>
                <option value="company">Company A-Z</option>
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

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
                <div className="flex items-center space-x-3">
                  {getActiveFiltersCount() > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Clear All ({getActiveFiltersCount()})
                    </button>
                  )}
                  <button
                    onClick={() => setShowAdvancedFilters(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Job Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Job Type</label>
                  <div className="space-y-2">
                    {jobTypes.map((type) => (
                      <label key={type.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedJobTypes.includes(type.id)}
                          onChange={() => toggleJobType(type.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Experience Level</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-3">Location</label>
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

                {/* Remote Work */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Work Type</label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isRemoteOnly}
                      onChange={(e) => setIsRemoteOnly(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remote Only</span>
                  </label>
                </div>

                {/* Salary Range */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Salary Range: ${(salaryRange[0] / 1000).toFixed(0)}k - ${(salaryRange[1] / 1000).toFixed(0)}k
                  </label>
                  <div className="px-3">
                    <input
                      type="range"
                      min="0"
                      max="200000"
                      step="5000"
                      value={salaryRange[0]}
                      onChange={(e) => setSalaryRange([parseInt(e.target.value), salaryRange[1]])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="range"
                      min="0"
                      max="200000"
                      step="5000"
                      value={salaryRange[1]}
                      onChange={(e) => setSalaryRange([salaryRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                  </div>
                </div>

                {/* Date Posted */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Date Posted</label>
                  <select
                    value={datePosted}
                    onChange={(e) => setDatePosted(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="any">Any Time</option>
                    <option value="today">Today</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                  </select>
                </div>

                {/* Companies */}
                {uniqueCompanies.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Companies {selectedCompanies.length > 0 && `(${selectedCompanies.length})`}
                    </label>
                    <div className="max-h-32 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                      {uniqueCompanies.map((company) => (
                        <label key={company} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedCompanies.includes(company)}
                            onChange={() => toggleCompany(company)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 truncate">{company}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {uniqueSkills.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Skills {selectedSkills.length > 0 && `(${selectedSkills.length})`}
                    </label>
                    <div className="max-h-32 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                      {uniqueSkills.slice(0, 10).map((skill) => (
                        <label key={skill} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedSkills.includes(skill)}
                            onChange={() => toggleSkill(skill)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 truncate">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Active Filters Display */}
              {getActiveFiltersCount() > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Active Filters:</h4>
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                        Search: "{searchTerm}"
                        <button
                          onClick={() => setSearchTerm('')}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    
                    {selectedJobTypes.map((type) => (
                      <span key={type} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                        {jobTypes.find(t => t.id === type)?.label}
                        <button
                          onClick={() => toggleJobType(type)}
                          className="ml-2 text-green-500 hover:text-green-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    
                    {selectedCategory !== 'All Categories' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
                        {selectedCategory}
                        <button
                          onClick={() => setSelectedCategory('All Categories')}
                          className="ml-2 text-purple-500 hover:text-purple-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    
                    {isRemoteOnly && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700">
                        Remote Only
                        <button
                          onClick={() => setIsRemoteOnly(false)}
                          className="ml-2 text-indigo-500 hover:text-indigo-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    
                    {selectedCompanies.map((company) => (
                      <span key={company} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-700">
                        {company}
                        <button
                          onClick={() => toggleCompany(company)}
                          className="ml-2 text-orange-500 hover:text-orange-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    
                    {selectedSkills.map((skill) => (
                      <span key={skill} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700">
                        {skill}
                        <button
                          onClick={() => toggleSkill(skill)}
                          className="ml-2 text-pink-500 hover:text-pink-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs available</h3>
            <p className="text-gray-600">
              No jobs are currently posted. Check back soon for new opportunities!
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