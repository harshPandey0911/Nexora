import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiCreditCard, FiClock, FiCheck, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

/**
 * CashCollectionModal
 * A unified component for collecting cash payments with support for extra items/services.
 */
const CashCollectionModal = ({
  isOpen,
  onClose,
  booking,
  onConfirm,
  onInitiateOTP,
  loading
}) => {
  const [extraItems, setExtraItems] = useState([]);
  const [step, setStep] = useState('summary'); // 'summary' or 'otp'
  const [otp, setOtp] = useState(['', '', '', '']);
  const [submitting, setSubmitting] = useState(false);

  // Fix potential undefined issue
  const safeExtraItems = Array.isArray(extraItems) ? extraItems : [];

  // Calculate base amount - For plan_benefit, base is ALWAYS 0 (covered by plan)
  const baseAmount = (() => {
    // CRITICAL: For plan_benefit, base is covered - only extras are charged
    if (booking?.paymentMethod === 'plan_benefit') {
      return 0;
    }

    const rawFinal = booking?.finalAmount || parseFloat(booking?.price) || 0;
    const existingExtras = booking?.workDoneDetails?.items || [];
    const existingExtrasTotal = existingExtras.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.qty || 1)), 0);
    // If OTP was already sent, the rawFinal already includes existingExtrasTotal
    return (booking?.customerConfirmationOTP || booking?.paymentOtp)
      ? Math.max(0, rawFinal - existingExtrasTotal)
      : rawFinal;
  })();

  const totalExtra = safeExtraItems.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.qty || 1)), 0);
  const finalTotal = baseAmount + totalExtra;

  useEffect(() => {
    if (isOpen) {
      // Safety check: close if already paid
      const pStatus = booking?.paymentStatus?.toLowerCase() || '';
      if (pStatus === 'success' || pStatus === 'paid') {
        onClose();
        return;
      }

      // Check if OTP was already initiated for this booking
      const hasOTP = booking?.customerConfirmationOTP || booking?.paymentOtp;

      if (hasOTP) {
        setStep('otp');
        // Restore extra items from booking record if they exist
        if (booking.workDoneDetails?.items && booking.workDoneDetails.items.length > 0) {
          setExtraItems(booking.workDoneDetails.items);
        }
      } else {
        // Fresh start
        setStep('summary');
        setExtraItems([]);
        setOtp(['', '', '', '']);
      }
      setSubmitting(false);
    }
  }, [isOpen, booking?.id, booking?.customerConfirmationOTP, booking?.paymentOtp, booking?.paymentStatus]);

  const handleAddItem = () => {
    setExtraItems([...extraItems, { title: '', price: '', qty: 1 }]);
  };

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...extraItems];
    newItems[index][field] = value;
    setExtraItems(newItems);
  };

  const handleRemoveItem = (index) => {
    setExtraItems(extraItems.filter((_, i) => i !== index));
  };

  // Auto-verify as last digit enters
  useEffect(() => {
    const otpValue = otp.join('');
    if (otpValue.length === 4 && !submitting && !loading && step === 'otp') {
      handleVerify();
    }
  }, [otp]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
      const nextInput = document.getElementById(`modal-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Scroll input into view smoothly when focused (prevents layout shift)
  const handleInputFocus = (e) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleSendOTP = async () => {
    // Validate extra items if any
    for (const item of extraItems) {
      if (!item.title || !item.price || parseFloat(item.price) <= 0) {
        toast.error('Please provide title and price for all extra items');
        return;
      }
    }

    // PLAN BENEFIT: If no extras, skip OTP and confirm directly
    const isPlanBenefit = booking?.paymentMethod === 'plan_benefit';
    const hasExtras = extraItems.length > 0 && totalExtra > 0;

    if (isPlanBenefit && !hasExtras) {
      // Direct confirmation without OTP
      setSubmitting(true);
      try {
        await onConfirm(0, [], '0000'); // Dummy OTP for plan_benefit with no extras
        onClose();
        toast.success('Bill finalized successfully!');
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to finalize');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Normal flow: Send OTP
    setSubmitting(true);
    try {
      await onInitiateOTP(finalTotal, extraItems);
      setStep('otp');
      toast.success('OTP sent to customer');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      toast.error('Please enter 4-digit OTP');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(finalTotal, extraItems, otpString);
      onClose();
      toast.success('Payment recorded successfully');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4 bg-white/60 backdrop-blur-xl transition-opacity">
      {/* Modal Container */}
      <div className={`
        bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)]
        animate-in slide-in-from-bottom-8 duration-500
        max-h-[85vh] sm:max-h-[90vh] flex flex-col mb-10 border border-gray-100
      `}>
        {/* Header */}
        <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-white flex-shrink-0">
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{step === 'summary' ? 'Collect Cash' : 'Verify OTP'}</h3>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
              {step === 'summary' ? 'Review Bill & Send OTP' : 'Enter Customer Code'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-2xl text-gray-400 hover:bg-gray-100 transition-all border border-gray-100 shadow-inner"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10 overflow-y-auto flex-1 scrollbar-hide">
          {step === 'summary' ? (
            <>
              {/* Base Amount Section */}
              {booking?.paymentMethod === 'plan_benefit' ? (
                <div className="bg-emerald-50 rounded-[2.5rem] p-8 mb-8 border border-emerald-100 relative overflow-hidden shadow-inner">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <FiCheck className="w-16 h-16 text-emerald-600" />
                  </div>
                  <div className="flex justify-between items-center mb-2 relative z-10">
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Base Service Cost</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-600/40 line-through font-black">₹{(booking?.finalAmount || parseFloat(booking?.price) || 0).toLocaleString()}</span>
                      <span className="text-[10px] font-black text-emerald-600 bg-white px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm">FREE ✓</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-emerald-700/60 uppercase tracking-widest">Covered by customer's membership plan</p>
                </div>
              ) : (
                <div className="bg-blue-50 rounded-[2.5rem] p-8 mb-8 border border-blue-100 shadow-inner">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-black text-blue-800 uppercase tracking-widest">Booking Amount</span>
                    <span className="text-2xl font-black text-blue-900 tracking-tighter">₹{baseAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest">Original service booking amount</p>
                </div>
              )}

              {/* Extra Items Section */}
              <div className="space-y-6 mb-8">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Extra Services / Items</h4>
                  <button
                    onClick={handleAddItem}
                    className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all border border-blue-100"
                  >
                    <FiPlus className="w-3 h-3" />
                    ADD EXTRA
                  </button>
                </div>

                {extraItems.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/30">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No extra charges identified</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {extraItems.map((item, index) => (
                      <div key={index} className="flex gap-4 items-start animate-in slide-in-from-right-4 duration-300">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            placeholder="Service name"
                            className="w-full px-5 py-3 text-sm font-black bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-200"
                            value={item.title}
                            onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                          />
                          <div className="flex gap-3">
                            <div className="relative flex-1">
                              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 font-black text-sm">₹</span>
                              <input
                                type="number"
                                placeholder="Price"
                                className="w-full pl-10 pr-5 py-3 text-sm font-black bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-blue-500 placeholder:text-gray-200"
                                value={item.price}
                                onChange={(e) => handleUpdateItem(index, 'price', e.target.value)}
                              />
                            </div>
                            <div className="w-24">
                              <input
                                type="number"
                                placeholder="Qty"
                                className="w-full px-5 py-3 text-sm font-black bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-blue-500 placeholder:text-gray-200"
                                value={item.qty}
                                onChange={(e) => handleUpdateItem(index, 'qty', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="w-10 h-10 flex items-center justify-center text-rose-400 bg-rose-50 rounded-xl hover:bg-rose-100 transition-all border border-rose-100 mt-1"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-blue-600 border border-blue-100 shadow-inner">
                <FiClock className="w-10 h-10 animate-pulse" />
              </div>
              <h4 className="text-xl font-black text-gray-900 tracking-tight mb-3">Confirmation Code</h4>
              <p className="text-[11px] font-medium text-gray-400 mb-10 px-4 leading-relaxed">
                Ask the customer for the 4-digit code sent to their phone to verify the payment of <span className="font-black text-gray-900">₹{finalTotal.toLocaleString()}</span>.
              </p>

              <div className="flex gap-4 justify-center mb-10">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    id={`modal-otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    value={otp[i]}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onFocus={handleInputFocus}
                    className="w-14 h-16 border border-gray-100 rounded-2xl text-center text-3xl font-black text-gray-900 focus:border-blue-500 focus:outline-none bg-gray-50 transition-all shadow-inner"
                    maxLength={1}
                  />
                ))}
              </div>

              <button
                onClick={() => setStep('summary')}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
              >
                Back to Edit Bill
              </button>
            </div>
          )}

          {/* Final Summary Card */}
          <div className="bg-white rounded-[3rem] p-8 text-gray-900 shadow-sm mt-8 relative overflow-hidden border border-gray-100">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-[60px] opacity-50" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Final Yield Protocol</span>
                <FiDollarSign className="text-blue-600 w-5 h-5" />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-4xl font-black tracking-tighter">₹{finalTotal.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-2xl border border-emerald-100 uppercase tracking-widest">
                    CASH COLLECTION
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-10 bg-gray-50/50 border-t border-gray-100">
          {step === 'summary' ? (
            <button
              onClick={handleSendOTP}
              disabled={submitting || loading}
              className="w-full py-6 rounded-3xl font-black text-white text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-500/20"
              style={{
                background: booking?.paymentMethod === 'plan_benefit' && extraItems.length === 0
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : 'linear-gradient(135deg, #2563EB, #1D4ED8)'
              }}
            >
              {submitting ? 'Synthesizing...' : (
                booking?.paymentMethod === 'plan_benefit' && extraItems.length === 0
                  ? 'Finalize Deployment'
                  : 'Initiate OTP Protocol'
              )}
              <FiArrowRight className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={handleVerify}
              disabled={submitting || loading}
              className="w-full py-6 rounded-3xl font-black text-white text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-emerald-500/20 bg-gradient-to-r from-emerald-600 to-emerald-700"
            >
              {submitting ? 'Validating...' : 'Verify & Synchronize'}
              <FiCheck className="w-6 h-6" />
            </button>
          )}
          <p className="text-[10px] font-medium text-gray-400 text-center mt-6 uppercase tracking-widest">
            {step === 'summary'
              ? (booking?.paymentMethod === 'plan_benefit' && extraItems.length === 0
                ? 'No extra charges. Direct finalization enabled.'
                : 'Initiating 4-digit verification sequence.')
              : 'Auto-verification active for code input.'}
          </p>
        </div>
      </div>
    </div>
  );
};

const FiArrowRight = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export default CashCollectionModal;
