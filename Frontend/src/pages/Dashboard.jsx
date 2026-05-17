import React, { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Bell, Star, ChevronRight, Navigation,
  Wrench, Scissors, PaintRoller, Sparkles, Zap, Droplets,
  TrendingUp, Calendar, Clock, CheckCircle2, LogOut, Sun, Moon,
  ShieldAlert, ShieldCheck, ArrowRight, X, User as UserIcon, Check, Power, Brain, Loader2, MessageCircle, ShoppingBag, XCircle, CalendarClock, AlertCircle, Wand2,
  Eye, BadgeCheck, Microscope, ImageIcon
} from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { autoMatchBooking, cancelBooking, rescheduleBooking, getNearbyProfessionals, getBookings, createBooking, updateBookingStatus, addDiagnostics, startJobWithOtp, getProfessionalStats, updateProProfile } from '../api';
import logoImg from '../assets/logo.png';
import ServiceCatalog from '../components/ServiceCatalog';
import CheckoutModal from '../components/CheckoutModal';
import ReviewModal from '../components/ReviewModal';
import JobDetailsModal from '../components/JobDetailsModal';
import ChatModal from '../components/ChatModal';
import LocationModal from '../components/LocationModal';
import ProfileModal from '../components/ProfileModal';
import TrackingModal from '../components/TrackingModal';
import ClaimWarrantyModal from '../components/ClaimWarrantyModal';

const Dashboard = ({ user, onLogout, isVerified, onVerifyClick }) => {
  const [colorTheme, toggleTheme] = useDarkMode();
  const isDark = colorTheme === "light";
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const socket = io('http://13.201.29.187:5000', {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      timeout: 10000
    });
    socket.emit('join', { user_id: user.id });
    
    socket.on('notification', (data) => {
      setNotifications(prev => [data, ...prev]);
      // Show browser alert for immediate visibility
      if (data.title && data.message) {
        // Optional browser notification
      }
    });
    
    return () => socket.disconnect();
  }, [user.id]);
  
  if (user.role === 'provider') {
    return <ProviderDashboard user={user} onLogout={onLogout} toggleTheme={toggleTheme} isDark={isDark} isVerified={isVerified} onVerifyClick={onVerifyClick} notifications={notifications} showNotifications={showNotifications} setShowNotifications={setShowNotifications} />;
  }
  
  return <CustomerDashboard user={user} onLogout={onLogout} toggleTheme={toggleTheme} isDark={isDark} isVerified={isVerified} onVerifyClick={onVerifyClick} notifications={notifications} showNotifications={showNotifications} setShowNotifications={setShowNotifications} />;
};

