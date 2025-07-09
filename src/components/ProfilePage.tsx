import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Globe, Linkedin, Github, Camera, Save, X, Edit3, Shield, Bell, Eye, EyeOff, Upload, FileText, Award, Star, TrendingUp, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { updateProfile, resetPassword } from '../lib/supabase';

interface ProfilePageProps {
  onNavigate?: (page: string) => void;
}

const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  const { isAuthenticated, user, profile, refreshProfile, loading, profileLoading } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'security' | 'preferences'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [uploadedResume, setUploadedResume] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profileData, setProfileData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    
    // Professional Information
    jobTitle: '',
    company: '',
    experience: '',
    skills: [] as string[],
    salary: '',
    availability: '',
    
    // Social Links
    linkedin: '',
    github: '',
    portfolio: '',
    
    // Profile Settings
    profileVisibility: 'public',
    showSalary: false,
    showContact: true,
    
    // Notification Preferences
    emailNotifications: true,
    jobAlerts: true,
    applicationUpdates: true,
    marketingEmails: false,
    
    // Security
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  });

  const [profileStats] = useState({
    profileViews: profile?.profile_views || 0,
    applicationsSent: 23, // This would come from applications table
    savedJobs: 45, // This would come from saved_jobs table
    profileCompleteness: 85, // Calculate based on filled fields
  });

  // Show loading spinner while authentication is being restored
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    onNavigate?.('home');
    return null;
  }

  // Load profile data when component mounts or profile changes
  useEffect(() => {
    if (profile && user) {
      setProfileData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: user.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        jobTitle: profile.job_title || '',
        company: profile.company || '',
        experience: profile.experience_level || '',
        skills: [], // Skills would need to be fetched from user_skills table
        salary: profile.salary_range || '',
        availability: profile.availability || '',
        linkedin: profile.linkedin_url || '',
        github: profile.github_url || '',
        portfolio: profile.portfolio_url || '',
        profileVisibility: profile.profile_visibility || 'public',
        showSalary: profile.show_salary || false,
        showContact: profile.show_contact !== false,
        emailNotifications: profile.email_notifications !== false,
        jobAlerts: profile.job_alerts !== false,
        applicationUpdates: profile.application_updates !== false,
        marketingEmails: profile.marketing_emails || false,
        twoFactorEnabled: profile.two_factor_enabled || false,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [profile, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setProfileData({
      ...profileData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
    // Clear message when user starts editing
    if (message) setMessage(null);
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skillsArray = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setProfileData({
      ...profileData,
      skills: skillsArray,
    });
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }
      setUploadedResume(file);
      setMessage(null);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      const updateData = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone,
        location: profileData.location,
        bio: profileData.bio,
        job_title: profileData.jobTitle,
        company: profileData.company,
        experience_level: profileData.experience,
        salary_range: profileData.salary,
        availability: profileData.availability,
        linkedin_url: profileData.linkedin,
        github_url: profileData.github,
        portfolio_url: profileData.portfolio,
        profile_visibility: profileData.profileVisibility,
        show_salary: profileData.showSalary,
        show_contact: profileData.showContact,
        email_notifications: profileData.emailNotifications,
        job_alerts: profileData.jobAlerts,
        application_updates: profileData.applicationUpdates,
        marketing_emails: profileData.marketingEmails,
        two_factor_enabled: profileData.twoFactorEnabled,
      };

      await updateProfile(user.id, updateData);
      await refreshProfile();
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    setIsResettingPassword(true);
    setMessage(null);
    
    try {
      await resetPassword(user.email);
      setMessage({ type: 'success', text: 'Password reset email sent! Check your inbox.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send password reset email' });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Show loading spinner while profile is being loaded
  if (profileLoading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ProfileOverview = () => (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
          <div className="relative">
            <img
              src="https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop"
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
            />
            <button className="absolute bottom-0 right-0 bg-white text-blue-600 p-2 rounded-full hover:bg-gray-50 transition-colors">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {profileData.firstName || profileData.lastName ? 
                `${profileData.firstName} ${profileData.lastName}` : 
                'Complete Your Profile'
              }
            </h1>
            <p className="text-xl text-blue-100 mb-4">
              {profileData.jobTitle ? `${profileData.jobTitle}${profileData.company ? ` at ${profileData.company}` : ''}` : 'Professional'}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-blue-100">
              {profileData.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{profileData.location}</span>
                </div>
              )}
              {profileData.experience && (
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4" />
                  <span>{profileData.experience} experience</span>
                </div>
              )}
              {profileData.availability && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{profileData.availability}</span>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setActiveTab('edit')}
            className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-colors font-semibold flex items-center space-x-2"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">{profileStats.profileViews}</div>
          <div className="text-gray-600 text-sm">Profile Views</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">{profileStats.applicationsSent}</div>
          <div className="text-gray-600 text-sm">Applications Sent</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">{profileStats.savedJobs}</div>
          <div className="text-gray-600 text-sm">Saved Jobs</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-orange-600 mb-2">{profileStats.profileCompleteness}%</div>
          <div className="text-gray-600 text-sm">Profile Complete</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* About Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
            <p className="text-gray-600 leading-relaxed">
              {profileData.bio || 'No bio available. Click "Edit Profile" to add your professional summary.'}
            </p>
          </div>

          {/* Skills Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
            {profileData.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No skills added yet. Click "Edit Profile" to add your skills.</p>
            )}
          </div>

          {/* Experience Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience</h3>
            {profileData.jobTitle || profileData.company ? (
              <div className="space-y-4">
                <div className="border-l-4 border-blue-600 pl-4">
                  <h4 className="font-semibold text-gray-900">{profileData.jobTitle || 'Professional'}</h4>
                  {profileData.company && <p className="text-blue-600 font-medium">{profileData.company}</p>}
                  <p className="text-gray-600 text-sm">{profileData.experience || 'Experience level not specified'}</p>
                  <p className="text-gray-600 mt-2">
                    {profileData.bio || 'No description available.'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No experience information added yet. Click "Edit Profile" to add your work experience.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{profileData.email}</span>
              </div>
              {profileData.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{profileData.phone}</span>
                </div>
              )}
              {profileData.location && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{profileData.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
            <div className="space-y-3">
              {profileData.linkedin ? (
                <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-blue-600 hover:text-blue-700">
                  <Linkedin className="h-4 w-4" />
                  <span>LinkedIn Profile</span>
                </a>
              ) : (
                <div className="flex items-center space-x-3 text-gray-400">
                  <Linkedin className="h-4 w-4" />
                  <span>No LinkedIn profile</span>
                </div>
              )}
              
              {profileData.github ? (
                <a href={profileData.github} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-gray-600 hover:text-gray-700">
                  <Github className="h-4 w-4" />
                  <span>GitHub Profile</span>
                </a>
              ) : (
                <div className="flex items-center space-x-3 text-gray-400">
                  <Github className="h-4 w-4" />
                  <span>No GitHub profile</span>
                </div>
              )}
              
              {profileData.portfolio ? (
                <a href={profileData.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-purple-600 hover:text-purple-700">
                  <Globe className="h-4 w-4" />
                  <span>Portfolio Website</span>
                </a>
              ) : (
                <div className="flex items-center space-x-3 text-gray-400">
                  <Globe className="h-4 w-4" />
                  <span>No portfolio website</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Completeness */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Completeness</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-semibold text-gray-900">{profileStats.profileCompleteness}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${profileStats.profileCompleteness}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500">
                Add more skills and experience to reach 100%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const EditProfile = () => (
    <div className="space-y-8">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Edit Profile Information</h3>
        
        <form className="space-y-6">
          {/* Personal Information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleInputChange}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={profileData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              name="bio"
              value={profileData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Professional Information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Professional Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={profileData.jobTitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <input
                  type="text"
                  name="company"
                  value={profileData.company}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
              <select
                name="experience"
                value={profileData.experience}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select experience</option>
                <option value="Entry-level">Entry-level</option>
                <option value="1-2 years">1-2 years</option>
                <option value="3-5 years">3-5 years</option>
                <option value="5+ years">5+ years</option>
                <option value="10+ years">10+ years</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
              <select
                name="availability"
                value={profileData.availability}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select availability</option>
                <option value="Open to opportunities">Open to opportunities</option>
                <option value="Actively looking">Actively looking</option>
                <option value="Not looking">Not looking</option>
                <option value="Open to freelance">Open to freelance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma-separated)</label>
            <input
              type="text"
              value={profileData.skills.join(', ')}
              onChange={handleSkillsChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="React, TypeScript, Node.js, Python..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
            <input
              type="text"
              name="salary"
              value={profileData.salary}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="$120k - $160k"
            />
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Social Links</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                <input
                  type="url"
                  name="linkedin"
                  value={profileData.linkedin}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Profile</label>
                <input
                  type="url"
                  name="github"
                  value={profileData.github}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Website</label>
                <input
                  type="url"
                  name="portfolio"
                  value={profileData.portfolio}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Update Resume</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                {uploadedResume ? (
                  <div className="text-green-600">
                    <FileText className="h-5 w-5 inline mr-2" />
                    <span className="font-medium">{uploadedResume.name}</span>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">
                      Upload new resume
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF, DOC, DOCX (max 5MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const SecuritySettings = () => (
    <div className="space-y-8">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Password Reset */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Password</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">Reset Password</h5>
              <p className="text-gray-600 text-sm">Send a password reset email to {user?.email}</p>
            </div>
            <button
              onClick={handlePasswordReset}
              disabled={isResettingPassword}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResettingPassword ? 'Sending...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
        <p className="text-gray-600 mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5 text-gray-400" />
            <span className="text-gray-700">Two-Factor Authentication</span>
          </div>
          <button
            onClick={() => setProfileData({...profileData, twoFactorEnabled: !profileData.twoFactorEnabled})}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              profileData.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                profileData.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Profile Visibility */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Visibility</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
            <select
              name="profileVisibility"
              value={profileData.profileVisibility}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">Public - Visible to everyone</option>
              <option value="private">Private - Only visible to you</option>
              <option value="recruiters">Recruiters only</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Show salary information</span>
              <button
                onClick={() => setProfileData({...profileData, showSalary: !profileData.showSalary})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  profileData.showSalary ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profileData.showSalary ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700">Show contact information</span>
              <button
                onClick={() => setProfileData({...profileData, showContact: !profileData.showContact})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  profileData.showContact ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profileData.showContact ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PreferencesSettings = () => (
    <div className="space-y-8">
      {/* Notification Preferences */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-700 font-medium">Email Notifications</span>
              <p className="text-gray-500 text-sm">Receive general updates via email</p>
            </div>
            <button
              onClick={() => setProfileData({...profileData, emailNotifications: !profileData.emailNotifications})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                profileData.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  profileData.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-700 font-medium">Job Alerts</span>
              <p className="text-gray-500 text-sm">Get notified about new job opportunities</p>
            </div>
            <button
              onClick={() => setProfileData({...profileData, jobAlerts: !profileData.jobAlerts})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                profileData.jobAlerts ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  profileData.jobAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-700 font-medium">Application Updates</span>
              <p className="text-gray-500 text-sm">Updates on your job applications</p>
            </div>
            <button
              onClick={() => setProfileData({...profileData, applicationUpdates: !profileData.applicationUpdates})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                profileData.applicationUpdates ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  profileData.applicationUpdates ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-700 font-medium">Marketing Emails</span>
              <p className="text-gray-500 text-sm">Promotional content and tips</p>
            </div>
            <button
              onClick={() => setProfileData({...profileData, marketingEmails: !profileData.marketingEmails})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                profileData.marketingEmails ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  profileData.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Actions</h3>
        
        <div className="space-y-4">
          <button className="w-full text-left p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-700 font-medium">Download My Data</span>
                <p className="text-gray-500 text-sm">Get a copy of all your data</p>
              </div>
              <span className="text-blue-600">Download</span>
            </div>
          </button>

          <button className="w-full text-left p-4 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-red-700 font-medium">Delete Account</span>
                <p className="text-red-500 text-sm">Permanently delete your account and data</p>
              </div>
              <span className="text-red-600">Delete</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Management</h1>
          <p className="text-gray-600 mt-2">Manage your profile information and account settings</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'edit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Edit Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preferences'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Preferences
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <ProfileOverview />}
        {activeTab === 'edit' && <EditProfile />}
        {activeTab === 'security' && <SecuritySettings />}
        {activeTab === 'preferences' && <PreferencesSettings />}
      </div>
    </div>
  );
};

export default ProfilePage;