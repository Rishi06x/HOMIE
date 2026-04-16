import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ShieldCheck, UploadCloud, MapPin, Phone, Award, ArrowRight, Shield, X } from 'lucide-react';

const Onboarding = ({ user, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const isProvider = user.role === 'provider';
  
  const totalSteps = isProvider ? 3 : 2;

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
    else onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col items-center justify-center p-6 transition-colors duration-500">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden relative">
        
        {/* Header / Banner */}
        <div className="bg-blue-600 p-8 sm:p-10 relative overflow-hidden">
          {onCancel && (
            <button 
              onClick={onCancel} 
              className="absolute top-6 right-6 p-2 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors z-50"
            >
              <X size={20} />
            </button>
          )}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-100 font-semibold mb-2">
                <Shield size={18} /> Account Verification
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Unlock your <span className="text-blue-200">Verified Badge</span>
              </h2>
              <p className="text-blue-100 mt-2 max-w-md">
                {isProvider ? "Verified professionals earn 3x more trust and bookings." : "Verified customers get faster service and premium support."}
              </p>
            </div>
            <div className="hidden sm:flex w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl items-center justify-center border border-white/30 text-white">
              <ShieldCheck size={32} />
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 sm:p-10">
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-10">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <React.Fragment key={i}>
                <div className={`flex flex-col items-center gap-2 relative z-10`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step > i + 1 ? 'bg-blue-600 text-white' : step === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-4 ring-blue-100 dark:ring-blue-900/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    {step > i + 1 ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                </div>
                {i < totalSteps - 1 && (
                  <div className={`flex-1 h-1 rounded-full mx-2 ${step > i + 1 ? 'bg-blue-600' : 'bg-slate-100 dark:bg-slate-800'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Form Wizard */}
          <div className="min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {step === 1 && (
                  <>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                        <div className="relative mt-1">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                             <Phone size={18} />
                           </div>
                           <input type="tel" placeholder="+1 (555) 000-0000" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-600 rounded-xl py-3 pl-10 pr-4 outline-none text-slate-900 dark:text-white transition-all" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Complete Address</label>
                        <div className="relative mt-1">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                             <MapPin size={18} />
                           </div>
                           <input type="text" placeholder="123 Main St, City, Country" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-600 rounded-xl py-3 pl-10 pr-4 outline-none text-slate-900 dark:text-white transition-all" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && isProvider && (
                  <>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Professional Verification</h3>
                    <p className="text-slate-500 text-sm mb-4">Upload your government-issued ID to securely verify your identity.</p>
                    
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 mb-4">
                        <UploadCloud size={28} />
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Click to upload document</h4>
                      <p className="text-sm text-slate-500">SVG, PNG, JPG or PDF (max. 5MB)</p>
                    </div>
                  </>
                )}

                {((step === 2 && !isProvider) || (step === 3 && isProvider)) && (
                   <div className="text-center py-6">
                      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
                        <Award size={40} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Ready for Verification</h3>
                      <p className="text-slate-500 max-w-sm mx-auto">
                        {isProvider ? "Your documents will be reviewed shortly. Once approved, your verified badge will be heavily visible to customers." : "Your profile is complete! You can now book reliable experts from our verified network seamlessly."}
                      </p>
                   </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-10 flex gap-4">
             {step > 1 && (
               <button onClick={() => setStep(step - 1)} className="px-6 py-3 rounded-xl font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                 Back
               </button>
             )}
             <button onClick={nextStep} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all">
               {step === totalSteps ? "Finish Setup" : "Continue"} <ArrowRight size={18} />
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Onboarding;
