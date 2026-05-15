import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiShield, FiSmartphone } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const OtpVerificationModal = ({ isOpen, onClose, onVerify, loading }) => {
  const [otp, setOtp] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (otp.length === 4) {
      onVerify(otp);
    }
  }, [otp, onVerify]);

  // Clear OTP on failure (when loading finishes and modal is still open)
  const prevLoading = useRef(loading);
  useEffect(() => {
    if (prevLoading.current && !loading && isOpen) {
      setOtp('');
      inputRef.current?.focus();
    }
    prevLoading.current = loading;
  }, [loading, isOpen]);

  const handleChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setOtp(val);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-white/60 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] relative border border-gray-100"
        >
          {/* Header */}
          <div className="relative h-44 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 flex flex-col items-center justify-center">
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 6, repeat: Infinity }}
                className="absolute -top-20 -left-20 w-64 h-64 bg-white/20 rounded-full blur-3xl"
              />
            </div>

            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-2xl rounded-2xl text-white transition-all active:scale-95 border border-white/10"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl mb-4">
              <FiShield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-white text-xs font-black uppercase tracking-[0.3em] opacity-80 mb-1">Secure Protocol</h2>
            <p className="text-white text-xl font-black tracking-tight">Payment Verification</p>
          </div>

          {/* Body */}
          <div className="px-10 py-12 bg-white">
            <div className="text-center mb-10">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
                Enter the 4-digit verification code transmitted to the user
              </p>
            </div>

            <div className="flex justify-center mb-12">
              <input
                ref={inputRef}
                type="number"
                value={otp}
                onChange={handleChange}
                disabled={loading}
                placeholder="0000"
                className="w-full text-center bg-gray-50 border border-gray-100 rounded-[2rem] py-8 text-6xl font-black tracking-[0.4em] text-gray-900 outline-none focus:border-blue-600/30 transition-all placeholder:text-gray-200 shadow-inner"
              />
            </div>

            <div className="flex flex-col items-center gap-4">
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200" />
                  <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Validating...</span>
                </div>
              ) : (
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                  <FiSmartphone className="w-3 h-3 text-blue-600" />
                  Auto-verification Engaged
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OtpVerificationModal;
