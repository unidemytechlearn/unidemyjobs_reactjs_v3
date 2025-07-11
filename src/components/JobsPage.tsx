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

  // Rest of the code remains the same...

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Rest of the JSX remains the same... */}
    </div>
  );
};

export default JobsPage;