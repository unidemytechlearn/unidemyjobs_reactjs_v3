import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

interface GoogleAuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  onGoogleAuth: () => Promise<void>;
  authType: 'signin' | 'signup';
  userType: 'job_seeker' | 'employer';
}

const GoogleAuthPopup = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  onGoogleAuth, 
  authType,
  userType 
}: GoogleAuthPopupProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'initial' | 'loading' | 'success' | 'error'>('initial');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep('initial');
      setError('');
      setProgress(0);
    }
  }, [isOpen]);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setStep('loading');
    setError('');
    
    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await onGoogleAuth();
      clearInterval(progressInterval);
      setProgress(100);
      setStep('success');
      
      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || 'Authentication failed. Please try again.');
      setStep('error');
      setProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl transform transition-all duration-300 scale-100">
        {/* Animated Header */}
        <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-8 text-white overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12 animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{title}</h2>
                  <p className="text-blue-100 text-sm">{subtitle}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-blue-100">
                {userType === 'employer' 
                  ? '🏢 Join as an employer to post jobs and find talent'
                  : '💼 Join as a job seeker to find your dream career'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 'initial' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {authType === 'signin' ? 'Welcome back!' : 'Get started in seconds'}
                </h3>
                <p className="text-gray-600">
                  {authType === 'signin' 
                    ? 'Sign in with your Google account to continue'
                    : 'Create your account using Google for a faster experience'
                  }
                </p>
              </div>

              <button
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full bg-white border-2 border-gray-200 text-gray-700 py-4 px-6 rounded-2xl hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] font-medium group relative overflow-hidden"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10 flex items-center justify-center space-x-3">
                  <div className="transition-transform duration-300 group-hover:scale-110">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <span className="text-lg">Continue with Google</span>
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  By continuing, you agree to our{' '}
                  <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                </p>
              </div>
            </div>
          )}

          {step === 'loading' && (
            <div className="text-center space-y-6">
              <div className="relative">
                {/* Animated Google logo */}
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-spin"></div>
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 animate-pulse" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">Connecting to Google</h3>
                <p className="text-gray-600">Please complete the authentication in the popup window</p>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                  <span className="ml-2">Authenticating...</span>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                {/* Success particles */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-green-400 rounded-full animate-ping"
                      style={{
                        top: `${20 + Math.random() * 60}%`,
                        left: `${20 + Math.random() * 60}%`,
                        animationDelay: `${i * 200}ms`,
                        animationDuration: '1s'
                      }}
                    ></div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">Success!</h3>
                <p className="text-gray-600">
                  {authType === 'signin' 
                    ? 'Welcome back! Redirecting to your dashboard...'
                    : 'Account created successfully! Setting up your profile...'
                  }
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">Authentication Failed</h3>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleGoogleAuth}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Decorative bottom border */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
      </div>
    </div>
  );
};

export default GoogleAuthPopup;