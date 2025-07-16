import React, { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, Bookmark } from 'lucide-react';
import ApplyModal from './ApplyModal';
import { getJobs } from '../lib/supabase';
import { useAuthContext } from './AuthProvider';
import SignUpModal from './SignUpModal';
import SignInModal from './SignInModal';

interface FeaturedJobsProps {
  onViewAllJobs?: () => void;
}

const FeaturedJobs = ({ onViewAllJobs }: FeaturedJobsProps) => {
  const { isAuthenticated } = useAuthContext();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<typeof jobs[0] | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data: fetchedJobs } = await getJobs({ limit: 6 });
        const jobsWithTypeColors = fetchedJobs.map(job => ({
          ...job,
          typeColor: getJobTypeColor(job.job_type),
          featured: job.is_featured,
          logo: job.company?.logo_url || 'https://images.pexels.com/photos/450035/pexels-photo-450035.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
          salary: formatSalary(job.salary_min, job.salary_max, job.salary_currency),
          type: job.job_type,
          company: job.company?.name || 'Unknown Company'
        }));
        setJobs(jobsWithTypeColors);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

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

  const handleApplyClick = (job: typeof jobs[0]) => {
    if (isAuthenticated) {
      setSelectedJob(job);
      setIsApplyModalOpen(true);
    } else {
      setIsSignUpModalOpen(true);
    }
  };

  const handleSwitchToSignIn = () => {
    setIsSignUpModalOpen(false);
    setIsSignInModalOpen(true);
  };

  const handleSwitchToSignUp = () => {
    setIsSignInModalOpen(false);
    setIsSignUpModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsSignUpModalOpen(false);
    setIsSignInModalOpen(false);
  };

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Job Opportunities
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hand-picked positions from top companies across all job types and industries.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Job Opportunities
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Hand-picked positions from top companies across all job types and industries.
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No featured jobs available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {jobs.map((job, index) => (
              <div
                key={job.id}
                className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {job.featured && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                    Featured
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={job.logo}
                      alt={`${job.company} logo`}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{job.company}</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-red-500 transition-colors">
                    <Bookmark className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    {job.location}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600 text-sm">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.typeColor}`}>
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {job.salary}
                  </div>
                </div>

                <button 
                  onClick={() => handleApplyClick(job)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600"
                >
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <button 
            onClick={onViewAllJobs}
            className="bg-gray-900 text-white px-8 py-4 rounded-xl hover:bg-gray-800 transition-colors font-semibold"
          >
            View All Jobs
          </button>
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

      {/* Authentication Modals */}
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSwitchToSignIn={handleSwitchToSignIn}
        onSuccess={handleAuthSuccess}
      />
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onSwitchToSignUp={handleSwitchToSignUp}
        onSuccess={handleAuthSuccess}
      />
    </section>
  );
};

export default FeaturedJobs;