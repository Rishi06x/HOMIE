import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from '../hooks/useDarkMode';
import logoImg from '../assets/logo.png';
import {
    Sun, Moon, User, Briefcase, Mail, Lock,
    Sparkles, Home, Wrench, PaintRoller, Scissors, Droplets, Check
} from 'lucide-react';

const Auth = ({ onAuthenticate }) => {
    const [colorTheme, toggleTheme] = useDarkMode();
    const isDark = colorTheme === "light";
    const [isLogin, setIsLogin] = useState(false);
    const [role, setRole] = useState('seeker'); // 'seeker' or 'provider'
    const [termsAccepted, setTermsAccepted] = useState(false);

    return (
        <div className="h-screen max-h-screen overflow-hidden w-full bg-slate-50 dark:bg-slate-950 font-sans flex transition-colors duration-500">

            {/* Left Pane - Floating Floating Card Design (Asymmetric) */}
            <div className="hidden lg:flex w-[45%] p-4 pr-0 relative h-full">
                <div className="w-full h-full bg-[#0B1121] dark:bg-[#060a16] rounded-[2.5rem] p-10 flex flex-col justify-between relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.1)] border border-slate-800/60 text-white z-10">

                    {/* Subtle background abstract blobs for left card */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/3 translate-y-1/3" />

                    {/* Logo Area */}
                    <div className="relative z-10 mt-2">
                        <img src={logoImg} alt="Homie Logo" className="h-10 w-auto object-contain bg-white/95 p-1.5 rounded-xl shadow-lg" />
                    </div>

                    {/* Center Content */}
                    <div className="relative z-10 my-auto py-4">
                        <h1 className="text-4xl lg:text-[2.5rem] font-bold leading-[1.15] mb-4 tracking-tight text-white">
                            Expert home services, <br /><span className="text-blue-500">to your door.</span>
                        </h1>
                        <p className="text-slate-400 text-[15px] mb-6 leading-relaxed font-medium max-w-sm">
                            Join millions of users who trust Homie for their everyday needs. From deep cleaning to expert repairs, we've got you covered.
                        </p>

                        {/* Floating Service Badges inside the dark card */}
                        <div className="flex flex-wrap gap-2.5">
                            {[{ icon: <Wrench size={14} />, label: "Repairs" },
                            { icon: <Sparkles size={14} />, label: "Cleaning" },
                            { icon: <Scissors size={14} />, label: "Salon" },
                            { icon: <Droplets size={14} />, label: "Plumbing" },
                            { icon: <PaintRoller size={14} />, label: "Painting" }].map((service, i) => (
                                <motion.div
                                    key={service.label}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 + 0.2, type: "spring", stiffness: 200 }}
                                    className="flex items-center gap-1.5 bg-slate-800/60 backdrop-blur-md px-3.5 py-2 rounded-full shadow-sm border border-slate-700/50 text-xs font-semibold text-slate-200 hover:bg-slate-700/60 transition-colors cursor-default"
                                >
                                    <span className="text-blue-400">{service.icon}</span>
                                    {service.label}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Trust indicator */}
                    <div className="relative z-10 flex items-center gap-4 mb-2">
                        <div className="flex -space-x-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-[#0B1121] flex items-center justify-center text-xs font-bold text-slate-300">AB</div>
                            <div className="w-10 h-10 rounded-full bg-slate-600 border-2 border-[#0B1121] flex items-center justify-center text-xs font-bold text-slate-300">JD</div>
                            <div className="w-10 h-10 rounded-full bg-blue-900/80 border-2 border-[#0B1121] flex items-center justify-center text-xs font-bold text-blue-300">1M+</div>
                        </div>
                        <div className="text-sm font-medium text-slate-400 leading-tight">
                            Trusted by top <strong className="text-white">professionals</strong> <br />& happy customers across the globe.
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Pane - Auth Form Blend Region */}
            <div className="w-full lg:w-[55%] h-full flex flex-col justify-center items-center p-6 sm:p-10 relative overflow-hidden min-h-screen lg:min-h-0 [scrollbar-width:none]">
                {/* Subtle blending background element so it's not perfectly flat */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/5 dark:to-transparent pointer-events-none rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-70" />

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="absolute top-6 right-6 p-2.5 rounded-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors z-50"
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div className="w-full max-w-[420px] relative z-10 mt-8 mb-8">

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-2 mb-6 mt-2">
                        <img src={logoImg} alt="Homie Logo" className="h-12 w-auto object-contain dark:bg-white/95 dark:p-1.5 dark:rounded-xl" />
                    </div>

                    <div className="mb-6 text-left">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight leading-tight">
                            {isLogin ? "Welcome back" : "Create an account"}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-[13px]">
                            {isLogin ? "Enter your credentials to access your dashboard." : "Start your journey and unlock endless opportunities."}
                        </p>
                    </div>

                    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (onAuthenticate) onAuthenticate(role); }}>



                        {/* Role Selector (Only on Register) */}
                        <AnimatePresence mode="popLayout">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="flex bg-slate-200/60 dark:bg-slate-900 p-1 rounded-xl mb-4 border border-slate-200 dark:border-slate-800/80 relative"
                                >
                                    <motion.div
                                        animate={{ x: role === 'seeker' ? 0 : '100%' }}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        className="absolute top-1 left-1 w-[calc(50%-4px)] h-[calc(100%-8px)] bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setRole('seeker')}
                                        className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${role === 'seeker' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'}`}
                                    >
                                        <User size={16} /> Customer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('provider')}
                                        className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${role === 'provider' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'}`}
                                    >
                                        <Briefcase size={16} /> Professional
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Registration specific fields */}
                        <AnimatePresence mode="popLayout">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-1.5 pt-1">
                                        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block">Full Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <User className="text-slate-400" size={18} />
                                            </div>
                                            <input required type="text" placeholder="John Doe" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all font-medium text-sm" />
                                        </div>
                                    </div>

                                    {role === 'provider' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-1.5"
                                        >
                                            <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block">Specialization</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                    <Wrench className="text-slate-400" size={18} />
                                                </div>
                                                <select required className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 outline-none text-slate-900 dark:text-white transition-all appearance-none cursor-pointer font-medium text-sm">
                                                    <option value="" disabled selected className="text-slate-500">Pick an expertise</option>
                                                    <option value="plumbing">Plumbing Services</option>
                                                    <option value="cleaning">Home Cleaning</option>
                                                    <option value="electrical">Electrical & Wiring</option>
                                                    <option value="beauty">Salon & Beauty</option>
                                                    <option value="repairs">Generic Repairs</option>
                                                </select>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail className="text-slate-400" size={18} />
                                </div>
                                <input required type="email" placeholder="john@example.com" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all font-medium text-sm" />
                            </div>
                        </div>

                        <div className="space-y-1.5 pb-1">
                            <div className="flex items-center justify-between">
                                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Password</label>
                                {isLogin && <button type="button" className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Forgot password?</button>}
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="text-slate-400" size={18} />
                                </div>
                                <input required type="password" placeholder="••••••••" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all font-medium text-sm" />
                            </div>
                        </div>

                        {/* Checkbox explicitly toggled using state */}
                        {!isLogin && (
                            <div
                                className="flex items-start gap-3 pt-2 mb-2 group cursor-pointer"
                                onClick={() => setTermsAccepted(!termsAccepted)}
                            >
                                <div className={`mt-[2px] w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 transition-all border ${termsAccepted ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 group-hover:border-blue-500'}`}>
                                    <Check size={12} className={`text-white transition-transform duration-200 ${termsAccepted ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} strokeWidth={3} />
                                </div>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-snug">
                                    By creating an account, you agree to our <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>.
                                </p>
                            </div>
                        )}

                        {/* Action Button */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all mt-4 text-sm"
                        >
                            {isLogin ? "Sign In" : "Create Account"}
                        </motion.button>
                    </form>

                    {/* Switch Mode */}
                    <div className="mt-6 text-center text-[13px] text-slate-500 dark:text-slate-400 font-medium mb-4">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-all ml-1"
                        >
                            {isLogin ? "Sign up" : "Log in"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Auth;