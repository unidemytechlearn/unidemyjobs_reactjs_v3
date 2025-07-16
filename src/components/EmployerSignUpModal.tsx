import React, { useState } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Phone, MapPin, Building, Users, Globe } from 'lucide-react';
import { signUp } from '../lib/supabase';

interface EmployerSignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignIn: () => void;
  onSuccess?: () => void;
}

const EmployerSignUpModal = ({ isOpen, onClose, onSwitchToSignIn, onSuccess }: EmployerSignUpModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    position: '',
    
    // Company Information
    companyName: '',
    companyWebsite: '',
    companyIndustry: '',
    companySize: '',
    companyLocation: '',
    companyDescription: '',
    
    // Agreement
    terms: false,
    notifications: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!formData.email.includes('@')) newErrors.email = 'Please enter a valid email';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.position.trim()) newErrors.position = 'Your position is required';
    }

    if (step === 2) {
      if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!formData.companyIndustry) newErrors.companyIndustry = 'Industry is required';
      if (!formData.companySize) newErrors.companySize = 'Company size is required';
      if (!formData.companyLocation.trim()) newErrors.companyLocation = 'Company location is required';
      if (!formData.companyDescription.trim()) newErrors.companyDescription = 'Company description is required';
    }

    if (step === 3) {
      if (!formData.terms) newErrors.terms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    
    try {
      await signUp(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        location: formData.companyLocation,
        email_notifications: formData.notifications,
        role: 'employer',
        company_name: formData.companyName,
        company_position: formData.position,
        company_size: formData.companySize,
      });
      
      setIsRegistered(true);
      setTimeout(() => {
        onSuccess?.();
        resetModal();
      }, 2000);
    } catch (err: any) {
      setErrors({ submit: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setCurrentStep(1);
    setIsRegistered(false);
    setErrors({});
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      position: '',
      companyName: '',
      companyWebsite: '',
      companyIndustry: '',
      companySize: '',
      companyLocation: '',
      companyDescription: '',
      terms: false,
      notifications: true,
    });
    onClose();
  };

  if (!isOpen) return null;

  if (isRegistered) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Unidemy Jobs!</h3>
          <p className="text-gray-600 mb-6">
            Your employer account has been created successfully. You can now start posting jobs and managing applications.
          </p>
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Redirecting to employer dashboard...</p>
        </div>
      </div>
    );
  }

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
    'Retail', 'Consulting', 'Real Estate', 'Media & Entertainment', 'Other'
  ];

  const companySizes = [
    '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Employer Account</h2>
            <p className="text-gray-600">Join thousands of companies finding great talent</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step === 1 && 'Personal Details'}
                  {step === 2 && 'Company Information'}
                  {step === 3 && 'Complete Setup'}
                </span>
                {step < 3 && (
                  <div
                    className={`w-12 h-0.5 ml-4 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.firstName ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="Enter your first name"
                      />
                    </div>
                    {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.lastName ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="Enter your last name"
                      />
                    </div>
                    {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Enter your work email address"
                    />
                  </div>
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.password ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="Create a password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.phone ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Position *
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.position ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="e.g., HR Manager, CEO, Recruiter"
                    />
                    {errors.position && <p className="text-red-600 text-sm mt-1">{errors.position}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Company Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.companyName ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Enter your company name"
                    />
                  </div>
                  {errors.companyName && <p className="text-red-600 text-sm mt-1">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="url"
                      name="companyWebsite"
                      value={formData.companyWebsite}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry *
                    </label>
                    <select
                      name="companyIndustry"
                      value={formData.companyIndustry}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.companyIndustry ? 'border-red-300' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Select industry</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                    {errors.companyIndustry && <p className="text-red-600 text-sm mt-1">{errors.companyIndustry}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Size *
                    </label>
                    <select
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.companySize ? 'border-red-300' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Select company size</option>
                      {companySizes.map((size) => (
                        <option key={size} value={size}>
                          {size} employees
                        </option>
                      ))}
                    </select>
                    {errors.companySize && <p className="text-red-600 text-sm mt-1">{errors.companySize}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      name="companyLocation"
                      value={formData.companyLocation}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.companyLocation ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="City, State, Country"
                    />
                  </div>
                  {errors.companyLocation && <p className="text-red-600 text-sm mt-1">{errors.companyLocation}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Description *
                  </label>
                  <textarea
                    name="companyDescription"
                    value={formData.companyDescription}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                      errors.companyDescription ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Tell us about your company, culture, and what makes it special..."
                  />
                  {errors.companyDescription && <p className="text-red-600 text-sm mt-1">{errors.companyDescription}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Complete Setup */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Your Setup</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">You're almost ready!</p>
                      <p className="text-blue-700">
                        Complete your registration to start posting jobs and finding great candidates.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifications"
                      name="notifications"
                      checked={formData.notifications}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="notifications" className="ml-2 text-sm text-gray-700">
                      Send me application notifications and platform updates
                    </label>
                  </div>
                  
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="terms"
                      name="terms"
                      checked={formData.terms}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                    />
                    <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                      I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a> *
                    </label>
                  </div>
                  {errors.terms && <p className="text-red-600 text-sm mt-1">{errors.terms}</p>}
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-800 text-sm">{errors.submit}</p>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Previous
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={onSwitchToSignIn}
              className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              Already have an account? Sign In
            </button>
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Employer Account</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerSignUpModal;