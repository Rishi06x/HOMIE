import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Search, Navigation } from 'lucide-react';

const LocationModal = ({ isOpen, onClose, currentLocation, onSave }) => {
  const [address, setAddress] = useState(currentLocation || '');
  const [isLocating, setIsLocating] = useState(false);

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use OpenStreetMap Nominatim to get address from coords
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`${latitude}, ${longitude}`);
          }
        } catch (err) {
          console.error(err);
          alert("Failed to get address from coordinates.");
        } finally {
          setIsLocating(false);
        }
      }, (error) => {
        console.error(error);
        alert("Geolocation failed: " + error.message);
        setIsLocating(false);
      });
    } else {
      alert("Geolocation is not supported by your browser");
      setIsLocating(false);
    }
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
            {/* Real Google Map Embed */}
            <iframe 
              src={`https://maps.google.com/maps?q=${encodeURIComponent(address || 'New York')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
              width="100%" 
              height="100%" 
              style={{border:0}} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            ></iframe>
            
            {/* Overlay for aesthetic */}
            <div className="absolute inset-0 bg-blue-600/5 pointer-events-none"></div>

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
