import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { reviewService } from '../services/parceloServices';
import { useToast } from '../context/ToastContext';

export const ReviewModal = ({ order, isOpen, onClose, onReviewSubmitted }) => {
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reviewService.createReview({
        order_id: order.id,
        rating,
        comment: comment.trim(),
      });
      showToast(`Thank you! ${rating}★ review published.`);
      if (onReviewSubmitted) onReviewSubmitted(order.id, rating, comment);
      onClose();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl theme-bg-card border theme-border theme-shadow p-6 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full theme-bg-secondary flex items-center justify-center hover:opacity-80 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider theme-accent-text block mb-1">
            Order #{order.order_number}
          </span>
          <h3 className="font-serif text-2xl font-bold">
            Rate {order.restaurant_name}
          </h3>
          <p className="text-xs theme-text-secondary mt-1">
            Share your gastronomic impressions with the chef
          </p>
        </div>

        {/* 5-Star interactive selector (FR-7.4) */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1 hover:scale-125 transition-transform cursor-pointer"
            >
              <Star
                className={`w-7 h-7 ${
                  star <= rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-neutral-500 opacity-40'
                }`}
              />
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Review Comments (Optional)</label>
            <textarea
              maxLength={500}
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How were the flavours, presentation, and delivery temperature?"
              className="w-full p-3 rounded-2xl theme-bg-secondary border theme-border text-xs focus:outline-none"
            />
            <div className="text-right text-[10px] theme-text-secondary mt-1">
              {comment.length} / 500
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl theme-accent-bg text-xs font-bold shadow-md hover:scale-[1.01] transition-transform cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Publishing...' : 'Publish Privé Review'}
          </button>
        </form>
      </div>
    </div>
  );
};
