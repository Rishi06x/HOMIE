import React, { useState } from 'react';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  // If user is logged in
  if (user) {
     if (showVerification) {
        return <Onboarding user={user} onComplete={() => { setIsVerified(true); setShowVerification(false); }} onCancel={() => setShowVerification(false)} />;
     }

     return <Dashboard 
        user={user} 
        isVerified={isVerified}
        onVerifyClick={() => setShowVerification(true)}
        onLogout={() => { setUser(null); setIsVerified(false); setShowVerification(false); }} 
     />;
  }

  // Not logged in
  return (
   <Auth onAuthenticate={(role) => setUser({ role })} />
  );
}

export default App;