import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Users, Star, Building, Filter, Grid, List, ExternalLink, Briefcase, TrendingUp, Award, Globe } from 'lucide-react';
import { getCompanies } from '../lib/supabase';


interface CompaniesPageProps {
  onNavigate?: (page: 'home' | 'jobs' | 'companies' | 'about' | 'resume-builder' | 'dashboard') => void;
}

// Static filter options - these could also be fetched from the database
const industries = ['All Industries', 'Technology', 'Design', 'Data & Analytics', 'Marketing', 'Finance', 'Healthcare'];
const companySizes = ['All Sizes', '1-50', '50-200', '200-500', '500-1000', '1000-5000', '5000+'];

const CompaniesPage = ({ onNavigate }: CompaniesPageProps) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<string[]>(['All Locations']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [selectedSize, setSelectedSize] = useState('All Sizes');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');

  // Load companies from database
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const fetchedCompanies = await getCompanies();
        
        // Transform the data to match the expected format
        const transformedCompanies = fetchedCompanies.map(company => ({
          id: company.id,
          name: company.name,
          logo: company.logo_url || 'https://images.pexels.com/photos/450035/pexels-photo-450035.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
          industry: company.industry || 'Technology',
          size: company.size_range || '50-200',
          location: company.location || 'Remote',
          rating: company.rating || 4.5,
          reviewCount: company.review_count || 0,
          description: company.description || 'No description available.',
          openJobs: 0, // This would need to be calculated from jobs table
          website: company.website_url || '#',
          founded: company.founded_year || new Date().getFullYear(),
          specialties: company.specialties || [],
          benefits: company.benefits || [],
          culture: company.culture_description || 'Great company culture.',
          featured: company.is_featured || false,
        }));
        
        setCompanies(transformedCompanies);
        
        // Extract unique locations for filter
        const uniqueLocations = ['All Locations', ...new Set(transformedCompanies.map(c => c.location).filter(Boolean))];
        setLocations(uniqueLocations);
        
      } catch (error) {
        console.error('Error loading companies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  // Load job counts for companies
  useEffect(() => {
    const loadJobCounts = async () => {
      if (companies.length === 0) return;
      
      try {
        // Import jobs function dynamically to avoid circular imports
        const { getJobs } = await import('../lib/supabase');
        
        // Get all jobs to count by company
        const allJobs = await getJobs();
        
        // Count jobs per company
        const jobCounts = companies.reduce((acc, company) => {
          const companyJobs = allJobs.filter(job => job.company_id === company.id && job.is_active);
          acc[company.id] = companyJobs.length;
          return acc;
        }, {} as Record<string, number>);
        
        // Update companies with job counts
        setCompanies(prevCompanies => 
          prevCompanies.map(company => ({
            ...company,
            openJobs: jobCounts[company.id] || 0
          }))
        );
        
      } catch (error) {
        console.error('Error loading job counts:', error);
      }
    };

    loadJobCounts();
  }, [companies.length]); // Only run when companies are first loaded

  const filteredCompanies = useMemo(() => {
    let filtered = companies.filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           company.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           company.specialties.some(specialty => 
                             specialty.toLowerCase().includes(searchTerm.toLowerCase())
                           );
      
      const matchesIndustry = selectedIndustry === 'All Industries' || company.industry === selectedIndustry;
      const matchesSize = selectedSize === 'All Sizes' || company.size === selectedSize;
      const matchesLocation = selectedLocation === 'All Locations' || company.location === selectedLocation;

      return matchesSearch && matchesIndustry && matchesSize && matchesLocation;
    });

    // Sort companies
    if (sortBy === 'featured') {
      filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'jobs') {
      filtered.sort((a, b) => b.openJobs - a.openJobs);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [searchTerm, selectedIndustry, selectedSize, selectedLocation, sortBy]);

  const CompanyCard = ({ company, isListView = false }: { company: typeof companies[0], isListView?: boolean }) => (
    <div className={`group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden ${isListView ? 'flex items-start space-x-6' : ''}`}>
      {company.featured && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
          Featured
        </div>
      )}

      <div className={`${isListView ? 'flex-shrink-0' : ''}`}>
        <img
          src={company.logo}
          alt={`${company.name} logo`}
          className="w-16 h-16 rounded-xl object-cover"
        />
      </div>

      <div className={`${isListView ? 'flex-1' : 'mt-4'}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-xl group-hover:text-blue-600 transition-colors">
              {company.name}
            </h3>
            <p className="text-gray-600 text-sm">{company.industry}</p>
          </div>
          {!isListView && (
            <button className="text-gray-400 hover:text-blue-500 transition-colors">
              <ExternalLink className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className={`space-y-3 mb-4 ${isListView ? 'flex items-center space-y-0 space-x-6' : ''}`}>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="h-4 w-4 mr-2" />
            {company.location}
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Users className="h-4 w-4 mr-2" />
            {company.size} employees
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Star className="h-4 w-4 mr-2 text-yellow-500" />
            {company.rating} ({company.reviewCount} reviews)
          </div>
          {isListView && (
            <div className="flex items-center text-blue-600 text-sm font-medium">
              <Briefcase className="h-4 w-4 mr-1" />
              {company.openJobs} open jobs
            </div>
          )}
        </div>

        {!isListView && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {company.description}
          </p>
        )}

        <div className={`flex flex-wrap gap-2 mb-4 ${isListView ? 'max-w-md' : ''}`}>
          {company.specialties.slice(0, isListView ? 2 : 3).map((specialty) => (
            <span
              key={specialty}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
            >
              {specialty}
            </span>
          ))}
          {company.specialties.length > (isListView ? 2 : 3) && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{company.specialties.length - (isListView ? 2 : 3)} more
            </span>
          )}
        </div>

        <div className={`${isListView ? 'flex items-center justify-between' : ''}`}>
          <div className={`${isListView ? '' : 'flex items-center justify-between'}`}>
            <span className="text-blue-600 font-semibold">
              {company.openJobs} open positions
            </span>
            {isListView && (
              <button className="text-gray-400 hover:text-blue-500 transition-colors">
                <ExternalLink className="h-5 w-5" />
              </button>
            )}
          </div>
          {!isListView && (
            <button 
              onClick={() => handleViewJobs(company.id, company.name)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              View Jobs →
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const handleViewJobs = (companyId: string, companyName: string) => {
    // Store company filter for jobs page
    localStorage.setItem('companyFilter', JSON.stringify({
      id: companyId,
      name: companyName
    }));
    
    // Navigate to jobs page
    if (onNavigate) {
      onNavigate('jobs');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Discover Amazing Companies
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore top companies, learn about their culture, and find your perfect workplace match.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 min-w-80">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search companies, industries, or specialties..."
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
                <span>Filters</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="featured">Featured First</option>
                <option value="rating">Highest Rated</option>
                <option value="jobs">Most Jobs</option>
                <option value="name">Company Name</option>
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

          {/* Quick Filters */}
          <div className={`mt-6 space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {companySizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
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
            </div>

            <button
              onClick={() => {
                setSelectedIndustry('All Industries');
                setSelectedSize('All Sizes');
                setSelectedLocation('All Locations');
                setSearchTerm('');
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {loading ? 'Loading companies...' : `Showing ${filteredCompanies.length} of ${companies.length} companies`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="w-8 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
                
                <div className="w-32 h-6 bg-gray-200 rounded mb-2"></div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
                
                <div className="w-full h-12 bg-gray-200 rounded mb-6"></div>
                
                <div className="flex items-center justify-between">
                  <div className="w-20 h-6 bg-gray-200 rounded"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Building className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} isListView={viewMode === 'list'} />
            ))}
          </div>
        )}

        {/* Load More */}
        {!loading && filteredCompanies.length > 0 && (
          <div className="text-center mt-12">
            <button className="bg-gray-900 text-white px-8 py-4 rounded-xl hover:bg-gray-800 transition-colors font-semibold">
              Load More Companies
            </button>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Join Our Growing Network</h2>
            <p className="text-xl text-blue-100">
              Connect with top companies and discover your next career opportunity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white/10 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Building className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold mb-2">{loading ? '...' : `${companies.length}+`}</div>
              <div className="text-blue-100">Partner Companies</div>
            </div>
            <div className="text-center">
              <div className="bg-white/10 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold mb-2">{loading ? '...' : `${companies.reduce((sum, c) => sum + c.openJobs, 0)}+`}</div>
              <div className="text-blue-100">Open Positions</div>
            </div>
            <div className="text-center">
              <div className="bg-white/10 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="bg-white/10 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold mb-2">{loading ? '...' : (companies.reduce((sum, c) => sum + c.rating, 0) / companies.length || 0).toFixed(1)}</div>
              <div className="text-blue-100">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompaniesPage;