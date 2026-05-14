import React, { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import { getMe, logout as apiLogout, isLoggedIn } from './api';

function App() {
  const [user, setUser] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auto-login: check for existing JWT on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (isLoggedIn()) {
        try {
          const userData = await getMe();
          setUser(userData);
          setIsVerified(userData.is_verified || false);
        } catch (err) {
          // Token expired or invalid — clear it
          apiLogout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    apiLogout();
    setUser(null);
    setIsVerified(false);
    setShowVerification(false);
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is logged in
  if (user) {
     if (showVerification) {
        return <Onboarding user={user} onComplete={() => { setIsVerified(true); setShowVerification(false); }} onCancel={() => setShowVerification(false)} />;
     }

     return <Dashboard 
        user={user} 
        isVerified={isVerified}
        onVerifyClick={() => setShowVerification(true)}
        onLogout={handleLogout} 
     />;
  }

  // Not logged in
  return (
   <Auth onAuthenticate={(userData) => {
     setUser(userData);
     setIsVerified(userData.is_verified || false);
   }} />
  );
}

export default App;