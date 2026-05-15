import React from 'react';
import { FiX, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import flutterBridge from '../../../../utils/flutterBridge';

const WorkCompletionModal = ({ isOpen, onClose, job, onComplete, loading }) => {

  const calculateTotal = () => {
    // For Plan Benefit, user only pays for Extra Charges
    if (job?.paymentMethod === 'plan_benefit') {
      return job?.extraChargesTotal || 0;
    }

    // For normal bookings, prefer finalAmount (even if 0)
    if (typeof job?.finalAmount === 'number') {
      return job.finalAmount;
    }

    return ((job?.basePrice || 0) + (job?.tax || 0) - (job?.discount || 0));
  };

  const handleSubmit = () => {
    // Photos no longer mandatory as per simplified flow
    onComplete([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pb-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-md rounded-[24px] shadow-2xl relative z-10 overflow-hidden"
          >
            <div className="flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="px-8 pt-8 pb-4 flex justify-between items-start flex-shrink-0">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 leading-tight">Complete Work</h3>
                  <p className="text-xs text-green-600 font-bold uppercase tracking-wider mt-1">Final Step</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 active:scale-95"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="px-8 pb-4 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                <p className="text-sm text-gray-500 font-medium leading-relaxed mt-2">
                  Confirm all tasks are completed as per the quality standards.
                </p>



                {/* Quality Checklist (Restored from Vendor Design) */}
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-700 mb-3">
                    <FiCheckCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">Quality Checklist</span>
                  </div>
                  <ul className="space-y-2">
                    {[
                      'Double checked the results',
                      'Cleaned up work area',
                      'Customer satisfaction confirmed'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Total Bill Value</p>
                    <p className="text-lg font-black text-gray-800">₹{calculateTotal().toFixed(2)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-green-600 shadow-sm">
                    <FiDollarSign className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Action Buttons (Fixed at Bottom) */}
              <div className="px-8 py-6 bg-white border-t border-gray-100 flex-shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onClose}
                    className="py-4 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="py-4 rounded-xl font-bold text-white shadow-lg shadow-green-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                    style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                  >
                    {loading ? 'Confirming...' : 'Complete Work'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WorkCompletionModal;
