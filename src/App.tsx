import React, { useState } from 'react';
import { AuthProvider } from './components/AuthProvider';
import Header from './components/Header';
import Hero from './components/Hero';
import JobTypeStats from './components/JobTypeStats';
import JobCategories from './components/JobCategories';
import FeaturedJobs from './components/FeaturedJobs';
import Companies from './components/Companies';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import JobsPage from './components/JobsPage';
import CompaniesPage from './components/CompaniesPage';
import AboutPage from './components/AboutPage';
import ResumeBuilderPage from './components/ResumeBuilderPage';
import Dashboard from './components/Dashboard';
import JobDetailsPage from './components/JobDetailsPage';
import EmployerLandingPage from './components/EmployerLandingPage';
import EmployerDashboard from './components/EmployerDashboard';
import { useAuthContext } from './components/AuthProvider';

// Handle auth state changes and redirects
const handleAuthRedirect = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get('role');
  
  if (role) {
    // Clear the URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    return role;
  }
  
  return null;
};
function AppContent() {
  const [currentPage, setCurrentPage] = useState<'home' | 'jobs' | 'companies' | 'about' | 'resume-builder' | 'dashboard' | 'job-details' | 'employer' | 'employer-dashboard'>('home');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const { isAuthenticated, user, profile, authError } = useAuthContext();

  // Handle auth redirects
  useEffect(() => {
    const redirectRole = handleAuthRedirect();
    if (redirectRole && isAuthenticated) {
      if (redirectRole === 'employer' && profile?.role === 'employer') {
        setCurrentPage('employer-dashboard');
      } else if (redirectRole === 'job_seeker' && profile?.role !== 'employer') {
        setCurrentPage('dashboard');
      }
    }
  }, [isAuthenticated, profile]);

  const handleLogin = () => {
    // Navigate based on user role
    if (profile?.role === 'employer') {
      setCurrentPage('employer-dashboard');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentPage('home');
  };

  const handleNavigateToJobsWithFilter = (jobType?: string) => {
    setCurrentPage('jobs');
    // Store the job type filter for the jobs page
    if (jobType) {
      // We'll pass this through a state or context later
      localStorage.setItem('jobTypeFilter', jobType);
    }
  };

  const handleNavigateWithJobId = (page: string, jobId?: string) => {
    setCurrentPage(page as any);
    if (jobId) setSelectedJobId(jobId);
  };

  if (currentPage === 'employer') {
    return <EmployerLandingPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === 'employer-dashboard' && isAuthenticated && profile?.role === 'employer') {
    return (
      <div className="min-h-screen bg-white">
        <Header 
          onNavigate={setCurrentPage} 
          currentPage={currentPage}
          isLoggedIn={isAuthenticated}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
        {authError && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-16">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 text-sm">{authError}</p>
            </div>
          </div>
        )}
        <EmployerDashboard onNavigate={handleNavigateWithJobId} />
      </div>
    );
  }

  if (currentPage === 'dashboard' && isAuthenticated && profile?.role !== 'employer') {
    return (
      <div className="min-h-screen bg-white">
        <Header 
          onNavigate={setCurrentPage} 
          currentPage={currentPage}
          isLoggedIn={isAuthenticated}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
        {authError && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-16">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 text-sm">{authError}</p>
            </div>
          </div>
        )}
        <Dashboard onNavigate={handleNavigateWithJobId} />
        <Footer />
      </div>
    );
  }

  if (currentPage === 'jobs') {
    return (
      <div className="min-h-screen bg-white">
        <Header 
          onNavigate={setCurrentPage} 
          currentPage={currentPage}
          isLoggedIn={isAuthenticated}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
        <JobsPage />
        <Footer />
      </div>
    );
  }

  if (currentPage === 'companies') {
    return (
      <div className="min-h-screen bg-white">
        <Header 
          onNavigate={setCurrentPage} 
          currentPage={currentPage}
          isLoggedIn={isAuthenticated}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
        <CompaniesPage onNavigate={setCurrentPage} />
        <Footer />
      </div>
    );
  }

  if (currentPage === 'about') {
    return (
      <div className="min-h-screen bg-white">
        <Header 
          onNavigate={setCurrentPage} 
          currentPage={currentPage}
          isLoggedIn={isAuthenticated}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
        <AboutPage />
        <Footer />
      </div>
    );
  }

  if (currentPage === 'resume-builder') {
    return (
      <div className="min-h-screen bg-white">
        <Header 
          onNavigate={setCurrentPage} 
          currentPage={currentPage}
          isLoggedIn={isAuthenticated}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
        <ResumeBuilderPage />
        <Footer />
      </div>
    );
  }

  if (currentPage === 'job-details') {
    return (
      <div className="min-h-screen bg-white">
        <Header 
          onNavigate={setCurrentPage} 
          currentPage={currentPage}
          isLoggedIn={isAuthenticated}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
        <JobDetailsPage jobId={selectedJobId} onNavigate={handleNavigateWithJobId} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header 
        onNavigate={setCurrentPage} 
        currentPage={currentPage}
        isLoggedIn={isAuthenticated}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <Hero 
        onNavigateToResumeBuilder={() => setCurrentPage('resume-builder')}
        onNavigateToJobs={handleNavigateToJobsWithFilter}
      />
      <JobTypeStats onNavigateToJobs={handleNavigateToJobsWithFilter} />
      <Companies onNavigate={setCurrentPage} />
      <JobCategories />
      <FeaturedJobs onViewAllJobs={() => setCurrentPage('jobs')} />
      <Newsletter />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;