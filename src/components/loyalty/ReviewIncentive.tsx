import React, { useState } from 'react';
import { Star, Gift, TrendingUp } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface ReviewIncentiveProps {
  productName?: string;
  productId?: number;
  points?: number;
  onReviewSubmitted?: () => void;
}

const ReviewIncentive: React.FC<ReviewIncentiveProps> = ({
  productName = 'this product',
  productId,
  points = 5,
  onReviewSubmitted,
}) => {
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      showToast({
        title: 'Missing Rating',
        description: 'Please select a rating before submitting',
        variant: 'error',
      });
      return;
    }

    if (review.trim().length < 10) {
      showToast({
        title: 'Review Too Short',
        description: 'Please write at least 10 characters in your review',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Integrate with actual review API
      // await submitReview({ productId, rating, review });
      
      showToast({
        title: 'Review Submitted!',
        description: `You earned ${points} loyalty points for your review!`,
        variant: 'success',
      });

      setHasSubmitted(true);
      setRating(0);
      setReview('');

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Gift className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Thank You for Your Review!</h3>
        <p className="text-green-700 font-semibold mb-1">You earned {points} loyalty points!</p>
        <p className="text-sm text-gray-600">These points have been added to your account</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <Star className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Share Your Experience</h3>
          <p className="text-sm text-gray-600">
            Review {productName} and earn{' '}
            <span className="font-semibold text-amber-600 flex items-center gap-1 inline-flex">
              <TrendingUp className="w-3 h-3" /> {points} points!
            </span>
          </p>
        </div>
      </div>

      {/* Star Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300 hover:text-amber-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your thoughts about this product... (minimum 10 characters)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">
          {review.length}/100 characters • {Math.max(0, 10 - review.length)} more required
        </p>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmitReview}
        disabled={isSubmitting || review.trim().length < 10 || rating === 0}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Submitting...
          </>
        ) : (
          <>
            <Gift className="w-4 h-4" />
            Submit Review & Earn {points} Points
          </>
        )}
      </button>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          <span className="font-semibold">💡 Tip:</span> Detailed, honest reviews help other customers and earn you bonus points!
        </p>
      </div>
    </div>
  );
};

export default ReviewIncentive;
