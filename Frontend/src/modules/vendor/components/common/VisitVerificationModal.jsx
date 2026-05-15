import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FiX, FiCheckCircle } from 'react-icons/fi';
import { verifySelfVisit } from '../../services/bookingService';
import flutterBridge from '../../../../utils/flutterBridge';
import LocationAccessModal from '../../../../components/common/LocationAccessModal';

/**
 * Reusable Visit Verification Modal
 * Used for OTP-based arrival verification by vendors/workers
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Callback to close modal
 * @param {string} bookingId - The booking ID to verify
 * @param {function} onSuccess - Callback on successful verification
 */
const VisitVerificationModal = ({ isOpen, onClose, bookingId, onSuccess }) => {
  const [otpInput, setOtpInput] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userType, setUserType] = useState('vendor');

  // Detect user type
  React.useEffect(() => {
    const vendorData = JSON.parse(localStorage.getItem('vendorData') || '{}');
    const workerData = JSON.parse(localStorage.getItem('workerData') || '{}');
    if (workerData._id || workerData.id) setUserType('worker');
    else if (vendorData._id || vendorData.id) setUserType('vendor');
  }, []);

  // Auto-verify as last digit enters
  React.useEffect(() => {
    const otpValue = otpInput.join('');
    if (otpValue.length === 4 && !loading && isOpen) {
      handleVerify();
    }
  }, [otpInput]);

  const handleOtpChange = (index, value) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    if (sanitized.length > 1) return;

    const newOtp = [...otpInput];
    newOtp[index] = sanitized;
    setOtpInput(newOtp);

    // Auto-focus next input
    if (sanitized && index < 3) {
      document.getElementById(`visit-otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      document.getElementById(`visit-otp-${index - 1}`)?.focus();
    }
  };

  /**
   * Use robust Native Bridge with Browser Fallback
   */
  const getPosition = async () => {
    try {
      const location = await flutterBridge.getCurrentLocation();
      return location;
    } catch (error) {
      console.error("[VisitVerification] Location fetching failed:", error);
      throw error;
    }
  };

  const handleVerify = async () => {
    const otp = otpInput.join('');
    if (otp.length !== 4) {
      toast.error('Please enter 4-digit OTP');
      return;
    }

    setLoading(true);

    if (!navigator.geolocation) {
      toast.error('Geolocation is required for verification');
      setLoading(false);
      return;
    }

    try {
      const locationData = await getPosition();
      const location = {
        lat: locationData.latitude,
        lng: locationData.longitude
      };

      const response = await verifySelfVisit(bookingId, otp, location);

      if (response.success) {
        toast.success('Visit Verified Successfully!');
        setOtpInput(['', '', '', '']);
        onClose();
        onSuccess?.();
      } else {
        toast.error(response.message || 'Verification failed');
      }
    } catch (error) {
      console.error("Verification Error:", error);

      // Handle geolocation errors
      if (error.code === 1) {
        toast.error('Location permission denied. Requesting access...');
        setShowLocationModal(true);
      } else if (error.code === 2) {
        toast.error('Location unavailable. Check your GPS settings.');
      } else if (error.code === 3) {
        toast.error('Location timeout. Please try again.');
      } else {
        // API error or other
        toast.error(error.response?.data?.message || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSuccess = async (coords) => {
    setShowLocationModal(false);
    const otp = otpInput.join('');
    if (otp.length !== 4) return;

    setLoading(true);
    try {
      const location = { lat: coords.latitude || coords.lat, lng: coords.longitude || coords.lng };
      const response = await verifySelfVisit(bookingId, otp, location);

      if (response.success) {
        toast.success('Visit Verified Successfully!');
        setOtpInput(['', '', '', '']);
        onClose();
        onSuccess?.();
      } else {
        toast.error(response.message || 'Verification failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setOtpInput(['', '', '', '']);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-xl">
          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] relative z-10 border border-gray-100"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                  Verify Arrival
                </h3>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
                  Operational Check-in
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-2xl text-gray-400 hover:bg-gray-100 transition-all border border-gray-100 shadow-inner"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Description */}
            <div className="mb-10">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest leading-relaxed">
                Please enter the <span className="text-gray-900 font-black">4-digit code</span> provided by the customer to confirm your arrival.
              </p>
            </div>

            {/* OTP Inputs */}
            <div className="flex justify-between gap-4 mb-10">
              {otpInput.map((digit, idx) => (
                <input
                  key={idx}
                  id={`visit-otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  autoFocus={idx === 0}
                  disabled={loading}
                  className={`w-14 h-16 text-center text-3xl font-black rounded-2xl transition-all outline-none border-2 shadow-inner
                    ${digit
                      ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-none'
                      : 'border-gray-50 bg-gray-50 text-gray-900 focus:border-blue-300 focus:bg-white'
                    }`}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheckCircle className="w-6 h-6" />
                  <span>Verify & Initialize</span>
                </>
              )}
            </button>
          </motion.div>

          <LocationAccessModal
            isOpen={showLocationModal}
            onClose={() => setShowLocationModal(false)}
            onSuccess={handleLocationSuccess}
            userType={userType}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default VisitVerificationModal;
