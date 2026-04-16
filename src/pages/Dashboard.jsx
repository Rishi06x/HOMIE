import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Bell, Star, ChevronRight, 
  Wrench, Scissors, PaintRoller, Sparkles, Zap, Droplets,
  TrendingUp, Calendar, Clock, CheckCircle2, LogOut, Sun, Moon,
  ShieldAlert, ShieldCheck, ArrowRight, X, User as UserIcon, Check, Power
} from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import logoImg from '../assets/logo.png';

const Dashboard = ({ user, onLogout, isVerified, onVerifyClick }) => {
  const [colorTheme, toggleTheme] = useDarkMode();
  const isDark = colorTheme === "light";
  
  if (user.role === 'provider') {
    return <ProviderDashboard onLogout={onLogout} toggleTheme={toggleTheme} isDark={isDark} isVerified={isVerified} onVerifyClick={onVerifyClick} />;
  }
  
  return <CustomerDashboard onLogout={onLogout} toggleTheme={toggleTheme} isDark={isDark} isVerified={isVerified} onVerifyClick={onVerifyClick} />;
};

// --- CUSTOMER DASHBOARD ---
const CustomerDashboard = ({ onLogout, toggleTheme, isDark, isVerified, onVerifyClick }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [bookedPro, setBookedPro] = useState(null);
  const [location, setLocation] = useState("New York, USA");
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const categories = [
    { id: 'cleaning', name: 'Cleaning', icon: <Sparkles size={24} strokeWidth={1.5} /> },
    { id: 'plumbing', name: 'Plumbing', icon: <Droplets size={24} strokeWidth={1.5} /> },
    { id: 'repairs', name: 'Repairs', icon: <Wrench size={24} strokeWidth={1.5} /> },
    { id: 'painting', name: 'Painting', icon: <PaintRoller size={24} strokeWidth={1.5} /> },
    { id: 'salon', name: 'Salon', icon: <Scissors size={24} strokeWidth={1.5} /> },
    { id: 'electrical', name: 'Electrical', icon: <Zap size={24} strokeWidth={1.5} /> },
  ];

  const pros = [
    { id: 1, name: 'Alex Johnson', category: 'plumbing', title: 'Master Plumber', rating: 4.9, reviews: 124, price: 45 },
    { id: 2, name: 'Sarah Williams', category: 'cleaning', title: 'Deep Cleaning Expert', rating: 4.8, reviews: 89, price: 30 },
    { id: 3, name: 'Mike Davis', category: 'electrical', title: 'Certified Electrician', rating: 5.0, reviews: 42, price: 55 },
    { id: 4, name: 'Emma Wilson', category: 'salon', title: 'Professional Stylist', rating: 4.7, reviews: 210, price: 40 },
    { id: 5, name: 'David Smith', category: 'repairs', title: 'Handyman & Repairs', rating: 4.9, reviews: 156, price: 35 },
    { id: 6, name: 'Jessica Brown', category: 'painting', title: 'Home Painter', rating: 4.8, reviews: 75, price: 50 },
  ];

  // Filtering Logic
  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const filteredPros = useMemo(() => {
    return pros.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500 pb-24">
      
      {/* Navbar - Strict & Clean */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <img src={logoImg} alt="Homie Logo" className="h-9 w-auto object-contain dark:bg-white/95 dark:p-1.5 dark:rounded-lg" />
             <div 
               onClick={() => setShowLocationPicker(true)}
               className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer transition-colors"
               title="Change Location"
             >
               <MapPin size={16} className="text-slate-900 dark:text-white" />
               <span className="text-sm font-semibold border-b border-dashed border-slate-400 max-w-[150px] truncate">{location}</span>
             </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              <Bell size={18} />
            </button>
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
            
            {/* Profile Action */}
            <button 
              onClick={!isVerified ? onVerifyClick : undefined}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isVerified ? 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900' : 'border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20'}`}
            >
              <UserIcon size={16} className={isVerified ? 'text-slate-700 dark:text-slate-300' : 'text-red-600 dark:text-red-400'} />
              <span className={`text-sm font-semibold ${!isVerified && 'text-red-700 dark:text-red-400'}`}>
                {isVerified ? "Profile" : "Verify Profile"}
              </span>
            </button>
            
            <button onClick={onLogout} className="p-2 ml-1 text-slate-400 hover:text-red-600 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* Verification Alert */}
        <AnimatePresence>
          {!isVerified && (
            <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               exit={{ opacity: 0, height: 0 }}
               className="mb-8 overflow-hidden"
            >
               <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={20} className="text-slate-700 dark:text-slate-300" />
                    <div>
                       <h3 className="font-bold text-sm">Action required: Verify your identity</h3>
                       <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">You must be verified to book services on Homie.</p>
                    </div>
                  </div>
                  <button onClick={onVerifyClick} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-sm font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                    Complete Verification
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero & Search */}
        <div className="mb-12">
           <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">Home services, on demand.</h1>
           <div className="relative max-w-2xl">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
               <Search className="text-slate-400" size={20} />
             </div>
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search for a service or professional..." 
               className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-slate-300 dark:focus:border-slate-700 rounded-xl py-4 pl-12 pr-4 text-[15px] font-medium outline-none transition-all placeholder-slate-500"
             />
             {searchQuery && (
               <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
                 <X size={18} />
               </button>
             )}
           </div>
        </div>

        {/* Categories Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold">Categories</h2>
             {activeCategory !== 'all' && (
                <button onClick={() => setActiveCategory('all')} className="text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white">Clear Filter</button>
             )}
          </div>
          
          {filteredCategories.length === 0 ? (
            <p className="text-slate-500 text-sm">No categories found matching "{searchQuery}".</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id === activeCategory ? 'all' : cat.id)}
                  className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl border transition-all ${
                    activeCategory === cat.id 
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0a] hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  <div className={`mb-3 ${activeCategory === cat.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                    {cat.icon}
                  </div>
                  <span className={`text-[13px] font-semibold ${activeCategory === cat.id ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Professionals List */}
        <div>
          <h2 className="text-xl font-bold mb-4">{activeCategory !== 'all' ? `Available for ${categories.find(c => c.id === activeCategory)?.name}` : 'Top Rated Professionals'}</h2>
          
          {filteredPros.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
               <Search className="mx-auto text-slate-400 mb-2" size={24} />
               <p className="text-slate-500 font-medium">No professionals found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {filteredPros.map((pro) => (
                 <div key={pro.id} className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col">
                   <div className="flex items-start gap-4 mb-4">
                     <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                        <img src={`https://ui-avatars.com/api/?name=${pro.name.replace(' ', '+')}&background=random&color=fff`} alt={pro.name} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1">
                       <h3 className="font-bold text-base leading-tight">{pro.name}</h3>
                       <p className="text-slate-500 dark:text-slate-400 text-[13px] font-medium mt-0.5">{pro.title}</p>
                       <div className="flex items-center gap-1 mt-1.5">
                         <Star size={12} className="fill-slate-900 text-slate-900 dark:fill-white dark:text-white" />
                         <span className="text-[13px] font-bold">{pro.rating}</span>
                         <span className="text-[13px] text-slate-500">({pro.reviews})</span>
                       </div>
                     </div>
                   </div>
                   
                   <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-lg font-bold">${pro.price}</span>
                        <span className="text-xs text-slate-500 font-medium">/hr</span>
                      </div>
                      
                      <button 
                        onClick={() => {
                          if (!isVerified) onVerifyClick();
                          else setBookedPro(pro);
                        }}
                        className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white px-5 py-2 rounded-lg text-[13px] font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                      >
                        Book Now
                      </button>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </main>

      {/* Location Picker Modal */}
      <AnimatePresence>
        {showLocationPicker && (
           <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setShowLocationPicker(false)}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl flex flex-col relative z-10 shadow-2xl overflow-hidden"
              >
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                     <h3 className="font-bold text-lg">Select delivery location</h3>
                     <button onClick={() => setShowLocationPicker(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
                        <X size={18} />
                     </button>
                  </div>
                  
                  <div className="p-5">
                     <div className="relative mb-4">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <Search className="text-slate-400" size={16} />
                       </div>
                       <input 
                         type="text" 
                         value={location}
                         onChange={(e) => setLocation(e.target.value)}
                         placeholder="Enter your street or city..." 
                         className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-slate-400 transition-colors"
                       />
                     </div>
                     <button className="flex items-center gap-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm mb-5 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl w-full">
                       <MapPin size={16} /> Use my current location
                     </button>
                     
                     <div className="w-full h-64 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem] overflow-hidden relative shadow-sm border border-slate-200 dark:border-slate-800">
                        <iframe 
                          width="100%" 
                          height="100%" 
                          style={{ border: 0 }} 
                          loading="lazy" 
                          allowFullScreen 
                          referrerPolicy="no-referrer-when-downgrade" 
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(location || "New York, USA")}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                        ></iframe>
                     </div>
                  </div>
                  
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                     <button onClick={() => setShowLocationPicker(false)} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 rounded-xl transition-all hover:opacity-90">
                       Confirm Location
                     </button>
                  </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Booking Success Modal */}
      <AnimatePresence>
         {bookedPro && (
           <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setBookedPro(null)}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-6 relative z-10 shadow-2xl"
              >
                 <div className="w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={24} strokeWidth={3} />
                 </div>
                 <h2 className="text-xl font-bold text-center mb-2">Booking Confirmed!</h2>
                 <p className="text-center text-slate-500 text-sm mb-6">
                   You have successfully booked <strong>{bookedPro.name}</strong> for ${bookedPro.price}/hr. They will contact you shortly.
                 </p>
                 <button onClick={() => setBookedPro(null)} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
                   Done
                 </button>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};

// --- PROVIDER DASHBOARD ---
const ProviderDashboard = ({ onLogout, toggleTheme, isDark, isVerified, onVerifyClick }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [activeJobs, setActiveJobs] = useState([
    { id: 101, title: 'Leaking Pipe Repair', location: '123 Brooklyn St, NY', time: 'Today, 2:00 PM', price: 60, type: 'plumbing' },
    { id: 102, title: 'Deep Home Cleaning', location: '45 Queens Ave, NY', time: 'Tomorrow, 10:00 AM', price: 120, type: 'cleaning' },
    { id: 103, title: 'Ceiling Fan Installation', location: '88 Manhattan Blvd', time: 'Friday, 4:00 PM', price: 80, type: 'electrical' },
  ]);

  const handleAccept = (jobId) => {
    setActiveJobs(prev => prev.filter(j => j.id !== jobId));
    // In a real app, move to 'Accepted' queue
  };

  const handleDecline = (jobId) => {
    setActiveJobs(prev => prev.filter(j => j.id !== jobId));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500 pb-20">
      
      {/* Navbar Minimal */}
      <header className="bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src={logoImg} alt="Homie Logo" className="h-9 w-auto object-contain dark:bg-white/95 dark:p-1.5 dark:rounded-lg" />
             <span className="font-bold text-[11px] tracking-widest text-slate-400 uppercase hidden sm:inline ml-1 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full">Pro Portal</span>
          </div>

          <div className="flex items-center gap-4">
             {/* Status Toggle (Frontend logic) */}
             {isVerified && (
               <button 
                 onClick={() => setIsOnline(!isOnline)}
                 className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${isOnline ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-900/50 dark:text-emerald-400' : 'border-slate-200 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
               >
                 <Power size={12} /> {isOnline ? 'ONLINE' : 'OFFLINE'}
               </button>
             )}

             <button onClick={toggleTheme} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             
             <button onClick={!isVerified ? onVerifyClick : undefined} className={`w-8 h-8 rounded-full border flex items-center justify-center overflow-hidden ${!isVerified ? 'border-red-500 cursor-pointer' : 'border-slate-300 dark:border-slate-700'}`}>
                <UserIcon size={16} className={!isVerified ? 'text-red-500' : 'text-slate-500'} />
             </button>

             <div className="h-4 w-px bg-slate-300 dark:bg-slate-800"></div>

             <button onClick={onLogout} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 flex items-center gap-1 text-sm font-semibold transition-colors">
               <LogOut size={16} /> <span className="hidden sm:inline">Sign Out</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* Verification Warning */}
        <AnimatePresence>
          {!isVerified && (
            <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               exit={{ opacity: 0, height: 0 }}
               className="mb-8 overflow-hidden"
            >
               <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start md:items-center gap-3">
                    <ShieldAlert size={24} className="text-red-600 dark:text-red-500 shrink-0 mt-0.5 md:mt-0" />
                    <div>
                       <h3 className="font-bold text-red-900 dark:text-red-400">Identity Verification Required</h3>
                       <p className="text-red-700 dark:text-red-500/80 text-sm mt-1 max-w-xl">
                         You cannot view or accept new job requests until your professional identity and licenses have been verified.
                       </p>
                    </div>
                  </div>
                  <button onClick={onVerifyClick} className="whitespace-nowrap px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm text-center">
                    Verify Now
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Core Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
           <div className={`bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 ${!isVerified && 'opacity-60'}`}>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Earnings This Week</span>
              <h3 className="text-3xl font-black mt-2">$240.50</h3>
              <p className="text-xs font-semibold text-emerald-600 mt-2">+12% from last week</p>
           </div>
           <div className={`bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 ${!isVerified && 'opacity-60'}`}>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jobs Completed</span>
              <h3 className="text-3xl font-black mt-2">12</h3>
              <p className="text-xs font-semibold text-slate-500 mt-2">2 pending review</p>
           </div>
           <div className={`bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 ${!isVerified && 'opacity-60'}`}>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overall Rating</span>
              <h3 className="text-3xl font-black mt-2">4.9</h3>
              <p className="text-xs font-semibold text-slate-500 mt-2">From 56 customer reviews</p>
           </div>
        </div>

        {/* Job Board */}
        <div>
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold">New Job Requests</h2>
             {isOnline && isVerified && <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-1 rounded-md"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live</span>}
           </div>

           {!isVerified ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
                 <ShieldAlert className="mx-auto text-slate-400 mb-3" size={32} />
                 <h3 className="font-bold text-slate-900 dark:text-white">Jobs Locked</h3>
                 <p className="text-slate-500 text-sm mt-1">Please verify your account to view available jobs.</p>
              </div>
           ) : !isOnline ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
                 <Power className="mx-auto text-slate-400 mb-3" size={32} />
                 <h3 className="font-bold text-slate-900 dark:text-white">You are offline</h3>
                 <p className="text-slate-500 text-sm mt-1">Toggle your status to online in the top bar to receive job matches.</p>
              </div>
           ) : activeJobs.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
                 <Search className="mx-auto text-slate-400 mb-3" size={32} />
                 <h3 className="font-bold text-slate-900 dark:text-white">No active requests</h3>
                 <p className="text-slate-500 text-sm mt-1">We'll notify you when a job matches your skills.</p>
              </div>
           ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {activeJobs.map((job) => (
                    <motion.div 
                      key={job.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                       <div>
                          <h3 className="font-bold text-base mb-1">{job.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                            <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                            <span className="flex items-center gap-1"><Calendar size={12} /> {job.time}</span>
                          </div>
                       </div>

                       <div className="flex items-center gap-3 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0">
                          <div className="text-lg font-bold w-full md:w-auto text-right md:px-4">${job.price}</div>
                          <button onClick={() => handleAccept(job.id)} className="flex-1 md:flex-none bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                            Accept
                          </button>
                          <button onClick={() => handleDecline(job.id)} className="flex-1 md:flex-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            Pass
                          </button>
                       </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
           )}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
