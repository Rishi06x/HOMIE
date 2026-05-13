import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X, Loader2, Check } from 'lucide-react';
import { submitReview } from '../api';

const ReviewModal = ({ booking, onClose, onComplete }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return alert('Please select a rating');
    setLoading(true);
    try {
      await submitReview(booking.provider_id, booking._id, rating, text);
      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-8 relative z-10 shadow-2xl text-center">
           <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} strokeWidth={3} />
           </div>
           <h2 className="text-xl font-bold mb-2">Thank you!</h2>
           <p className="text-slate-500 text-sm">Your feedback helps maintain the quality of our Homie community.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl relative z-10 shadow-2xl flex flex-col"
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
          <h2 className="text-lg font-bold">Rate your experience</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-500 mb-6 text-center">How was your service?</p>
          
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map(star => (
              <button 
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star 
                  size={36} 
                  className={`transition-colors ${(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-100 text-slate-300 dark:fill-slate-800 dark:text-slate-700'}`} 
                />
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Write a review (Optional)</label>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm h-24 focus:border-blue-500 outline-none"
              placeholder="Tell others about the service..."
            ></textarea>
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={loading || rating === 0} 
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Submit Review'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReviewModal;
