import React, { useState } from 'react';
import { Building, Users, TrendingUp, Star, CheckCircle, ArrowRight, Briefcase, Search, BarChart3, Shield, Globe, Zap } from 'lucide-react';
import EmployerSignUpModal from './EmployerSignUpModal';
import EmployerSignInModal from './EmployerSignInModal';

interface EmployerLandingPageProps {
  onNavigate?: (page: string) => void;
}

const EmployerLandingPage = ({ onNavigate }: EmployerLandingPageProps) => {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

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
    // Navigate to employer dashboard
    onNavigate?.('employer-dashboard');
  };

  const features = [
    {
      icon: Search,
      title: 'Smart Candidate Matching',
      description: 'Our AI-powered system matches your job requirements with the most qualified candidates.',
      color: 'bg-blue-500'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track application metrics, hiring funnel performance, and optimize your recruitment process.',
      color: 'bg-green-500'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with GDPR compliance and data protection built-in.',
      color: 'bg-purple-500'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Access talent from around the world with our international job posting capabilities.',
      color: 'bg-indigo-500'
    },
    {
      icon: Zap,
      title: 'Fast Hiring',
      description: 'Streamlined application process and automated screening to hire faster.',
      color: 'bg-yellow-500'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Collaborate with your hiring team, share feedback, and make decisions together.',
      color: 'bg-red-500'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      position: 'HR Director',
      company: 'TechCorp Inc.',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      quote: 'Unidemy Jobs helped us reduce our hiring time by 60%. The quality of candidates is exceptional.'
    },
    {
      name: 'Michael Chen',
      position: 'Talent Acquisition Manager',
      company: 'InnovateLab',
      image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      quote: 'The analytics dashboard gives us insights we never had before. Game-changer for our recruitment strategy.'
    },
    {
      name: 'Emily Rodriguez',
      position: 'CEO',
      company: 'StartupXYZ',
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      quote: 'As a startup, we needed an affordable solution that scales. Unidemy Jobs delivered exactly that.'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$99',
      period: 'per month',
      description: 'Perfect for small businesses and startups',
      features: [
        'Up to 5 active job postings',
        'Basic candidate matching',
        'Email support',
        'Standard analytics',
        'Team collaboration (up to 3 users)'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '$299',
      period: 'per month',
      description: 'Ideal for growing companies',
      features: [
        'Up to 25 active job postings',
        'Advanced AI matching',
        'Priority support',
        'Advanced analytics & reporting',
        'Team collaboration (up to 10 users)',
        'Custom branding',
        'API access'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'pricing',
      description: 'For large organizations',
      features: [
        'Unlimited job postings',
        'Custom AI training',
        'Dedicated account manager',
        'Custom integrations',
        'Unlimited team members',
        'White-label solution',
        'SLA guarantee'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Building className="h-4 w-4 mr-2" />
              For Employers & Recruiters
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Find the Perfect
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Candidates</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect with top talent worldwide. Our AI-powered platform helps you find, evaluate, and hire the best candidates faster than ever before.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button 
                onClick={() => setIsSignUpModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 font-semibold shadow-lg flex items-center justify-center space-x-2"
              >
                <span>Start Hiring Today</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setIsSignInModalOpen(true)}
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all font-semibold"
              >
                Sign In
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                <div className="text-gray-600">Companies Trust Us</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-2">1M+</div>
                <div className="text-gray-600">Quality Candidates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">60%</div>
                <div className="text-gray-600">Faster Hiring</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Hire Better
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful tools and features designed to streamline your recruitment process and help you find the best talent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`${feature.color} w-12 h-12 rounded-xl flex items-center justify-center mb-6`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what hiring managers and HR professionals say about our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.name}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.position}</p>
                    <p className="text-sm text-blue-600 font-medium">{testimonial.company}</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed italic">"{testimonial.quote}"</p>
                <div className="flex items-center mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your hiring needs. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative ${
                  plan.popular ? 'ring-2 ring-blue-600' : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setIsSignUpModalOpen(true)}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600'
                  }`}
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of companies that have revolutionized their recruitment process with Unidemy Jobs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setIsSignUpModalOpen(true)}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Start Free Trial
            </button>
            <button className="bg-blue-700 text-white px-8 py-4 rounded-xl hover:bg-blue-800 transition-colors font-semibold border-2 border-blue-500 hover:border-blue-400">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Modals */}
      <EmployerSignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSwitchToSignIn={handleSwitchToSignIn}
        onSuccess={handleAuthSuccess}
      />
      <EmployerSignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onSwitchToSignUp={handleSwitchToSignUp}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default EmployerLandingPage;