import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, MessageCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { getBookingMessages } from '../api';

const SOCKET_SERVER_URL = 'http://13.201.29.187:5000';

const ChatModal = ({ booking, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Determine chat partner
  const isCustomer = currentUser.role === 'seeker' || currentUser.role === 'customer';
  const myId = currentUser.id || currentUser._id;
  const partnerId = isCustomer ? booking.provider_id : booking.customer_id;
  const partnerName = isCustomer ? (booking.provider_name || 'Professional') : booking.customer_name;

  useEffect(() => {
    // Fetch previous messages
    const fetchMessages = async () => {
      try {
        const msgs = await getBookingMessages(booking._id);
        setMessages(msgs || []);
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };
    fetchMessages();

    // Setup Socket.IO
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join', { user_id: myId });
    });

    newSocket.on('receive_message', (message) => {
      if (message.booking_id === booking._id) {
        setMessages(prev => [...prev, message]);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [booking._id, myId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    const msgPayload = {
      sender_id: myId,
      receiver_id: partnerId,
      booking_id: booking._id,
      text: inputText.trim()
    };

    socket.emit('send_message', msgPayload);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-0">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 w-full sm:max-w-md h-[80vh] sm:h-[600px] rounded-t-2xl sm:rounded-2xl relative z-10 shadow-2xl flex flex-col overflow-hidden mt-auto sm:mt-0"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              <User size={20} />
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight">{partnerName}</h2>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Live Chat
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-[#0a0a0a] space-y-3 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
              <MessageCircle size={48} className="mb-2" />
              <p className="text-sm font-medium">No messages yet.</p>
              <p className="text-xs">Say hi to {partnerName}!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.sender_id === myId;
              return (
                <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${isMine ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-sm'}`}>
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-blue-200' : 'text-slate-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-[#0a0a0a] border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-blue-500 rounded-full py-3 pl-4 pr-12 text-sm outline-none transition-all dark:text-white"
            />
            <button 
              type="submit" 
              disabled={!inputText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send size={16} className="ml-0.5" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatModal;
