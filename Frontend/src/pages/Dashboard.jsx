import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Bell, Star, ChevronRight, 
  Wrench, Scissors, PaintRoller, Sparkles, Zap, Droplets,
  TrendingUp, Calendar, Clock, CheckCircle2, LogOut, Sun, Moon,
  ShieldAlert, ShieldCheck, ArrowRight, X, User as UserIcon, Check, Power, Brain, Loader2, MessageCircle, ShoppingBag
} from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { getNearbyProfessionals, updateOnlineStatus, getBookings, createBooking, updateBookingStatus, addDiagnostics, startJobWithOtp } from '../api';
import logoImg from '../assets/logo.png';
import ServiceCatalog from '../components/ServiceCatalog';
import CheckoutModal from '../components/CheckoutModal';
import ReviewModal from '../components/ReviewModal';
import JobDetailsModal from '../components/JobDetailsModal';
import ChatModal from '../components/ChatModal';
import LocationModal from '../components/LocationModal';
import ProfileModal from '../components/ProfileModal';

const Dashboard = ({ user, onLogout, isVerified, onVerifyClick }) => {
  const [colorTheme, toggleTheme] = useDarkMode();
  const isDark = colorTheme === "light";
  
  if (user.role === 'provider') {
    return <ProviderDashboard user={user} onLogout={onLogout} toggleTheme={toggleTheme} isDark={isDark} isVerified={isVerified} onVerifyClick={onVerifyClick} />;
  }
  
  return <CustomerDashboard user={user} onLogout={onLogout} toggleTheme={toggleTheme} isDark={isDark} isVerified={isVerified} onVerifyClick={onVerifyClick} />;
};

