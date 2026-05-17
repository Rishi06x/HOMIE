import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Navigation, Phone, MessageCircle, Clock, ShieldCheck, Zap } from 'lucide-react';

const TrackingModal = ({ booking, onClose, socket }) => {
  const [proLocation, setProLocation] = useState({ x: 20, y: 80 }); // Start simulated location
  const [eta, setEta] = useState(12);

  useEffect(() => {
    if (!socket) return;

    // Listen for real pro location updates
    socket.on('pro_location', (data) => {
      // Map lat/lng to our SVG coordinate space (simulated)
      // For this demo, we'll just jitter the location slightly to show movement
      console.log("Real-time location received:", data);
    });

    // Simulated movement for the WOW effect
    const interval = setInterval(() => {
      setProLocation(prev => {
        const nextX = prev.x + (60 - prev.x) * 0.05;
        const nextY = prev.y + (30 - prev.y) * 0.05;
        return { x: nextX, y: nextY };
      });
      setEta(prev => Math.max(1, prev - 0.1));
    }, 2000);

    return () => {
      socket.off('pro_location');
      clearInterval(interval);
    };
  }, [socket]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ y: 100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
      >
        {/* Map Header */}
        <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-start pointer-events-none">
           <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 pointer-events-auto">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Arriving In</p>
              <div className="flex items-baseline gap-1">
                 <span className="text-3xl font-black">{Math.ceil(eta)}</span>
                 <span className="text-sm font-bold text-slate-500">mins</span>
              </div>
           </div>
           <button 
             onClick={onClose}
             className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-full shadow-xl border border-white/20 pointer-events-auto hover:scale-110 transition-transform"
           >
              <X size={20} />
           </button>
        </div>

        {/* CUSTOM SVG MAP (High Fidelity) */}
        <div className="h-[400px] bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
           {/* Grid Pattern */}
           <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
                style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
           
           <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Simulated Roads */}
              <path d="M0 50 Q 50 50 100 50" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-slate-300 dark:text-slate-800" />
              <path d="M50 0 Q 50 50 50 100" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-slate-300 dark:text-slate-800" />
              <path d="M20 0 Q 80 100 100 80" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-slate-300 dark:text-slate-800" />

              {/* Customer Location (Target) */}
              <g transform="translate(70, 30)">
                 <circle r="8" className="fill-blue-500/20 animate-pulse" />
                 <circle r="3" className="fill-blue-600" />
                 <MapPin className="text-blue-600" x="-6" y="-12" size={12} />
              </g>

              {/* Professional Location (Moving) */}
              <motion.g 
                animate={{ x: proLocation.x, y: proLocation.y }}
                transition={{ type: 'spring', damping: 20 }}
              >
                 <circle r="10" className="fill-amber-500/20" />
                 <motion.div
                   animate={{ rotate: [0, 5, -5, 0] }}
                   transition={{ repeat: Infinity, duration: 2 }}
                 >
                    <Navigation className="text-amber-500 fill-amber-500" x="-6" y="-6" size={14} />
                 </motion.div>
                 
                 {/* Label */}
                 <foreignObject x="10" y="-15" width="100" height="30">
                    <div className="bg-amber-500 text-white text-[8px] font-black px-2 py-1 rounded-full w-fit whitespace-nowrap shadow-lg">
                       {booking.provider_name} is here
                    </div>
                 </foreignObject>
              </motion.g>
           </svg>

           {/* Live Status Overlay */}
           <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-bounce w-fit mx-auto">
              <Zap size={12} fill="white" /> Live Tracking Active
           </div>
        </div>

        {/* Pro Info Card */}
        <div className="p-8 bg-white dark:bg-[#0a0a0a]">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                    <Navigation size={24} className="text-slate-400" />
                 </div>
                 <div>
                    <h3 className="font-black text-lg">{booking.provider_name}</h3>
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                       <ShieldCheck size={12} className="text-emerald-500" /> Verified Background
                    </p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shadow-sm">
                    <Phone size={20} className="text-slate-900 dark:text-white" />
                 </button>
                 <button className="p-4 bg-blue-600 rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                    <MessageCircle size={20} className="text-white" />
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                 <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Clock size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Distance</span>
                 </div>
                 <p className="font-black text-lg">2.4 km</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                 <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Navigation size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Traffic</span>
                 </div>
                 <p className="font-black text-lg text-emerald-500">Light</p>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TrackingModal;
