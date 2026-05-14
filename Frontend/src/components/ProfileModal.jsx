import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, LogOut, Settings, CreditCard, Shield, MapPin, ChevronRight } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, user, onLogout }) => {
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
              <h2 className="text-xl font-black">Profile & Settings</h2>
              <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50 dark:bg-[#0a0a0a]">
              
              {/* User Identity */}
              <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-6 shadow-sm flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mb-4">
                  <User size={36} />
                </div>
                <h3 className="text-xl font-black">{user.name}</h3>
                <p className="text-sm font-semibold text-slate-500 mb-2">{user.email}</p>
                <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                  <MapPin size={12} /> {user.location_text || 'Location not set'}
                </div>
              </div>

              {/* Menu Options */}
              <div className="space-y-2 mb-6">
                {[
                  { icon: <User size={18} />, label: 'Personal Information', desc: 'Edit your details' },
                  { icon: <Shield size={18} />, label: 'Security', desc: 'Password and authentication' },
                  { icon: <CreditCard size={18} />, label: 'Payment Methods', desc: 'Manage saved cards' },
                  { icon: <Settings size={18} />, label: 'Preferences', desc: 'Notifications and language' },
                ].map((item, idx) => (
                  <button key={idx} className="w-full bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-4 hover:border-blue-500 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                      {item.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className="text-xs text-slate-500 font-semibold">{item.desc}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button onClick={onLogout} className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 font-bold py-3.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2">
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
