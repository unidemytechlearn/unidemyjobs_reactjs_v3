import React, { useState } from 'react';
import { Star, Check, AlertTriangle } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { submitInterviewFeedback } from '../lib/interviews';

interface InterviewFeedbackFormProps {
  interviewId: string;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

const InterviewFeedbackForm = ({ 
  interviewId, 
  onSubmitSuccess, 
  onCancel 
}: InterviewFeedbackFormProps) => {
  const { user } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    rating: 3,
    strengths: '',
    weaknesses: '',
    notes: '',
    recommendation: 'maybe' as 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no',
    is_visible_to_candidate: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit feedback');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await submitInterviewFeedback(
        interviewId,
        user.id,
        formData
      );
      
      onSubmitSuccess?.();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
      <h4 className="font-medium text-gray-900 mb-4">Provide Interview Feedback</h4>
      
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Rating
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, rating }))}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  formData.rating >= rating
                    ? 'bg-yellow-100 text-yellow-600 border border-yellow-300'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                <Star className={`h-5 w-5 ${formData.rating >= rating ? 'fill-current' : ''}`} />
              </button>
            ))}
          </div>
        </div>
        
        {/* Recommendation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recommendation
          </label>
          <select
            name="recommendation"
            value={formData.recommendation}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="strong_yes">Strong Yes - Exceptional candidate</option>
            <option value="yes">Yes - Good fit for the role</option>
            <option value="maybe">Maybe - Some concerns but potential</option>
            <option value="no">No - Not a good fit</option>
            <option value="strong_no">Strong No - Significant concerns</option>
          </select>
        </div>
        
        {/* Strengths */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Strengths
          </label>
          <textarea
            name="strengths"
            value={formData.strengths}
            onChange={handleInputChange}
            rows={3}
            placeholder="What were the candidate's strengths?"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          ></textarea>
        </div>
        
        {/* Weaknesses */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Areas for Improvement
          </label>
          <textarea
            name="weaknesses"
            value={formData.weaknesses}
            onChange={handleInputChange}
            rows={3}
            placeholder="What areas could the candidate improve on?"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          ></textarea>
        </div>
        
        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={4}
            placeholder="Any additional comments or observations?"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          ></textarea>
        </div>
        
        {/* Visibility */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_visible_to_candidate"
            name="is_visible_to_candidate"
            checked={formData.is_visible_to_candidate}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_visible_to_candidate" className="ml-2 text-sm text-gray-700">
            Make feedback visible to candidate
          </label>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InterviewFeedbackForm;