// --- CUSTOMER DASHBOARD ---
const CustomerDashboard = ({ user, onLogout, toggleTheme, isDark, isVerified, onVerifyClick, notifications, showNotifications, setShowNotifications }) => {
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

  // Reschedule & Cancel state
  const [showCancelConfirmFor, setShowCancelConfirmFor] = useState(null);
  const [showRescheduleFor, setShowRescheduleFor] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // Tracking state
  const [showTrackingFor, setShowTrackingFor] = useState(null);

  // Warranty state
  const [showWarrantyFor, setShowWarrantyFor] = useState(null);

  // Auto-Match & Cart State
  const [cart, setCart] = useState([]);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [matchingStatus, setMatchingStatus] = useState("Finding experts near you...");

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

  useEffect(() => {
    fetchMyBookings();
    
    // Cleanup
    return () => {
      setProfessionals([]);
      setMyBookings([]);
    };
  }, []);

  // Smart Search Mapping — natural language → category
  useEffect(() => {
    if (!searchQuery) return;
    const lowerQuery = searchQuery.toLowerCase();
    
    const keywordMap = {
      cleaning: ['clean', 'dust', 'sweep', 'mop', 'bathroom', 'kitchen', 'sofa', 'carpet', 'pest', 'cockroach', 'dirty', 'stain', 'smell', 'floor', 'window', 'hygiene', 'disinfect', 'deep clean'],
      repairs: ['repair', 'fix', 'broken', 'carpenter', 'wood', 'furniture', 'door', 'cabinet', 'table', 'chair', 'hinge', 'lock', 'key', 'handle', 'wardrobe', 'shelf'],
      plumbing: ['leak', 'leaking', 'pipe', 'water', 'tap', 'sink', 'toilet', 'drain', 'plumber', 'clog', 'blockage', 'flush', 'drip', 'geyser', 'washbasin', 'overflow', 'seepage', 'tank'],
      electrical: ['fan', 'light', 'wire', 'switch', 'ac', 'cooler', 'electrician', 'bulb', 'plug', 'power', 'socket', 'circuit', 'breaker', 'mcb', 'fuse', 'inverter', 'wiring', 'short', 'voltage', 'heater'],
      salon: ['hair', 'cut', 'massage', 'facial', 'spa', 'makeup', 'beauty', 'nails', 'pedicure', 'manicure', 'wax', 'threading', 'bridal', 'grooming', 'shave', 'trim', 'dye', 'color'],
      painting: ['paint', 'wall', 'color', 'brush', 'primer', 'whitewash', 'texture', 'waterproof', 'polish', 'varnish', 'putty', 'distemper']
    };

    for (const [category, keywords] of Object.entries(keywordMap)) {
      if (keywords.some(kw => lowerQuery.includes(kw))) {
        setActiveCategory(category);
        break;
      }
    }
  }, [searchQuery]);

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
    { id: 'cleaning', name: 'Cleaning', icon: <Sparkles size={24} strokeWidth={1.5} />, img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=150&h=150&fit=crop' },
    { id: 'plumbing', name: 'Plumbing', icon: <Droplets size={24} strokeWidth={1.5} />, img: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=150&h=150&fit=crop' },
    { id: 'repairs', name: 'Repairs', icon: <Wrench size={24} strokeWidth={1.5} />, img: 'https://images.unsplash.com/photo-1581141849291-1125c7b692b5?w=150&h=150&fit=crop' },
    { id: 'painting', name: 'Painting', icon: <PaintRoller size={24} strokeWidth={1.5} />, img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=150&h=150&fit=crop' },
    { id: 'salon', name: 'Salon', icon: <Scissors size={24} strokeWidth={1.5} />, img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&h=150&fit=crop' },
    { id: 'electrical', name: 'Electrical', icon: <Zap size={24} strokeWidth={1.5} />, img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=150&h=150&fit=crop' },
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
      setMyBookings((data || []).filter(b => b.is_customer));
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

  const handleCancelBooking = async (bookingId) => {
    try {
      const res = await cancelBooking(bookingId);
      alert(res.cancellation_fee > 0 ? `Booking cancelled. A fee of ₹${res.cancellation_fee} was applied.` : 'Booking cancelled successfully.');
      setShowCancelConfirmFor(null);
      fetchMyBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel booking');
    }
  };

  const handleRescheduleBooking = async (bookingId) => {
    if (!newDate || !newTime) return alert("Please select date and time");
    try {
      await rescheduleBooking(bookingId, newDate, newTime);
      alert("Booking rescheduled successfully");
      setShowRescheduleFor(null);
      fetchMyBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reschedule booking');
    }
  };

  const handleAutoMatch = async () => {
    if (cart.length === 0) return alert("Select at least one service");
    
    setIsMatching(true);
    setMatchResult(null);
    setMatchingStatus("Analyzing your requirements...");

    try {
      // Simulate matching phases for UX
      setTimeout(() => setMatchingStatus("Scanning for top-rated professionals..."), 1500);
      setTimeout(() => setMatchingStatus("Pinging nearby experts..."), 3000);

      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const res = await autoMatchBooking(activeCategory, cart, totalAmount);
      
      // Delay final success to show UI
      setTimeout(() => {
        setMatchResult(res);
        setIsMatching(false);
        setCart([]); // Clear cart on success
        fetchMyBookings();
      }, 4500);

    } catch (err) {
      setTimeout(() => {
        setIsMatching(false);
        alert(err.response?.data?.error || "No professionals available right now.");
      }, 2000);
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
             <img src={logoImg} alt="Homie Logo" className="h-16 w-auto object-contain dark:bg-white/95 dark:p-1.5 dark:rounded-lg" />
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
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0a0a0a]"></span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold">Notifications</h3>
                    <button onClick={() => setNotifications([])} className="text-xs text-blue-600 hover:text-blue-700">Clear All</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-slate-500 text-center">No new notifications</p>
                    ) : (
                      notifications.map((notif, idx) => (
                        <div key={idx} className="p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <h4 className="text-sm font-bold">{notif.title}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
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
               Home services, <br/>on demand.
             </motion.h1>
             <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="text-blue-100 text-base sm:text-lg mb-8 font-medium max-w-xl"
             >
               Book verified professionals for repairs, cleaning, and beauty. AI-powered matching in seconds.
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
                 placeholder="Try: leaking tap, broken fan, deep cleaning..." 
                 className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none py-4 sm:py-5 pl-14 pr-16 text-base sm:text-lg font-semibold placeholder-slate-400"
               />
               <div className="absolute inset-y-0 right-2 flex items-center">
                 {searchQuery ? (
                   <button onClick={() => { setSearchQuery(""); setActiveCategory("all"); }} className="p-2 mr-2 text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
                     <X size={18} />
                   </button>
                 ) : (
                   <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors hidden sm:block shadow-md">
                     Search
                   </button>
                 )}
               </div>
             </motion.div>

             {/* Quick Search Chips */}
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.35 }}
               className="flex flex-wrap gap-2 mt-5"
             >
               {['Leaking tap', 'AC not cooling', 'Fan repair', 'Deep cleaning', 'Haircut at home', 'Wall painting'].map((term) => (
                 <button 
                   key={term}
                   onClick={() => setSearchQuery(term)}
                   className="text-xs font-bold text-white/90 bg-white/15 hover:bg-white/25 px-3.5 py-1.5 rounded-full backdrop-blur-sm transition-colors border border-white/10"
                 >
                   {term}
                 </button>
               ))}
             </motion.div>
           </div>
        </div>

        {/* How It Works */}
        {activeCategory === 'all' && (
          <div className="mb-12">
            <h2 className="text-2xl font-black tracking-tight mb-6 text-center">How Homie Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Describe', desc: 'Tell us what you need or search for a service.', icon: <Search size={24} className="text-blue-600" /> },
                { step: '2', title: 'AI Match', desc: 'Our engine finds the best-rated pro near you.', icon: <Brain size={24} className="text-indigo-600" /> },
                { step: '3', title: 'Confirm', desc: 'Review pricing, schedule, and confirm via OTP.', icon: <ShieldCheck size={24} className="text-emerald-600" /> },
                { step: '4', title: 'Relax', desc: 'Your verified pro arrives. Pay after the job.', icon: <CheckCircle2 size={24} className="text-amber-500" /> },
              ].map((item) => (
                <motion.div 
                  key={item.step}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Number(item.step) * 0.1 }}
                  className="relative bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center text-xs font-black shadow-md">
                    {item.step}
                  </div>
                  <div className="mt-3 mb-3 flex justify-center">{item.icon}</div>
                  <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Banner Section */}
        <div className="mb-10 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
           <div className="min-w-[300px] sm:min-w-[400px] h-40 rounded-3xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center p-6 text-white shadow-lg relative overflow-hidden shrink-0">
             <div className="relative z-10 w-2/3">
               <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-1 rounded-md mb-2 inline-block">Offer</span>
               <h3 className="font-bold text-xl sm:text-2xl mb-1">Save 15% on AC Service</h3>
               <p className="text-sm text-blue-100 mb-3">Get your AC summer ready.</p>
               <button className="bg-white text-blue-600 text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:scale-105 transition-transform">Book Now</button>
             </div>
             <div className="absolute right-[-20px] bottom-[-20px] opacity-20"><Zap size={150} /></div>
           </div>
           <div className="min-w-[300px] sm:min-w-[400px] h-40 rounded-3xl bg-gradient-to-r from-emerald-500 to-emerald-700 flex items-center p-6 text-white shadow-lg relative overflow-hidden shrink-0">
             <div className="relative z-10 w-2/3">
               <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-1 rounded-md mb-2 inline-block">New</span>
               <h3 className="font-bold text-xl sm:text-2xl mb-1">Expert Inspection</h3>
               <p className="text-sm text-emerald-100 mb-3">Not sure what's broken? We'll check.</p>
               <button className="bg-white text-emerald-600 text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:scale-105 transition-transform">Explore</button>
             </div>
             <div className="absolute right-[-20px] bottom-[-20px] opacity-20"><ShieldCheck size={150} /></div>
           </div>
        </div>

        {/* Categories Grid (Urban Company Style) */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-black tracking-tight">What are you looking for?</h2>
             {activeCategory !== 'all' && (
                <button onClick={() => setActiveCategory('all')} className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">Clear Filter</button>
             )}
          </div>
          
          <div className="flex gap-4 sm:gap-8 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {categories.map((cat, idx) => (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                key={cat.id}
                onClick={() => setActiveCategory(cat.id === activeCategory ? 'all' : cat.id)}
                className="flex flex-col items-center cursor-pointer shrink-0 w-20 sm:w-28 snap-start"
              >
                <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl mb-3 overflow-hidden shadow-sm border-2 transition-all ${
                  activeCategory === cat.id 
                  ? 'border-blue-500 p-1 bg-blue-50 dark:bg-blue-900/20 shadow-blue-500/30 shadow-lg ring-2 ring-blue-500/20' 
                  : 'border-transparent bg-slate-100 dark:bg-slate-900 hover:shadow-md'
                }`}>
                  <img src={cat.img} alt={cat.name} className={`w-full h-full object-cover rounded-xl sm:rounded-2xl ${activeCategory === cat.id ? '' : 'opacity-90'}`} />
                </div>
                <span className={`text-[12px] sm:text-[14px] font-bold tracking-wide text-center leading-tight ${activeCategory === cat.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  {cat.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Homie Guarantee Section */}
        {activeCategory === 'all' && (
          <div className="mb-14 grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                <ShieldCheck className="text-blue-600 mb-3 bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full" size={56} strokeWidth={1.5} />
                <h3 className="font-bold mb-1 text-lg">Homie Safe</h3>
                <p className="text-sm text-slate-500 font-medium">Up to ₹10,000 insurance against damages on all services.</p>
             </div>
             <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                <Clock className="text-emerald-600 mb-3 bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-full" size={56} strokeWidth={1.5} />
                <h3 className="font-bold mb-1 text-lg">On-Time Arrival</h3>
                <p className="text-sm text-slate-500 font-medium">If your professional is late, we'll credit ₹100 to your wallet.</p>
             </div>
             <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                <Wand2 className="text-indigo-600 mb-3 bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full" size={56} strokeWidth={1.5} />
                <h3 className="font-bold mb-1 text-lg">Expert Professionals</h3>
                <p className="text-sm text-slate-500 font-medium">Top 1% rated, background-verified pros with 5+ years experience.</p>
             </div>
          </div>
        )}

        {/* Service Catalog UI */}
        {activeCategory !== 'all' && (
          <ServiceCatalog 
            categoryId={activeCategory} 
            onAddToCart={handleAddToCart} 
            cart={cart} 
            onAutoMatch={handleAutoMatch}
          />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
               {professionals.map((pro) => (
                 <motion.div 
                   key={pro.id} 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   whileHover={{ y: -4 }}
                   className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-xl transition-all flex flex-col group"
                 >
                   {/* Pro Header */}
                   <div className="p-5 pb-3">
                     <div className="flex items-start gap-4">
                       <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-sm">
                          <img src={`https://ui-avatars.com/api/?name=${pro.name.replace(' ', '+')}&background=0D8ABC&color=fff&bold=true&size=128`} alt={pro.name} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-1.5">
                           <h3 className="font-bold text-base leading-tight truncate">{pro.name}</h3>
                           {pro.is_verified && <BadgeCheck size={16} className="text-blue-600 shrink-0" />}
                         </div>
                         <p className="text-slate-500 dark:text-slate-400 text-[13px] font-medium mt-0.5 capitalize">
                           {specLabels[pro.specialization] || pro.specialization}
                         </p>
                         <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                           <div className="flex items-center gap-1">
                             <Star size={13} className="fill-amber-400 text-amber-400" />
                             <span className="text-[13px] font-bold">{pro.rating > 0 ? pro.rating.toFixed(1) : 'New'}</span>
                             {pro.reviews_count > 0 && <span className="text-[12px] text-slate-400">({pro.reviews_count})</span>}
                           </div>
                           <span className="text-[12px] text-slate-400 flex items-center gap-1">
                             <MapPin size={10} /> {pro.distance_km} km
                           </span>
                           {pro.is_online && (
                             <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online
                             </span>
                           )}
                         </div>
                       </div>
                     </div>

                     {/* Bio snippet */}
                     {pro.bio && (
                       <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed line-clamp-2">
                         "{pro.bio}"
                       </p>
                     )}
                   </div>

                   {/* Portfolio strip */}
                   {pro.portfolio_images && pro.portfolio_images.length > 0 && (
                     <div className="px-5 pb-3">
                       <div className="flex gap-2 overflow-hidden">
                         {pro.portfolio_images.slice(0, 3).map((img, idx) => (
                           <div key={idx} className="w-20 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
                             <img src={img} alt="Work" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                           </div>
                         ))}
                         {pro.portfolio_images.length > 3 && (
                           <div className="w-20 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                             <span className="text-[11px] font-bold text-slate-500">+{pro.portfolio_images.length - 3}</span>
                           </div>
                         )}
                       </div>
                     </div>
                   )}
                   
                   {/* AI Score Bar */}
                   <div className="px-5 pb-3">
                     <div className="flex items-center justify-between mb-1">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                         <Brain size={10} /> AI Match
                       </span>
                       <span className="text-[11px] font-bold text-blue-600">{pro.ai_score}%</span>
                     </div>
                     <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${pro.ai_score}%` }}
                         transition={{ duration: 0.8, delay: 0.2 }}
                         className={`h-full rounded-full ${pro.ai_score >= 70 ? 'bg-blue-600' : pro.ai_score >= 40 ? 'bg-amber-500' : 'bg-slate-400'}`}
                       />
                     </div>
                   </div>

                   {/* Footer */}
                   <div className="flex items-center justify-between mt-auto px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                      <div>
                        <span className="text-lg font-black">₹{pro.price_per_hour}</span>
                        <span className="text-xs text-slate-500 font-medium">/hr</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (!isVerified) onVerifyClick();
                          else setBookedPro(pro);
                        }}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl text-[13px] font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
                      >
                        Book Now
                      </button>
                   </div>
                 </motion.div>
               ))}
            </div>
          )}
        </div>

        {/* Most Booked Services — Trending */}
        {activeCategory === 'all' && (
          <div className="mb-14 mt-8">
            <h2 className="text-2xl font-black tracking-tight mb-6">Most Booked Services</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { name: 'AC Service & Repair', price: 599, cat: 'repairs', icon: <Zap size={20} className="text-blue-500" /> },
                { name: 'Deep Home Cleaning', price: 1499, cat: 'cleaning', icon: <Sparkles size={20} className="text-emerald-500" /> },
                { name: 'Electrician Visit', price: 199, cat: 'electrical', icon: <Zap size={20} className="text-amber-500" /> },
                { name: 'Plumber Visit', price: 199, cat: 'plumbing', icon: <Droplets size={20} className="text-cyan-500" /> },
                { name: 'Haircut at Home', price: 199, cat: 'salon', icon: <Scissors size={20} className="text-pink-500" /> },
                { name: 'Wall Painting', price: 2499, cat: 'painting', icon: <PaintRoller size={20} className="text-orange-500" /> },
                { name: 'Tap Leak Fix', price: 199, cat: 'plumbing', icon: <Droplets size={20} className="text-blue-400" /> },
                { name: 'Fan Installation', price: 249, cat: 'electrical', icon: <Zap size={20} className="text-yellow-500" /> },
              ].map((item, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setActiveCategory(item.cat); }}
                  className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-left hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold truncate">{item.name}</h3>
                      <p className="text-xs text-slate-500">from <span className="font-bold text-slate-900 dark:text-white">₹{item.price}</span></p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Footer — Trust & Stats */}
        {activeCategory === 'all' && (
          <div className="mt-8 mb-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Professionals', value: '2,500+' },
                  { label: 'Services Completed', value: '50,000+' },
                  { label: 'Cities', value: '25+' },
                  { label: 'Customer Rating', value: '4.8★' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <h3 className="text-2xl sm:text-3xl font-black">{stat.value}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-emerald-400" size={24} />
                  <div>
                    <p className="text-sm font-bold">100% Satisfaction Guarantee</p>
                    <p className="text-xs text-slate-400">Free re-service if you're not happy</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>© 2026 Homie</span>
                  <span>•</span>
                  <span>Made with ❤️ in India</span>
                </div>
              </div>
            </div>
          </div>
        )}
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
                         </div>
                         {['pending', 'accepted', 'en_route', 'arrived'].includes(b.status) && (
                            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-center border border-slate-800 shadow-sm">
                              <p className="text-[10px] font-bold uppercase mb-0.5 tracking-wider opacity-80">Start OTP</p>
                              <p className="text-xl font-black tracking-widest leading-none">{b.status === 'arrived' ? b.job_otp : '****'}</p>
                            </div>
                         )}
                      </div>
                      
                      {/* Visual Status Timeline */}
                      <div className="mb-4 mt-1">
                        {(() => {
                          const steps = ['pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed'];
                          const stepLabels = { pending: 'Placed', accepted: 'Accepted', en_route: 'On Way', arrived: 'Arrived', in_progress: 'Working', completed: 'Done' };
                          const currentIdx = steps.indexOf(b.status);
                          const isCancelled = b.status === 'cancelled';
                          
                          if (isCancelled) {
                            return (
                              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/10 text-red-600 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                                <XCircle size={16} />
                                <span className="text-xs font-bold uppercase">Booking Cancelled</span>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="flex items-center gap-0">
                              {steps.map((step, idx) => {
                                const isPast = idx < currentIdx;
                                const isCurrent = idx === currentIdx;
                                return (
                                  <React.Fragment key={step}>
                                    <div className="flex flex-col items-center" title={stepLabels[step]}>
                                      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                                        isPast ? 'bg-blue-600' : isCurrent ? 'bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/50' : 'bg-slate-200 dark:bg-slate-700'
                                      }`}>
                                        {isPast && <Check size={10} className="text-white" strokeWidth={3} />}
                                        {isCurrent && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                                      </div>
                                      <span className={`text-[8px] font-bold mt-1 uppercase tracking-wider ${isCurrent ? 'text-blue-600' : isPast ? 'text-slate-500' : 'text-slate-300 dark:text-slate-600'}`}>
                                        {stepLabels[step]}
                                      </span>
                                    </div>
                                    {idx < steps.length - 1 && (
                                      <div className={`flex-1 h-0.5 mt-[-12px] min-w-[12px] ${isPast ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                      
                      {b.issue_description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3 rounded-lg">
                          "{b.issue_description}"
                        </p>
                      )}

                      {b.diagnostics_images && b.diagnostics_images.length > 0 && (
                        <div className="mb-3 text-xs text-blue-600 font-bold flex items-center gap-1 bg-blue-50 dark:bg-blue-900/10 w-max px-2 py-1 rounded">
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
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowReviewFor(b)}
                            className="text-sm font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-700 transition-colors bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-lg"
                          >
                            <Star size={14} /> Leave a Review
                          </button>
                          <button 
                            onClick={() => setShowWarrantyFor(b)}
                            className="text-sm font-semibold text-emerald-600 flex items-center gap-1 hover:text-emerald-700 transition-colors bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg"
                          >
                            <ShieldAlert size={14} /> Claim Warranty
                          </button>
                        </div>
                      )}

                      {['accepted', 'en_route', 'arrived', 'in_progress'].includes(b.status) && (
                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={() => setShowChatFor(b)}
                            className="flex-1 text-sm font-semibold text-indigo-600 flex items-center justify-center gap-1 hover:text-indigo-700 transition-colors bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-lg"
                          >
                            <MessageCircle size={14} /> Chat
                          </button>
                          {b.status === 'en_route' && (
                            <button 
                              onClick={() => setShowTrackingFor(b)}
                              className="flex-1 text-sm font-semibold text-amber-600 flex items-center justify-center gap-1 hover:text-amber-700 transition-colors bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800"
                            >
                              <Navigation size={14} /> Track Pro
                            </button>
                          )}
                        </div>
                      )}

                      {/* Cancel & Reschedule buttons */}
                      {['pending', 'accepted'].includes(b.status) && (
                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={() => setShowCancelConfirmFor(b._id)}
                            className="flex-1 text-sm font-semibold text-red-600 flex items-center justify-center gap-1 hover:text-red-700 transition-colors bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg"
                          >
                            <XCircle size={14} /> Cancel
                          </button>
                          <button 
                            onClick={() => {
                              setShowRescheduleFor(b);
                              setNewDate(b.scheduled_date || '');
                              setNewTime(b.scheduled_time || '');
                            }}
                            className="flex-1 text-sm font-semibold text-blue-600 flex items-center justify-center gap-1 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg"
                          >
                            <CalendarClock size={14} /> Reschedule
                          </button>
                        </div>
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

                {/* Cart Footer with Pricing Intelligence */}
                {cart.length > 0 && (
                  <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-bold">₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
                      </div>
                      
                      {cart.length >= 3 && (
                        <div className="flex justify-between text-sm text-emerald-600 font-bold">
                          <span>Combo Discount (10% Off)</span>
                          <span>-₹{Math.round(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.1)}</span>
                        </div>
                      )}

                      {new Date().getHours() >= 17 && new Date().getHours() <= 21 && (
                        <div className="flex justify-between text-sm text-amber-600 font-bold">
                          <span className="flex items-center gap-1"><Zap size={14} /> Peak Hour Surge (1.2x)</span>
                          <span>+20%</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-lg font-black">Total</span>
                        <span className="text-2xl font-black text-blue-600">
                          ₹{Math.round(
                            (cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * (cart.length >= 3 ? 0.9 : 1)) * 
                            (new Date().getHours() >= 17 && new Date().getHours() <= 21 ? 1.2 : 1)
                          )}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={handleAutoMatch}
                      className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                      <Wand2 size={20} /> Auto-Match & Book Now
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-3 font-bold uppercase tracking-widest">
                      Secure payment via Homie Pay
                    </p>
                  </div>
                )}
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
         {showTrackingFor && (
            <TrackingModal 
              booking={showTrackingFor}
              onClose={() => setShowTrackingFor(null)}
              socket={socket}
            />
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showWarrantyFor && (
            <ClaimWarrantyModal 
              booking={showWarrantyFor}
              onClose={() => setShowWarrantyFor(null)}
            />
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

      {/* Reschedule Modal */}
      <AnimatePresence>
         {showRescheduleFor && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRescheduleFor(null)} />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-6 relative z-10 shadow-2xl">
                 <h2 className="text-xl font-bold mb-4">Reschedule Booking</h2>
                 <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-bold mb-1">New Date</label>
                      <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">New Time</label>
                      <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                 </div>
                 <div className="flex gap-3">
                   <button onClick={() => setShowRescheduleFor(null)} className="flex-1 bg-slate-100 dark:bg-slate-800 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                   <button onClick={() => handleRescheduleBooking(showRescheduleFor._id)} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors">Confirm</button>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
         {showCancelConfirmFor && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCancelConfirmFor(null)} />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-6 relative z-10 shadow-2xl text-center">
                 <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                 </div>
                 <h2 className="text-xl font-bold mb-2">Cancel Booking?</h2>
                 <p className="text-slate-500 text-sm mb-6">Are you sure you want to cancel this booking? If the professional is already on their way, a ₹50 cancellation fee may apply.</p>
                 <div className="flex gap-3">
                   <button onClick={() => setShowCancelConfirmFor(null)} className="flex-1 bg-slate-100 dark:bg-slate-800 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">No, Keep It</button>
                   <button onClick={() => handleCancelBooking(showCancelConfirmFor)} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors">Yes, Cancel</button>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

      {/* MATCHING OVERLAY */}
      <AnimatePresence>
        {isMatching && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl text-white p-6 text-center"
          >
            <div className="relative mb-12">
               {/* Pulsing circles */}
               <motion.div 
                 animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="absolute inset-0 bg-blue-500 rounded-full blur-3xl"
               />
               <div className="relative w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50">
                  <Brain size={48} className="animate-pulse" />
               </div>
            </div>
            
            <motion.h2 
              key={matchingStatus}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black mb-4 tracking-tight"
            >
              {matchingStatus}
            </motion.h2>
            <p className="text-slate-400 font-medium max-w-xs mx-auto">
              We're matching you with the highest-rated "Homie" available right now.
            </p>
            
            <div className="mt-12 flex gap-1">
               {[0, 1, 2].map(i => (
                 <motion.div 
                   key={i}
                   animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                   transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                   className="w-2 h-2 bg-blue-500 rounded-full"
                 />
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MATCH SUCCESS MODAL */}
      <AnimatePresence>
        {matchResult && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
              onClick={() => setMatchResult(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl p-8 relative z-10 shadow-2xl text-center"
            >
               <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles size={40} />
               </div>
               <h2 className="text-2xl font-black mb-2">Homie Assigned!</h2>
               <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                 We've matched you with <span className="font-bold text-slate-900 dark:text-white">{matchResult.provider.name}</span>. 
                 They are just <span className="font-bold text-blue-600">{matchResult.provider.distance_km}km</span> away!
               </p>
               
               <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 mb-8 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                    <span className="font-bold">{matchResult.provider.rating} Rating</span>
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Rated</div>
               </div>

               <button 
                onClick={() => { setMatchResult(null); setShowCart(true); }}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
               >
                 View Booking Details
               </button>
            </motion.div>
          </div>
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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-10 text-red-500 bg-red-100 rounded-lg shadow-xl m-10"><h2 className="text-2xl font-bold mb-4">React Crash</h2><pre className="text-sm whitespace-pre-wrap">{this.state.error?.toString()}</pre></div>;
    }
    return this.props.children;
  }
}

// --- PROVIDER DASHBOARD ---
const ProviderDashboard = ({ user, onLogout, toggleTheme, isDark, isVerified, onVerifyClick, notifications, showNotifications, setShowNotifications }) => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ earnings: 0, completed_jobs: 0, rating: user.rating || 0, reviews_count: user.reviews_count || 0 });
  const [showOtpInput, setShowOtpInput] = useState(null);
  const [otpValue, setOtpValue] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showChatFor, setShowChatFor] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Portfolio State
  const [portfolioImages, setPortfolioImages] = useState(user.portfolio_images || [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&auto=format&fit=crop'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [bio, setBio] = useState(user.bio || 'I am an experienced local professional. I might not have formal degrees, but my practical work and customer satisfaction speak for themselves!');
  const [isEditingExpertise, setIsEditingExpertise] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const saveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await updateProProfile(bio, portfolioImages);
      setIsEditingExpertise(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile updates.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await getBookings();
      setBookings((data || []).filter(b => b.is_provider));
      const statsData = await getProfessionalStats();
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, []);



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
  const myActiveJobs = bookings.filter(b => ['accepted', 'en_route', 'arrived', 'in_progress'].includes(b.status));
  const myCompletedJobs = bookings.filter(b => b.status === 'completed');

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500 pb-20">
      
      {/* Navbar */}
      <header className="bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src={logoImg} alt="Homie Logo" className="h-16 w-auto object-contain dark:bg-white/95 dark:p-1.5 dark:rounded-lg" />
             <span className="font-bold text-[11px] tracking-widest text-slate-400 uppercase hidden sm:inline ml-1 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full">Pro Portal</span>
             
             <div className="hidden md:flex items-center gap-1.5 ml-4 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Platform Health: Optimal</span>
             </div>
             
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


             <button onClick={toggleTheme} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             
             <div className="relative">
               <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                 <Bell size={18} />
                 {notifications.length > 0 && (
                   <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                 )}
               </button>
               {showNotifications && (
                 <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
                   <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                     <h3 className="font-bold text-sm">Notifications</h3>
                     <button onClick={() => setNotifications([])} className="text-xs text-blue-600 hover:text-blue-700">Clear All</button>
                   </div>
                   <div className="max-h-80 overflow-y-auto">
                     {notifications.length === 0 ? (
                       <p className="p-4 text-sm text-slate-500 text-center">No new notifications</p>
                     ) : (
                       notifications.map((notif, idx) => (
                         <div key={idx} className="p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                           <h4 className="text-sm font-bold">{notif.title}</h4>
                           <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{notif.message}</p>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               )}
             </div>

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
           <div className={`bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 ${!isVerified && 'opacity-60'} shadow-sm`}>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Earnings</span>
              <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">₹{stats.earnings}</h3>
              <div className="flex items-center gap-1 mt-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 <p className="text-[10px] font-bold text-emerald-600 uppercase">Live</p>
              </div>
           </div>
           <div className={`bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 ${!isVerified && 'opacity-60'} shadow-sm`}>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jobs Completed</span>
              <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{stats.completed_jobs}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Verified records</p>
           </div>
           <div className={`bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 ${!isVerified && 'opacity-60'} shadow-sm`}>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overall Rating</span>
              <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{stats.rating > 0 ? stats.rating.toFixed(1) : '—'}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">From {stats.reviews_count || 0} reviews</p>
           </div>
           <div className={`bg-slate-900 text-white rounded-xl p-6 ${!isVerified && 'opacity-60'} shadow-xl relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-2 opacity-20"><Brain size={48} /></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider relative z-10">Market Demand</span>
              <h3 className="text-3xl font-black mt-2 relative z-10">High</h3>
              <div className="mt-3 bg-slate-800 h-1.5 w-full rounded-full overflow-hidden relative z-10">
                 <div className="bg-blue-500 h-full w-[85%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              </div>
           </div>
        </div>

        {/* Portfolio & Expertise Module */}
        {isVerified && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                 <Star className="text-blue-600" size={20} /> My Expertise & Portfolio
              </h2>
              <div className="flex gap-2">
                {isEditingExpertise && (
                  <button 
                    onClick={() => setIsEditingExpertise(false)}
                    className="text-sm font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button 
                   onClick={() => isEditingExpertise ? saveProfile() : setIsEditingExpertise(true)}
                   disabled={isSavingProfile}
                   className={`text-sm font-bold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                     isEditingExpertise 
                       ? 'bg-blue-600 text-white hover:bg-blue-700' 
                       : 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                   }`}
                >
                   {isSavingProfile && <Loader2 size={14} className="animate-spin" />}
                   {isEditingExpertise ? (isSavingProfile ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
                </button>
              </div>
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
             {isVerified && <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-1 rounded-md"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />Live</span>}
           </div>

           {!isVerified ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
                 <ShieldAlert className="mx-auto text-slate-400 mb-3" size={32} />
                 <h3 className="font-bold text-slate-900 dark:text-white">Jobs Locked</h3>
                 <p className="text-slate-500 text-sm mt-1">Please verify your account to view available jobs.</p>
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

                            {['accepted', 'en_route', 'arrived', 'in_progress'].includes(job.status) && (
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
                                   Enroute
                                 </button>
                               )}
                               
                               {job.status === 'en_route' && (
                                 <button onClick={() => handleUpdateStatus(job._id, 'arrived')} className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-3 rounded-xl text-sm font-bold flex-1 transition-all shadow-lg active:scale-95 border border-slate-800 dark:border-slate-700">
                                   I've Reached Their Home
                                 </button>
                               )}

                               {job.status === 'arrived' && showOtpInput !== job._id && (
                                 <button onClick={(e) => { e.stopPropagation(); setShowOtpInput(job._id); }} className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex-1 transition-all shadow-lg active:scale-95 border border-slate-800 dark:border-slate-700">
                                   Enter OTP to Start
                                 </button>
                               )}

                               {job.status === 'arrived' && showOtpInput === job._id && (
                                 <div className="flex gap-2 flex-1 items-center bg-slate-100 dark:bg-slate-800/50 p-2 rounded-lg">
                                   <input 
                                     type="text" 
                                     placeholder="OTP" 
                                     maxLength={4}
                                     value={otpValue}
                                     onChange={e => setOtpValue(e.target.value)}
                                     className="w-16 text-center p-2 rounded bg-white dark:bg-[#0a0a0a] border border-slate-300 dark:border-slate-700 font-bold"
                                   />
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); handleStartJob(job._id); }} 
                                     className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-bold transition-colors"
                                   >
                                     Start
                                   </button>
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); setShowOtpInput(null); }} 
                                     className="text-slate-500 text-sm font-bold px-2 hover:text-slate-700"
                                   >
                                     Cancel
                                   </button>
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

                {/* Completed Jobs */}
                {myCompletedJobs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Completed Jobs History</h3>
                    <div className="space-y-3 opacity-80">
                      {myCompletedJobs.map((job) => (
                        <div key={job._id} className="bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold text-sm mb-1">{job.customer_name}</h3>
                              <p className="text-xs text-slate-600 dark:text-slate-400">"{job.issue_description}"</p>
                            </div>
                            <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800">
                              Completed
                            </span>
                          </div>
                        </div>
                      ))}
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
    </ErrorBoundary>
  );
};

export default Dashboard;
