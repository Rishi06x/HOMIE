import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, Banknote, Tag, X, User } from 'lucide-react';

const JobDetailsModal = ({ job, onClose, onAccept, onDecline }) => {
  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl relative z-10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold">New Job Request</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* Customer Info */}
          <div className="flex items-center gap-3 mb-6 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
               <User size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base">{job.customer_name}</h3>
              <p className="text-slate-500 text-sm flex items-center gap-1 mt-0.5"><MapPin size={12}/> {job.customer_location}</p>
            </div>
          </div>

          {/* Job Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <Calendar className="text-slate-400 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Scheduled For</p>
                <p className="font-semibold text-sm">{job.scheduled_date === 'today' ? 'Today' : job.scheduled_date === 'tomorrow' ? 'Tomorrow' : job.scheduled_date || 'ASAP'} at {job.scheduled_time || 'Anytime'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Banknote className="text-emerald-500 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Estimated Payout</p>
                <p className="font-bold text-emerald-600 text-lg">₹{job.total_amount ? job.total_amount.toFixed(2) : '0.00'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Tag className="text-slate-400 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Services Requested</p>
                {job.services && job.services.length > 0 ? (
                  <ul className="space-y-1">
                    {job.services.map((s, idx) => (
                      <li key={idx} className="text-sm font-medium text-slate-700 dark:text-slate-300">• {s.quantity}x {s.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Standard Hourly Service Call</p>
                )}
              </div>
            </div>
          </div>

          {job.issue_description && (
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Customer Note</label>
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3 text-sm text-amber-900 dark:text-amber-200">
                "{job.issue_description}"
              </div>
            </div>
          )}

          {/* Pre-Service Photos / Diagnostics */}
          {job.diagnostics_images && job.diagnostics_images.length > 0 && (
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-2">
                <Tag size={14} className="text-slate-400" /> Pre-Service Photos
              </label>
              <div className="space-y-3">
                {job.diagnostics_images.map((diag, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                    {diag.url && (
                       <div className="w-full h-40 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                          {/* If it's a URL to an image */}
                          {diag.url.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                            <img src={diag.url} alt="Diagnostic" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-2">
                              <span className="text-xs break-all text-center text-blue-500 underline mb-1">{diag.url}</span>
                              <span className="text-[10px] uppercase font-bold">Attachment</span>
                            </div>
                          )}
                       </div>
                    )}
                    {diag.details && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                        "{diag.details}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button 
            onClick={() => { onDecline(job._id); onClose(); }} 
            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Decline
          </button>
          <button 
            onClick={() => { onAccept(job._id); onClose(); }} 
            className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
          >
            Accept Job
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default JobDetailsModal;
