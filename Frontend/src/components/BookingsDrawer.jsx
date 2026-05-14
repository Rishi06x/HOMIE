import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const BookingsDrawer = ({ isOpen, onClose, myBookings }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[80]"
            onClick={onClose}
          />
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-[#0a0a0a] shadow-2xl z-[90] flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-xl font-black flex items-center gap-2">
                <ShoppingBag className="text-blue-600" /> My Bookings
              </h2>
              <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50 dark:bg-[#0a0a0a]">
              {myBookings && myBookings.length > 0 ? (
                <div className="space-y-4">
                  {myBookings.map((b) => (
                    <div key={b._id} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-base">{b.provider_name}</p>
                          <p className="text-xs text-slate-500 font-semibold">{new Date(b.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-black rounded-lg ${
                          b.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          b.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          b.status === 'declined' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="space-y-2 mb-3">
                        {b.services && b.services.length > 0 ? (
                          b.services.map((s, idx) => (
                            <div key={idx} className="flex justify-between text-sm font-medium">
                              <span className="text-slate-600 dark:text-slate-400">{s.quantity}x {s.name}</span>
                              <span>₹{s.price * s.quantity}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-600 dark:text-slate-400">Standard Service</span>
                            <span>₹{b.total_amount}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</span>
                        <span className="text-lg font-black text-emerald-600">₹{b.total_amount?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <ShoppingBag size={64} className="mb-4 text-slate-400" />
                  <p className="text-lg font-bold">Your cart is empty</p>
                  <p className="text-sm font-medium mt-1 max-w-[200px]">Looks like you haven't booked any services yet.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button onClick={onClose} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity">
                Continue Browsing
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BookingsDrawer;