// --- CUSTOMER DASHBOARD ---
const CustomerDashboard = ({ user, onLogout, toggleTheme, isDark, isVerified, onVerifyClick }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [bookedPro, setBookedPro] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Real data from API
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  
  // Bookings state
  const [myBookings, setMyBookings] = useState([]);
  const [bookingIssue, setBookingIssue] = useState('');
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [diagnosticUrl, setDiagnosticUrl] = useState('');
  const [diagnosticDetails, setDiagnosticDetails] = useState('');
  const [showDiagnosticFor, setShowDiagnosticFor] = useState(null);
  const [showReviewFor, setShowReviewFor] = useState(null);
  const [showChatFor, setShowChatFor] = useState(null);

  // Cart & Services State
  const [cart, setCart] = useState([]);

  const handleAddToCart = (service, quantityChange) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === service.id);
      if (existing) {
        const newQuantity = existing.quantity + quantityChange;
        if (newQuantity <= 0) return prev.filter(item => item.id !== service.id);
        return prev.map(item => item.id === service.id ? { ...item, quantity: newQuantity } : item);
      }
      if (quantityChange > 0) {
        return [...prev, { ...service, quantity: 1 }];
      }
      return prev;
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDiagnosticUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const categories = [
    { id: 'cleaning', name: 'Cleaning', icon: <Sparkles size={24} strokeWidth={1.5} /> },
    { id: 'plumbing', name: 'Plumbing', icon: <Droplets size={24} strokeWidth={1.5} /> },
    { id: 'repairs', name: 'Repairs', icon: <Wrench size={24} strokeWidth={1.5} /> },
    { id: 'painting', name: 'Painting', icon: <PaintRoller size={24} strokeWidth={1.5} /> },
    { id: 'salon', name: 'Salon', icon: <Scissors size={24} strokeWidth={1.5} /> },
    { id: 'electrical', name: 'Electrical', icon: <Zap size={24} strokeWidth={1.5} /> },
  ];

  // Fetch professionals from API whenever category or search changes
  useEffect(() => {
    const fetchPros = async () => {
      setLoading(true);
      setApiError('');
      try {
        const data = await getNearbyProfessionals(activeCategory, searchQuery);
        setProfessionals(data.professionals || []);
      } catch (err) {
        console.error('Failed to fetch professionals:', err);
        setApiError(err.response?.data?.error || 'Failed to load professionals');
        setProfessionals([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce search queries
    const timer = setTimeout(fetchPros, searchQuery ? 400 : 0);
    return () => clearTimeout(timer);
  }, [activeCategory, searchQuery]);

  // Fetch customer bookings
  const fetchMyBookings = async () => {
    try {
      const data = await getBookings();
      setMyBookings(data || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  useEffect(() => {
    fetchMyBookings();
    // Simple polling for real-time feel
    const interval = setInterval(fetchMyBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmCheckout = async (checkoutData) => {
    if (!bookedPro) return;
    setIsBookingLoading(true);
    try {
      await createBooking(
        bookedPro.id, 
        checkoutData.issueDescription,
        checkoutData.services,
        checkoutData.totalAmount,
        checkoutData.scheduledDate,
        checkoutData.scheduledTime
      );
      setBookingConfirmed(true);
      setCart([]);
      fetchMyBookings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to book');
    } finally {
      setIsBookingLoading(false);
    }
  };

  const submitDiagnostics = async (bookingId) => {
    try {
      await addDiagnostics(bookingId, diagnosticUrl || 'https://via.placeholder.com/150', diagnosticDetails);
      setShowDiagnosticFor(null);
      setDiagnosticUrl('');
      setDiagnosticDetails('');
      fetchMyBookings();
      alert('Diagnostics added! The pro will review them.');
    } catch (err) {
      alert('Failed to add diagnostics');
    }
  };

  // Specialization label mapping
  const specLabels = {
    plumbing: 'Plumber', cleaning: 'Cleaning Expert', electrical: 'Electrician',
    salon: 'Stylist', repairs: 'Handyman', painting: 'Painter',
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500 pb-24">
      
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <img src={logoImg} alt="Homie Logo" className="h-9 w-auto object-contain dark:bg-white/95 dark:p-1.5 dark:rounded-lg" />
             <div 
               onClick={() => setShowLocationPicker(true)}
               className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer transition-colors"
               title="Edit Location"
             >
               <MapPin size={16} className="text-slate-900 dark:text-white" />
               <span className="text-sm font-semibold border-b border-dashed border-slate-400 max-w-[180px] truncate">{user.location_text || 'Location not set'}</span>
             </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowCart(true)} className="relative p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              <ShoppingBag size={20} />
              {myBookings && myBookings.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white dark:border-[#0a0a0a]"></span>
              )}
            </button>
            <button onClick={toggleTheme} className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors hidden sm:block">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors hidden sm:block">
              <Bell size={20} />
            </button>
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
            
            <button 
              onClick={() => {
                if (!isVerified) {
                  onVerifyClick();
                } else {
                  setShowProfile(true);
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isVerified ? 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900' : 'border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20'}`}
            >
              <UserIcon size={16} className={isVerified ? 'text-slate-700 dark:text-slate-300' : 'text-red-600 dark:text-red-400'} />
              <span className={`text-sm font-semibold ${!isVerified && 'text-red-700 dark:text-red-400'}`}>
                {user.name || (isVerified ? "Profile" : "Verify Profile")}
              </span>
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

        {/* Premium Hero & Search */}
        <div className="mb-12 relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-900 p-8 sm:p-14 text-white shadow-2xl">
           <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-10 blur-3xl"></div>
           <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-400 opacity-20 blur-3xl"></div>
           
           <div className="relative z-10 max-w-2xl">
             <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-4xl sm:text-6xl font-black tracking-tight mb-4 leading-tight"
             >
               Premium Home Services,<br/>On Demand.
             </motion.h1>
             <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="text-blue-100 text-base sm:text-lg mb-8 font-medium max-w-xl"
             >
               Book verified professionals for cleaning, repairs, and beauty services instantly with AI-powered matchmaking.
             </motion.p>
             
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="relative w-full shadow-2xl rounded-2xl overflow-hidden flex"
             >
               <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                 <Search className="text-slate-400" size={22} />
               </div>
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="What do you need help with today?" 
                 className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none py-4 sm:py-5 pl-14 pr-16 text-base sm:text-lg font-semibold placeholder-slate-400"
               />
               <div className="absolute inset-y-0 right-2 flex items-center">
                 {searchQuery ? (
                   <button onClick={() => setSearchQuery("")} className="p-2 mr-2 text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
                     <X size={18} />
                   </button>
                 ) : (
                   <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors hidden sm:block shadow-md">
                     Search
                   </button>
                 )}
               </div>
             </motion.div>
           </div>
        </div>

        {/* Categories Grid (Bento Style) */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-black tracking-tight">Our Services</h2>
             {activeCategory !== 'all' && (
                <button onClick={() => setActiveCategory('all')} className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">Clear Filter</button>
             )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((cat, idx) => (
              <motion.button
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={cat.id}
                onClick={() => setActiveCategory(cat.id === activeCategory ? 'all' : cat.id)}
                className={`flex flex-col items-center justify-center p-5 sm:p-7 rounded-3xl border transition-all shadow-sm ${
                  activeCategory === cat.id 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-blue-500/20 shadow-lg ring-2 ring-blue-500/20' 
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0a] hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                }`}
              >
                <div className={`mb-3 ${activeCategory === cat.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {cat.icon}
                </div>
                <span className={`text-[13px] font-bold tracking-wide uppercase ${activeCategory === cat.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  {cat.name}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Service Catalog UI */}
        {activeCategory !== 'all' && (
          <ServiceCatalog categoryId={activeCategory} onAddToCart={handleAddToCart} cart={cart} />
        )}

        {/* Professionals List — from API */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {activeCategory !== 'all' ? `Available for ${categories.find(c => c.id === activeCategory)?.name}` : 'Recommended for You'}
            </h2>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-2.5 py-1 rounded-md">
              <Brain size={12} /> AI Ranked
            </span>
          </div>
          
          {loading ? (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
               <Loader2 className="mx-auto text-blue-600 mb-3 animate-spin" size={28} />
               <p className="text-slate-500 font-medium text-sm">Finding the best professionals near you...</p>
            </div>
          ) : apiError ? (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
               <MapPin className="mx-auto text-slate-400 mb-2" size={24} />
               <p className="text-slate-500 font-medium">{apiError}</p>
            </div>
          ) : professionals.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
               <Search className="mx-auto text-slate-400 mb-2" size={24} />
               <p className="text-slate-500 font-medium">No professionals found nearby.</p>
               <p className="text-slate-400 text-sm mt-1">Try expanding your search or changing the category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {professionals.map((pro) => (
                 <motion.div 
                   key={pro.id} 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col"
                 >
                   <div className="flex items-start gap-4 mb-4">
                     <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                        <img src={`https://ui-avatars.com/api/?name=${pro.name.replace(' ', '+')}&background=random&color=fff`} alt={pro.name} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1">
                       <div className="flex items-center gap-2">
                         <h3 className="font-bold text-base leading-tight">{pro.name}</h3>
                         {pro.is_verified && <ShieldCheck size={14} className="text-blue-600" />}
                       </div>
                       <p className="text-slate-500 dark:text-slate-400 text-[13px] font-medium mt-0.5 capitalize">
                         {specLabels[pro.specialization] || pro.specialization}
                       </p>
                       <div className="flex items-center gap-3 mt-1.5">
                         <div className="flex items-center gap-1">
                           <Star size={12} className="fill-slate-900 text-slate-900 dark:fill-white dark:text-white" />
                           <span className="text-[13px] font-bold">{pro.rating > 0 ? pro.rating.toFixed(1) : 'New'}</span>
                           {pro.reviews_count > 0 && <span className="text-[13px] text-slate-500">({pro.reviews_count})</span>}
                         </div>
                         <span className="text-[12px] text-slate-400 flex items-center gap-1">
                           <MapPin size={10} /> {pro.distance_km} km
                         </span>
                       </div>
                     </div>
                   </div>
                   
                   {/* AI Score Bar */}
                   <div className="mb-4">
                     <div className="flex items-center justify-between mb-1">
                       <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                         <Brain size={10} /> AI Match Score
                       </span>
                       <span className="text-[12px] font-bold text-blue-600">{pro.ai_score}%</span>
                     </div>
                     <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${pro.ai_score}%` }}
                         transition={{ duration: 0.8, delay: 0.2 }}
                         className="h-full bg-blue-600 rounded-full"
                       />
                     </div>
                   </div>

                   <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-lg font-bold">₹{pro.price_per_hour}</span>
                        <span className="text-xs text-slate-500 font-medium">/hr</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {pro.is_online && (
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online
                          </span>
                        )}
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
                 </motion.div>
               ))}
            </div>
          )}
        </div>
        {/* Slide-over Cart / Bookings Drawer */}
        <AnimatePresence>
          {showCart && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[80]"
                onClick={() => setShowCart(false)}
              />
              <motion.div 
                initial={{ x: '100%' }} 
                animate={{ x: 0 }} 
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-slate-50 dark:bg-[#0a0a0a] shadow-2xl z-[90] flex flex-col border-l border-slate-200 dark:border-slate-800"
              >
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#111]">
                  <h2 className="text-xl font-black flex items-center gap-2">
                    <ShoppingBag className="text-blue-600" /> My Bookings
                  </h2>
                  <button onClick={() => setShowCart(false)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  {myBookings.length > 0 ? myBookings.map(b => (
                 <div key={b._id} className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                         <div>
                           <h3 className="font-bold">{b.provider_id === 'fake' ? 'Professional' : 'Pro Assigned'}</h3>
                           <p className="text-xs text-slate-500 mt-1">Status: <span className={`font-bold uppercase ${b.status === 'en_route' ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>{b.status.replace('_', ' ')}</span></p>
                         </div>
                         {['pending', 'accepted', 'en_route'].includes(b.status) && (
                           <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-center border border-emerald-200 dark:border-emerald-800">
                             <p className="text-[10px] font-bold uppercase mb-0.5 tracking-wider">Start OTP</p>
                             <p className="text-xl font-black tracking-widest leading-none">{b.status === 'en_route' ? b.job_otp : '****'}</p>
                           </div>
                         )}
                      </div>
                      
                      {b.issue_description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3 rounded-lg">
                          "{b.issue_description}"
                        </p>
                      )}

                      {b.diagnostics_images && b.diagnostics_images.length > 0 && (
                        <div className="mb-3 text-xs text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/10 w-max px-2 py-1 rounded">
                          <CheckCircle2 size={12} /> Diagnostics Submitted
                        </div>
                      )}

                      {(b.status === 'pending' || b.status === 'accepted') && showDiagnosticFor !== b._id ? (
                        <button 
                          onClick={() => setShowDiagnosticFor(b._id)}
                          className="text-sm font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg"
                        >
                          <MapPin size={14} /> Add Pre-Service Photo/Details
                        </button>
                      ) : null}

                      {b.status === 'completed' && (
                        <button 
                          onClick={() => setShowReviewFor(b)}
                          className="text-sm font-semibold text-emerald-600 flex items-center gap-1 hover:text-emerald-700 transition-colors bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg"
                        >
                          <Star size={14} /> Leave a Review
                        </button>
                      )}

                      {['accepted', 'en_route', 'in_progress'].includes(b.status) && (
                        <button 
                          onClick={() => setShowChatFor(b)}
                          className="mt-3 text-sm font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-700 transition-colors bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-lg w-max"
                        >
                          <MessageCircle size={14} /> Open Live Chat
                        </button>
                      )}

                      {/* Diagnostics Upload UI */}
                      {showDiagnosticFor === b._id && (
                        <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                          <p className="text-xs font-bold mb-2 text-slate-700 dark:text-slate-300">Upload a photo or video:</p>
                          <input 
                            type="file" 
                            accept="image/*,video/*" 
                            capture="environment"
                            onChange={handleFileUpload} 
                            className="w-full text-sm p-2 border border-slate-200 rounded-lg mb-2 dark:bg-[#0a0a0a] dark:border-slate-700 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                          />
                          {diagnosticUrl && (
                             <div className="mb-2 relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                               <img src={diagnosticUrl} alt="Preview" className="w-full h-full object-cover" />
                             </div>
                          )}
                          <textarea placeholder="More details about the issue..." value={diagnosticDetails} onChange={e => setDiagnosticDetails(e.target.value)} className="w-full text-sm p-2 border border-slate-200 rounded-lg mb-2 h-16 dark:bg-[#0a0a0a] dark:border-slate-700 outline-none focus:border-blue-500"></textarea>
                          <div className="flex gap-2">
                             <button onClick={() => submitDiagnostics(b._id)} className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm">Submit</button>
                             <button onClick={() => setShowDiagnosticFor(null)} className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs px-4 py-2 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                 </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                      <ShoppingBag size={64} className="mb-4 text-slate-400" />
                      <p className="text-lg font-bold">Your cart is empty</p>
                      <p className="text-sm mt-2 font-medium">Book a service to see it here.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Booking Modal */}
      <AnimatePresence>
         {bookedPro && !bookingConfirmed && (
            <CheckoutModal 
              bookedPro={bookedPro} 
              cart={cart} 
              onClose={() => setBookedPro(null)} 
              onConfirm={handleConfirmCheckout} 
              isBookingLoading={isBookingLoading} 
            />
         )}

         {bookedPro && bookingConfirmed && (
           <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-6 relative z-10 shadow-2xl text-center"
              >
                 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} strokeWidth={3} />
                 </div>
                 <h2 className="text-xl font-bold mb-2">Request Sent!</h2>
                 <p className="text-slate-500 text-sm mb-6">
                   {bookedPro.name} has received your request. You can track the status in the Active Bookings section.
                 </p>
                 <button onClick={() => { setBookedPro(null); setBookingConfirmed(false); }} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
                   Got it
                 </button>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showReviewFor && (
            <ReviewModal 
              booking={showReviewFor}
              onClose={() => setShowReviewFor(null)}
              onComplete={() => {
                setShowReviewFor(null);
                fetchMyBookings();
              }}
            />
         )}
      </AnimatePresence>
      <AnimatePresence>
         {showChatFor && (
           <ChatModal 
             booking={showChatFor} 
             currentUser={user} 
             onClose={() => setShowChatFor(null)} 
           />
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showLocationPicker && (
           <LocationModal 
             isOpen={showLocationPicker} 
             currentLocation={user.location_text}
             onClose={() => setShowLocationPicker(false)}
             onSave={(newLoc) => {
               // Update location optimistically for this session
               user.location_text = newLoc;
               setShowLocationPicker(false);
             }}
           />
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showProfile && (
           <ProfileModal 
             isOpen={showProfile} 
             user={user} 
             onClose={() => setShowProfile(false)}
             onLogout={onLogout}
           />
         )}
      </AnimatePresence>
    </div>
  );
};

// --- PROVIDER DASHBOARD ---
const ProviderDashboard = ({ user, onLogout, toggleTheme, isDark, isVerified, onVerifyClick }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [showOtpInput, setShowOtpInput] = useState(null);
  const [otpValue, setOtpValue] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showChatFor, setShowChatFor] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Portfolio State
  const [portfolioImages, setPortfolioImages] = useState([
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&auto=format&fit=crop'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [bio, setBio] = useState('I am an experienced local professional. I might not have formal degrees, but my practical work and customer satisfaction speak for themselves!');
  const [isEditingExpertise, setIsEditingExpertise] = useState(false);

  const fetchBookings = async () => {
    try {
      const data = await getBookings();
      setBookings(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    try {
      await updateOnlineStatus(newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
      setIsOnline(!newStatus); // revert on error
    }
  };

  const handleAccept = async (jobId) => {
    try {
      await updateBookingStatus(jobId, 'accepted');
      fetchBookings();
    } catch(err) { 
      console.error(err);
      alert('Error accepting job: ' + (err.response?.data?.error || err.message)); 
    }
  };

  const handleUpdateStatus = async (jobId, status) => {
    try {
      await updateBookingStatus(jobId, status);
      fetchBookings();
    } catch(err) { 
      console.error(err);
      alert('Error updating status: ' + (err.response?.data?.error || err.message)); 
    }
  };

  const handleStartJob = async (jobId) => {
    try {
      await startJobWithOtp(jobId, otpValue);
      setShowOtpInput(null);
      setOtpValue('');
      fetchBookings();
      alert('Job started successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start job');
    }
  };

  const pendingJobs = bookings.filter(b => b.status === 'pending');
  const myActiveJobs = bookings.filter(b => ['accepted', 'en_route', 'in_progress'].includes(b.status));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500 pb-20">
      
      {/* Navbar */}
      <header className="bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src={logoImg} alt="Homie Logo" className="h-9 w-auto object-contain dark:bg-white/95 dark:p-1.5 dark:rounded-lg" />
             <span className="font-bold text-[11px] tracking-widest text-slate-400 uppercase hidden sm:inline ml-1 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full">Pro Portal</span>
             
             <div 
               onClick={() => setShowLocationPicker(true)}
               className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer transition-colors ml-2"
               title="Edit Location"
             >
               <MapPin size={16} className="text-slate-900 dark:text-white" />
               <span className="text-sm font-semibold border-b border-dashed border-slate-400 max-w-[150px] truncate">{user.location_text || 'Location'}</span>
             </div>
          </div>

          <div className="flex items-center gap-4">
             {isVerified && (
               <button 
                 onClick={handleToggleOnline}
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

        {/* Location Info */}
        <div className="flex items-center gap-2 mb-6 text-sm text-slate-500">
          <MapPin size={14} />
          <span className="font-medium">{user.location_text || 'Location not set'}</span>
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
           <div className={`bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 ${!isVerified && 'opacity-60'}`}>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Earnings This Week</span>
              <h3 className="text-3xl font-black mt-2">₹2,400</h3>
              <p className="text-xs font-semibold text-emerald-600 mt-2">+12% from last week</p>
           </div>
           <div className={`bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 ${!isVerified && 'opacity-60'}`}>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jobs Completed</span>
              <h3 className="text-3xl font-black mt-2">12</h3>
              <p className="text-xs font-semibold text-slate-500 mt-2">2 pending review</p>
           </div>
           <div className={`bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 ${!isVerified && 'opacity-60'}`}>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overall Rating</span>
              <h3 className="text-3xl font-black mt-2">{user.rating > 0 ? user.rating.toFixed(1) : '—'}</h3>
              <p className="text-xs font-semibold text-slate-500 mt-2">From {user.reviews_count || 0} customer reviews</p>
           </div>
        </div>

        {/* Portfolio & Expertise Module */}
        {isVerified && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                 <Star className="text-blue-600" size={20} /> My Expertise & Portfolio
              </h2>
              <button 
                 onClick={() => setIsEditingExpertise(!isEditingExpertise)}
                 className="text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                 {isEditingExpertise ? 'Save Changes' : 'Edit Profile'}
              </button>
            </div>
            
            <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
               {/* Bio Section */}
               <div className="mb-6">
                 <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Professional Bio</h3>
                 {isEditingExpertise ? (
                    <textarea 
                      value={bio} 
                      onChange={e => setBio(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm h-24 outline-none focus:border-blue-500"
                    />
                 ) : (
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                      {bio}
                    </p>
                 )}
               </div>

               {/* Portfolio Images Section */}
               <div>
                 <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Work Gallery</h3>
                 <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {portfolioImages.map((img, idx) => (
                      <div key={idx} className="relative w-32 h-32 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
                         <img src={img} alt="Portfolio" className="w-full h-full object-cover" />
                         {isEditingExpertise && (
                           <button 
                             onClick={() => setPortfolioImages(prev => prev.filter((_, i) => i !== idx))}
                             className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                           >
                             <X size={14} />
                           </button>
                         )}
                      </div>
                    ))}
                    
                    {isEditingExpertise && (
                      <div className="w-32 h-32 shrink-0 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center p-2 text-center">
                         <input 
                           type="text" 
                           placeholder="Image URL..." 
                           value={newImageUrl} 
                           onChange={e => setNewImageUrl(e.target.value)}
                           className="w-full text-[10px] p-1 mb-2 border rounded bg-white dark:bg-[#0a0a0a] dark:border-slate-700"
                         />
                         <button 
                           onClick={() => {
                             if (newImageUrl) {
                               setPortfolioImages(prev => [...prev, newImageUrl]);
                               setNewImageUrl('');
                             }
                           }}
                           className="text-xs font-bold text-blue-600 hover:text-blue-700"
                         >
                           + Add
                         </button>
                      </div>
                    )}
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* Job Board */}
        <div>
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold">New Job Requests</h2>
             {isOnline && isVerified && <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-1 rounded-md"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />Live</span>}
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
           ) : pendingJobs.length === 0 && myActiveJobs.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
                 <Search className="mx-auto text-slate-400 mb-3" size={32} />
                 <h3 className="font-bold text-slate-900 dark:text-white">No active requests</h3>
                 <p className="text-slate-500 text-sm mt-1">We'll notify you when a job matches your skills.</p>
              </div>
           ) : (
              <div className="space-y-6">
                
                {/* Pending Requests */}
                {pendingJobs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Pending Requests</h3>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {pendingJobs.map((job) => (
                          <motion.div 
                            key={job._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-[#0f0f0f] border-2 border-blue-200 dark:border-blue-900/50 shadow-md shadow-blue-50 dark:shadow-blue-950 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div>
                                <h3 className="font-bold text-base mb-1">New Request from {job.customer_name}</h3>
                                {job.issue_description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">"{job.issue_description}"</p>}
                                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                                  <span className="flex items-center gap-1"><MapPin size={12} /> {job.customer_location}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0">
                                <button onClick={() => setSelectedJob(job)} className="flex-1 md:flex-none bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                                  View Details
                                </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Active Jobs */}
                {myActiveJobs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">My Active Jobs</h3>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {myActiveJobs.map((job) => (
                          <motion.div 
                            key={job._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-bold text-base mb-1">{job.customer_name}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">"{job.issue_description}"</p>
                              </div>
                              <span className="text-xs font-bold uppercase text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                                {job.status.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Diagnostics Viewer */}
                            {job.diagnostics_images && job.diagnostics_images.length > 0 && (
                               <div className="mb-4 bg-white dark:bg-[#0a0a0a] p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                 <p className="text-xs font-bold text-slate-500 mb-2">Customer Diagnostics:</p>
                                 {job.diagnostics_images.map((diag, i) => (
                                   <div key={i} className="text-sm">
                                     {diag.url && (
                                       diag.url.startsWith('data:image') || diag.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                         <img src={diag.url} alt="Diagnostics" className="w-full max-h-48 object-cover rounded-lg mb-2 border border-slate-200 dark:border-slate-700" />
                                       ) : (
                                         <p className="text-blue-500 underline text-xs break-all mb-1">{diag.url}</p>
                                       )
                                     )}
                                     {diag.details && <p className="text-slate-700 dark:text-slate-300">"{diag.details}"</p>}
                                   </div>
                                 ))}
                               </div>
                            )}

                            {['accepted', 'en_route', 'in_progress'].includes(job.status) && (
                              <button 
                                onClick={() => setShowChatFor(job)}
                                className="mb-4 w-max text-sm font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-700 transition-colors bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-lg"
                              >
                                <MessageCircle size={14} /> Open Live Chat
                              </button>
                            )}

                            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
                               {job.status === 'accepted' && (
                                 <button onClick={() => handleUpdateStatus(job._id, 'en_route')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl text-sm font-bold flex-1 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                                   Enroute & Send OTP
                                 </button>
                               )}
                               
                               {job.status === 'en_route' && showOtpInput !== job._id && (
                                 <button onClick={() => setShowOtpInput(job._id)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex-1">
                                   Arrived - Enter OTP to Start
                                 </button>
                               )}

                               {job.status === 'en_route' && showOtpInput === job._id && (
                                 <div className="flex gap-2 flex-1 items-center">
                                   <input 
                                     type="text" 
                                     placeholder="4-digit OTP" 
                                     maxLength={4}
                                     value={otpValue}
                                     onChange={e => setOtpValue(e.target.value)}
                                     className="w-24 text-center p-2 rounded bg-white dark:bg-[#0a0a0a] border border-slate-300 dark:border-slate-700 font-bold"
                                   />
                                   <button onClick={() => handleStartJob(job._id)} className="bg-emerald-600 text-white px-4 py-2 rounded font-bold">Start</button>
                                   <button onClick={() => setShowOtpInput(null)} className="text-slate-500 text-sm font-bold px-2">Cancel</button>
                                 </div>
                               )}

                               {job.status === 'in_progress' && (
                                 <button onClick={() => handleUpdateStatus(job._id, 'completed')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex-1">
                                   Mark as Completed
                                 </button>
                               )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
           )}
        </div>

        <AnimatePresence>
          {selectedJob && (
            <JobDetailsModal 
              job={selectedJob} 
              onClose={() => setSelectedJob(null)} 
              onAccept={handleAccept} 
              onDecline={(jobId) => handleUpdateStatus(jobId, 'declined')} 
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showChatFor && (
            <ChatModal 
              booking={showChatFor} 
              currentUser={user} 
              onClose={() => setShowChatFor(null)} 
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLocationPicker && (
            <LocationModal 
              isOpen={showLocationPicker} 
              currentLocation={user.location_text}
              onClose={() => setShowLocationPicker(false)}
              onSave={(newLoc) => {
                // Update location optimistically for this session
                user.location_text = newLoc;
                setShowLocationPicker(false);
              }}
            />
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default Dashboard;
