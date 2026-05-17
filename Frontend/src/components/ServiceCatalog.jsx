import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCatalog } from '../api';
import { Loader2, Plus, Minus, ShoppingCart, ChevronRight, Info, Microscope, Eye, CheckCircle2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import ServiceDetailsModal from './ServiceDetailsModal';

const ServiceCatalog = ({ categoryId, onAddToCart, cart, onAutoMatch }) => {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await getCatalog();
        setCatalog(data || []);
      } catch (err) {
        console.error("Failed to fetch catalog:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  if (loading) {
    return (
      <div className="py-10 text-center">
        <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={24} />
        <p className="text-slate-500 text-sm">Loading services...</p>
      </div>
    );
  }

  // Find the category matching the ID (mock matching logic)
  const categoryMap = {
    cleaning: 'c1',
    repairs: 'c2',
    plumbing: 'c3',
    electrical: 'c3',
    salon: 'c4',
    painting: 'c5',
  };

  const cId = categoryMap[categoryId] || 'c1'; // Default to cleaning
  const selectedCategory = catalog.find(c => c.id === cId);

  if (!selectedCategory) return null;

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemsInCart = cart.length;

  return (
    <div className="space-y-6 mb-12">
      <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>{selectedCategory.icon}</span> {selectedCategory.name} Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedCategory.services.map((service) => {
            const cartItem = cart.find(item => item.id === service.id);
            const quantity = cartItem ? cartItem.quantity : 0;
            const isInspection = service.is_inspection;

            return (
              <div key={service.id} className={`border rounded-xl p-4 flex justify-between items-center group transition-all ${
                isInspection 
                  ? 'border-teal-200 dark:border-teal-900 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/10'
                  : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50'
              }`}>
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => setSelectedService(service)}
                >
                  <div className="flex items-center gap-2">
                    {isInspection && <Microscope size={16} className="text-teal-600" />}
                    <h3 className={`font-bold group-hover:text-blue-600 transition-colors flex items-center gap-1 ${isInspection ? 'text-teal-800 dark:text-teal-300' : 'text-slate-900 dark:text-white'}`}>
                      {service.name} <Info size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                    <span className={`font-semibold ${isInspection ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'}`}>₹{service.price}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    <span>{service.duration}</span>
                    {isInspection && <span className="text-[10px] font-bold text-teal-600 bg-teal-100 dark:bg-teal-900/40 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Diagnosis Only</span>}
                  </p>
                </div>
                <div>
                  {quantity === 0 ? (
                    <button 
                      onClick={() => onAddToCart(service, 1)}
                      className={`text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-colors border ${
                        isInspection 
                          ? 'text-teal-600 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 hover:bg-teal-100'
                          : 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 hover:bg-blue-100'
                      }`}
                    >
                      {isInspection ? 'Inspect' : 'Add'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-800">
                      <button onClick={() => onAddToCart(service, -1)} className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md">
                        <Minus size={16} />
                      </button>
                      <span className="font-bold text-sm text-blue-700 dark:text-blue-400 w-4 text-center">{quantity}</span>
                      <button onClick={() => onAddToCart(service, 1)} className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md">
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STICKY CTA OR COMBO ALERT */}
      {itemsInCart > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-blue-500/20"
        >
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingCart className="text-white" size={24} />
             </div>
             <div>
                <p className="font-bold text-lg">{itemsInCart} Services in Cart • ₹{cartTotal}</p>
                {itemsInCart < 3 ? (
                  <p className="text-blue-100 text-sm">Add {3 - itemsInCart} more to get 10% COMBO discount!</p>
                ) : (
                  <p className="text-emerald-300 text-sm font-bold flex items-center gap-1">
                    <CheckCircle2 size={14} /> 10% Combo Discount Applied!
                  </p>
                )}
             </div>
          </div>
          <button 
            onClick={onAutoMatch}
            className="w-full sm:w-auto bg-white text-blue-600 font-black px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Instant Match & Book <ArrowRight size={18} />
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedService && (
          <ServiceDetailsModal 
            service={selectedService}
            onClose={() => setSelectedService(null)}
            onAddToCart={onAddToCart}
            cartItem={cart.find(item => item.id === selectedService.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};


export default ServiceCatalog;
