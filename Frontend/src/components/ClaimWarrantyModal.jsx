import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShieldAlert, CheckCircle } from 'lucide-react';

const ClaimWarrantyModal = ({ booking, onClose }) => {
  const [issue, setIssue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!issue.trim()) return;
    
    // In a real app, this would send an API request
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md bg-white dark:bg-[#0a0a0a] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-900 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={20} className="text-slate-500" />
        </button>

        {!submitted ? (
          <>
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert size={32} />
            </div>
            
            <h2 className="text-2xl font-black mb-2">Claim Warranty</h2>
            <p className="text-slate-500 text-sm mb-6">
              You are claiming a 30-day warranty for the service provided by <b>{booking.provider_name}</b> on {new Date(booking.created_at).toLocaleDateString()}.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Describe the issue
                </label>
                <textarea 
                  required
                  rows={4}
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="E.g., The AC is leaking water again..."
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                  <strong>Note:</strong> A professional will visit within 24 hours to inspect the issue. If it falls under our warranty policy, it will be fixed for free.
                </p>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                Submit Claim
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-black mb-2">Claim Submitted!</h2>
            <p className="text-slate-500 text-sm mb-8">
              We have received your warranty claim. Our team will contact you shortly to schedule a free inspection visit.
            </p>
            <button 
              onClick={onClose}
              className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-bold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ClaimWarrantyModal;
