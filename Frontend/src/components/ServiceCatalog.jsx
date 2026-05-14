import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCatalog } from '../api';
import { Loader2, Plus, Minus, ShoppingCart } from 'lucide-react';

const ServiceCatalog = ({ categoryId, onAddToCart, cart }) => {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

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
  };

  const cId = categoryMap[categoryId] || 'c1'; // Default to cleaning
  const selectedCategory = catalog.find(c => c.id === cId);

  if (!selectedCategory) return null;

  return (
    <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-8 shadow-sm">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>{selectedCategory.icon}</span> {selectedCategory.name} Services
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selectedCategory.services.map((service) => {
          const cartItem = cart.find(item => item.id === service.id);
          const quantity = cartItem ? cartItem.quantity : 0;

          return (
            <div key={service.id} className="border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{service.name}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">₹{service.price}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                  <span>{service.duration}</span>
                </p>
              </div>
              <div>
                {quantity === 0 ? (
                  <button 
                    onClick={() => onAddToCart(service, 1)}
                    className="text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100 dark:border-blue-800"
                  >
                    Add
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
  );
};

export default ServiceCatalog;
