import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, ShieldCheck, Info } from 'lucide-react';

const ServiceDetailsModal = ({ service, onClose, onAddToCart, cartItem }) => {
  if (!service) return null;

  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ y: 50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#0a0a0a] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 z-10 flex flex-col max-h-[90vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors z-20"
        >
          <X size={20} className="text-slate-500" />
        </button>

        <div className="bg-blue-50 dark:bg-blue-900/10 p-8 text-center border-b border-blue-100 dark:border-slate-800">
           <h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">{service.name}</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-2">
             <span className="font-bold text-slate-700 dark:text-slate-300">₹{service.price}</span>
             <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
             <span>{service.duration}</span>
           </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
           
           <div>
             <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><Info size={18} className="text-blue-500" /> What's Included</h3>
             <ul className="space-y-2">
               {(service.included || ['Full inspection and diagnostics', 'Standard spare parts included', 'Post-service cleanup']).map((item, idx) => (
                 <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                   <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                   <span>{item}</span>
                 </li>
               ))}
             </ul>
           </div>

           <div>
             <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><X size={18} className="text-red-500" /> What's Excluded</h3>
             <ul className="space-y-2">
               {(service.excluded || ['Major structural repairs', 'Premium imported spare parts']).map((item, idx) => (
                 <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                   <X size={16} className="text-red-400 mt-0.5 shrink-0" />
                   <span>{item}</span>
                 </li>
               ))}
             </ul>
           </div>

           <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex gap-3">
             <ShieldCheck size={24} className="text-emerald-600 shrink-0" />
             <div>
                <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm mb-1">30-Day Service Warranty</h4>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80 leading-relaxed">
                  If you face any issues related to this service within 30 days, we'll send a professional to fix it for free. No questions asked.
                </p>
             </div>
           </div>

        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0a0a0a]">
           {quantity === 0 ? (
             <button 
               onClick={() => { onAddToCart(service, 1); onClose(); }}
               className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
             >
               Add to Cart — ₹{service.price}
             </button>
           ) : (
             <button 
               onClick={() => { onAddToCart(service, -1); onClose(); }}
               className="w-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-bold py-4 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
             >
               Remove from Cart
             </button>
           )}
        </div>
      </motion.div>
    </div>
  );
};

export default ServiceDetailsModal;
