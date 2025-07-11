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
import { useAuthContext } from './components/AuthProvider';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<'home' | 'jobs' | 'companies' | 'about' | 'resume-builder' | 'dashboard'>('home');
  const { isAuthenticated, user } = useAuthContext();

  const handleLogin = () => {
    setCurrentPage('dashboard');
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

  if (currentPage === 'dashboard' && isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <Header 
          onNavigate={setCurrentPage} 
          currentPage={currentPage}
          isLoggedIn={isAuthenticated}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
        <Dashboard onNavigate={setCurrentPage} />
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