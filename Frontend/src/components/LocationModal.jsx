import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Search, Navigation } from 'lucide-react';

const LocationModal = ({ isOpen, onClose, currentLocation, onSave }) => {
  const [address, setAddress] = useState(currentLocation || '');
  const [isLocating, setIsLocating] = useState(false);

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    // Simulate GPS fetch
    setTimeout(() => {
      setAddress('123 Premium Blvd, Tech District, City');
      setIsLocating(false);
    }, 1200);
  };

  const handleSave = () => {
    onSave(address);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl relative z-10 shadow-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MapPin className="text-blue-600" size={20} /> Edit Location
          </h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Interactive Map Mockup */}
          <div className="w-full h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-6 relative overflow-hidden group cursor-crosshair">
            {/* We use a high quality map image placeholder */}
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800&auto=format&fit=crop" 
              alt="Map View" 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
            
            {/* Center Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-600/20 rounded-full animate-ping absolute"></div>
              <MapPin size={36} className="text-blue-600 drop-shadow-lg relative z-10 -mt-4" fill="white" />
            </div>

            <button 
              onClick={handleUseCurrentLocation}
              className="absolute bottom-3 right-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2.5 rounded-xl shadow-lg font-bold text-xs flex items-center gap-2 hover:bg-blue-50 transition-colors"
            >
              <Navigation size={14} className={isLocating ? 'animate-spin text-blue-600' : 'text-blue-600'} />
              {isLocating ? 'Locating...' : 'Use GPS'}
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={18} />
            </div>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your street address or city..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={!address.trim()}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 shadow-lg shadow-blue-600/20"
          >
            Confirm Location
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LocationModal;
