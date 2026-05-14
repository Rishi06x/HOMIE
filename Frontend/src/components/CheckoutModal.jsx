import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Calendar as CalendarIcon, Clock, CreditCard, Check, X, ShieldCheck } from 'lucide-react';

const CheckoutModal = ({ bookedPro, cart, onClose, onConfirm, isBookingLoading }) => {
  const [scheduledDate, setScheduledDate] = useState('tomorrow');
  const [scheduledTime, setScheduledTime] = useState('10:00 AM');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [issueDescription, setIssueDescription] = useState('');

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const subtotal = cartTotal > 0 ? cartTotal : bookedPro.price_per_hour;
  const platformFee = 49;
  const taxes = subtotal * 0.18;
  const totalAmount = subtotal + platformFee + taxes;

  const dates = [
    { id: 'today', label: 'Today' },
    { id: 'tomorrow', label: 'Tomorrow' },
    { id: 'day_after', label: 'Day After' }
  ];

  const times = ['09:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'];

  const handleSubmit = () => {
    onConfirm({
      issueDescription,
      services: cart,
      totalAmount,
      scheduledDate,
      scheduledTime
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl relative z-10 shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
          <h2 className="text-lg font-bold">Checkout & Schedule</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* Professional Info */}
          <div className="flex items-center gap-3 mb-6 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg border border-blue-200 dark:border-blue-800">
               {bookedPro.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-1">{bookedPro.name} <ShieldCheck size={14} className="text-blue-600"/></h3>
              <p className="text-slate-500 text-xs">{bookedPro.specialization}</p>
            </div>
          </div>

          {/* Cart Items */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Order Summary</h3>
            {cart.length > 0 ? (
              <div className="space-y-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.quantity}x {item.name}</span>
                    <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">1x Hourly Service Call</span>
                <span className="font-bold">₹{bookedPro.price_per_hour.toFixed(2)}</span>
              </div>
            )}
            
            <div className="border-t border-dashed border-slate-200 dark:border-slate-700 mt-3 pt-3 space-y-1.5">
              <div className="flex justify-between items-center text-sm text-slate-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-500">
                <span>Platform Fee</span>
                <span>₹{platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-500">
                <span>Taxes (18% GST)</span>
                <span>₹{taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white">Total Amount</span>
                <span className="font-black text-lg text-blue-600">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><CalendarIcon size={14}/> Schedule</h3>
            <div className="flex gap-2 mb-3">
              {dates.map(d => (
                <button 
                  key={d.id}
                  onClick={() => setScheduledDate(d.id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${scheduledDate === d.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white' : 'bg-white dark:bg-[#0a0a0a] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {times.map(t => (
                <button 
                  key={t}
                  onClick={() => setScheduledTime(t)}
                  className={`py-2 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${scheduledTime === t ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-[#0a0a0a] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                >
                  <Clock size={12}/> {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Any specific instructions?</label>
            <textarea 
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm h-20 focus:border-blue-500 outline-none"
              placeholder="E.g., Please bring your own ladder..."
            ></textarea>
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><CreditCard size={14}/> Payment</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => setPaymentMethod('upi')} className={`w-full py-3 px-4 rounded-xl border flex items-center gap-3 text-sm font-bold transition-all ${paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'upi' ? 'border-blue-500' : 'border-slate-300'}`}>
                  {paymentMethod === 'upi' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                Pay via UPI (GPay, PhonePe, Paytm)
              </button>
              <button onClick={() => setPaymentMethod('card')} className={`w-full py-3 px-4 rounded-xl border flex items-center gap-3 text-sm font-bold transition-all ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-blue-500' : 'border-slate-300'}`}>
                  {paymentMethod === 'card' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                Credit / Debit Card
              </button>
              <button onClick={() => setPaymentMethod('cash')} className={`w-full py-3 px-4 rounded-xl border flex items-center gap-3 text-sm font-bold transition-all ${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-emerald-500' : 'border-slate-300'}`}>
                  {paymentMethod === 'cash' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
                Pay After Service (Cash / Online)
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
          <button 
            onClick={handleSubmit} 
            disabled={isBookingLoading} 
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center shadow-lg"
          >
            {isBookingLoading ? <Loader2 className="animate-spin" size={20} /> : `Confirm Booking • ₹${totalAmount.toFixed(2)}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutModal;
