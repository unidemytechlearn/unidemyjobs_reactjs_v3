import React, { useState } from 'react';
import { X, Star, ThumbsUp, ThumbsDown, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { submitInterviewFeedback } from '../lib/interviews';

interface InterviewFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: any;
  onSuccess?: () => void;
}

const InterviewFeedbackModal = ({ isOpen, onClose, interview, onSuccess }: InterviewFeedbackModalProps) => {
  const { user } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    rating: 3,
    strengths: '',
    weaknesses: '',
    notes: '',
    recommendation: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleRatingChange = (rating: number) => {
    setFormData({
      ...formData,
      rating,
    });
  };

  const validateForm = () => {
    if (!formData.rating) {
      setError('Please provide a rating');
      return false;
    }
    if (!formData.recommendation) {
      setError('Please provide a hiring recommendation');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user || !interview) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await submitInterviewFeedback({
        interview_id: interview.id,
        rating: formData.rating,
        strengths: formData.strengths || '',
        weaknesses: formData.weaknesses || '',
        notes: formData.notes || '',
        recommendation: formData.recommendation,
        created_by: user.id
      });
      
      setIsSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        resetModal();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setIsSubmitted(false);
    setError('');
    setFormData({
      rating: 3,
      strengths: '',
      weaknesses: '',
      notes: '',
      recommendation: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Feedback Submitted!</h3>
          <p className="text-gray-600 mb-6">
            Your feedback for this interview has been successfully recorded.
          </p>
          <button
            onClick={resetModal}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Interview Feedback</h2>
            <p className="text-gray-600">
              {interview?.application?.job?.title} - {interview?.application?.first_name} {interview?.application?.last_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating *
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRatingChange(rating)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      formData.rating >= rating
                        ? 'bg-yellow-400 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Star className="h-6 w-6" fill={formData.rating >= rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {formData.rating === 1 && 'Poor - Not a good fit'}
                {formData.rating === 2 && 'Below Average - Significant concerns'}
                {formData.rating === 3 && 'Average - Meets basic requirements'}
                {formData.rating === 4 && 'Good - Strong candidate'}
                {formData.rating === 5 && 'Excellent - Exceptional candidate'}
              </p>
            </div>

            {/* Strengths */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strengths
              </label>
              <div className="relative">
                <ThumbsUp className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                <textarea
                  name="strengths"
                  value={formData.strengths}
                  onChange={handleInputChange}
                  placeholder="What were the candidate's key strengths?"
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Weaknesses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Areas for Improvement
              </label>
              <div className="relative">
                <ThumbsDown className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                <textarea
                  name="weaknesses"
                  value={formData.weaknesses}
                  onChange={handleInputChange}
                  placeholder="What areas could the candidate improve on?"
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any other observations or comments about the candidate..."
                  rows={4}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Recommendation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hiring Recommendation *
              </label>
              <select
                name="recommendation"
                value={formData.recommendation}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select recommendation</option>
                <option value="strong_yes">Strong Yes - Exceptional candidate</option>
                <option value="yes">Yes - Good fit for the role</option>
                <option value="maybe">Maybe - Some concerns but potential</option>
                <option value="no">No - Not a good fit</option>
                <option value="strong_no">Strong No - Significant concerns</option>
              </select>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Feedback</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewFeedbackModal;