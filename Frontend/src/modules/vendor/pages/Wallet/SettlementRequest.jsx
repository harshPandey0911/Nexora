import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSend, FiUpload, FiCheck, FiCreditCard, FiSmartphone, FiDollarSign, FiX } from 'react-icons/fi';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import vendorWalletService from '../../../../services/vendorWalletService';
import { toast } from 'react-hot-toast';
import flutterBridge from '../../../../utils/flutterBridge';
import { FiCamera } from 'react-icons/fi';

const SettlementRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState({ amountDue: 0 });
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'upi',
    paymentReference: '',
    paymentProof: '',
    notes: ''
  });
  const [proofPreview, setProofPreview] = useState(null);

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const bgStyle = themeColors.backgroundGradient;

    if (html) html.style.background = bgStyle;
    if (body) body.style.background = bgStyle;
    if (root) root.style.background = bgStyle;

    return () => {
      if (html) html.style.background = '';
      if (body) body.style.background = '';
      if (root) root.style.background = '';
    };
  }, []);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const res = await vendorWalletService.getWallet();
      if (res.success) {
        setWallet(res.data);
        setFormData(prev => ({ ...prev, amount: res.data.amountDue.toString() }));
      }
    } catch (error) {
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1200; // Increased slightly for better text legibility in receipts
        const MAX_HEIGHT = 1200;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
            type: 'image/jpeg',
            lastModified: Date.now()
          }));
        }, 'image/jpeg', 0.85); // Slightly higher quality for reference numbers
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file); // Fallback to original if canvas fails
      };
    });
  };

  const uploadToCloudinary = async (file) => {
    // 1. Get Signature from Backend
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const sigRes = await fetch(`${apiUrl}/api/upload/sign-signature`);
    const sigData = await sigRes.json();

    if (!sigData.success) {
      throw new Error(sigData.message || 'Failed to get upload signature');
    }

    const { signature, timestamp, cloudName, apiKey, folder } = sigData;

    // 2. Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    if (folder) formData.append('folder', folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.secure_url;
  };

  const handleNativeCamera = async () => {
    try {
      const file = await flutterBridge.openCamera();
      if (file) {
        setProofPreview(URL.createObjectURL(file));
        const loadingToast = toast.loading('Uploading Proof...');
        const secureUrl = await uploadToCloudinary(file);
        setFormData(prev => ({ ...prev, paymentProof: secureUrl }));
        toast.dismiss(loadingToast);
        toast.success('Proof captured & uploaded!');
        flutterBridge.hapticFeedback('success');
      }
    } catch (error) {
      console.error('Native capture failed:', error);
      toast.error('Failed to capture proof');
      toast.dismiss();
    }
  };

  const handleProofUpload = async (e) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    if (originalFile.size > 20 * 1024 * 1024) {
      toast.error('File too large (max 20MB)');
      return;
    }

    const previewUrl = URL.createObjectURL(originalFile);
    setProofPreview(previewUrl);

    let loadingToast;
    try {
      loadingToast = toast.loading('Optimizing & Uploading...');

      // Compress client-side
      const file = await compressImage(originalFile);

      // Upload
      const secureUrl = await uploadToCloudinary(file);

      setFormData(prev => ({ ...prev, paymentProof: secureUrl }));
      toast.dismiss(loadingToast);
      toast.success('Proof uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload proof');
      if (loadingToast) toast.dismiss(loadingToast);
      setProofPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(formData.amount) > wallet.amountDue) {
      toast.error(`Amount cannot exceed ₹${wallet.amountDue}`);
      return;
    }

    if (!formData.paymentReference) {
      toast.error('Please enter UPI/Transaction reference');
      return;
    }

    if (!formData.paymentProof) {
      toast.error('Payment screenshot is required');
      return;
    }

    try {
      setSubmitting(true);
      const res = await vendorWalletService.requestSettlement({
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        paymentReference: formData.paymentReference,
        paymentProof: formData.paymentProof,
        notes: formData.notes
      });

      if (res.success) {
        toast.success('Settlement request submitted!');
        navigate('/vendor/wallet');
      } else {
        toast.error(res.message || 'Failed to submit request');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: themeColors.backgroundGradient }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${themeColors.button} transparent ${themeColors.button} ${themeColors.button}` }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 relative" style={{ background: '#FFFFFF' }}>
      {/* Premium Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 0% 0%, rgba(13, 148, 136, 0.1) 0%, transparent 70%),
              radial-gradient(at 100% 100%, rgba(13, 148, 136, 0.05) 0%, transparent 75%),
              #F8FAFC
            `
          }}
        />
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/40 border-b border-black/[0.03] px-6 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white shadow-sm border border-black/[0.02] flex items-center justify-center"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-900" />
          </motion.button>
          <h1 className="text-xl font-[1000] text-gray-900 tracking-tight">Admin Settlement</h1>
        </div>
        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-black/[0.02] flex items-center justify-center">
          <FiSend className="w-5 h-5 text-teal-600" />
        </div>
      </header>

      <main className="px-5 pt-8 relative z-10 max-w-lg mx-auto">
        {/* Amount Due Banner (High Impact) */}
        <div
          className="rounded-[40px] p-8 mb-8 relative overflow-hidden group shadow-[0_20px_50px_rgba(220,38,38,0.15)]"
          style={{
            background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
          }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-[1000] text-rose-100/60 uppercase tracking-[0.2em] mb-1">Outstanding Liability</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-[1000] text-rose-200">₹</span>
                <p className="text-4xl font-[1000] text-white tracking-tighter leading-none">
                  {wallet.amountDue?.toLocaleString() || 0}
                </p>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50">
              <FiDollarSign className="w-7 h-7" />
            </div>
          </div>
          
          <div className="relative z-10 mt-6 pt-5 border-t border-white/5 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-300 animate-pulse" />
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Action Required for Account Health</p>
          </div>
        </div>

        {/* Settlement Form (Premium Theme) */}
        <div className="bg-white/70 backdrop-blur-md rounded-[36px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 space-y-8">
          {/* Amount */}
          <div className="space-y-3">
            <label className="text-[10px] font-[1000] text-gray-400 uppercase tracking-[0.2em] ml-1">
              Payment Amount
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-[1000] text-lg">₹</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full pl-10 pr-6 py-4.5 bg-gray-50/50 rounded-[20px] border border-gray-100 focus:border-teal-500 focus:bg-white outline-none text-lg font-[1000] text-gray-900 transition-all placeholder:text-gray-200"
                placeholder="0.00"
                max={wallet.amountDue}
              />
            </div>
            <div className="flex justify-between items-center px-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Max Payable: ₹{wallet.amountDue?.toLocaleString()}</p>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setFormData(prev => ({ ...prev, amount: wallet.amountDue.toString() }))}
                className="text-[9px] font-[1000] text-teal-600 uppercase tracking-widest"
              >
                Clear All
              </motion.button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <label className="text-[10px] font-[1000] text-gray-400 uppercase tracking-[0.2em] ml-1">
              Transfer Mode
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'upi', label: 'UPI / GPay', icon: FiSmartphone },
                { id: 'bank_transfer', label: 'Wire Transfer', icon: FiCreditCard },
              ].map(method => (
                <motion.button
                  key={method.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                  className={`p-5 rounded-[24px] border transition-all flex flex-col items-center gap-3 ${formData.paymentMethod === method.id
                    ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-900/5'
                    : 'border-gray-100 bg-gray-50/50'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.paymentMethod === method.id ? 'bg-teal-600 text-white' : 'bg-white text-gray-400'}`}>
                    <method.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-[1000] uppercase tracking-widest ${formData.paymentMethod === method.id ? 'text-teal-700' : 'text-gray-400'}`}>
                    {method.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Payment Reference */}
          <div className="space-y-3">
            <label className="text-[10px] font-[1000] text-gray-400 uppercase tracking-[0.2em] ml-1">
              Transaction ID
            </label>
            <input
              type="text"
              value={formData.paymentReference}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentReference: e.target.value }))}
              className="w-full px-5 py-4.5 bg-gray-50/50 rounded-[20px] border border-gray-100 focus:border-teal-500 focus:bg-white outline-none text-xs font-[1000] text-gray-900 uppercase tracking-widest transition-all placeholder:text-gray-200"
              placeholder="ENTER REF OR TXN ID"
            />
          </div>

          {/* Payment Proof */}
          <div className="space-y-3">
            <label className="text-[10px] font-[1000] text-gray-400 uppercase tracking-[0.2em] ml-1">
              Transaction Proof
            </label>
            {proofPreview ? (
              <div className="relative group">
                <img
                  src={proofPreview}
                  alt="Payment Proof"
                  className="w-full h-64 object-cover bg-gray-50 rounded-[28px] border border-gray-100 shadow-inner"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setProofPreview(null);
                    setFormData(prev => ({ ...prev, paymentProof: '' }));
                  }}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all"
                >
                  <FiX className="w-5 h-5" />
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                {flutterBridge.isFlutter && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNativeCamera}
                    className="w-full py-5 bg-gray-900 text-white rounded-[24px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all font-[1000] text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-black/10"
                  >
                    <FiCamera className="w-5 h-5" />
                    Snap Receipt
                  </motion.button>
                )}

                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-100 rounded-[32px] cursor-pointer hover:bg-gray-50/50 hover:border-teal-200 transition-all bg-gray-50/20">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 text-teal-600 border border-black/[0.02]">
                    <FiUpload className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-[1000] text-gray-900 uppercase tracking-[0.15em]">
                    {flutterBridge.isFlutter ? 'Library Access' : 'Attach Screenshot'}
                  </span>
                  <span className="text-[8px] text-gray-400 mt-2 uppercase tracking-widest font-black opacity-50">HEIC, PNG, JPG (MAX 20MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProofUpload}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="text-[10px] font-[1000] text-gray-400 uppercase tracking-[0.2em] ml-1">
              Internal Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-5 py-4 bg-gray-50/50 rounded-[24px] border border-gray-100 focus:border-teal-500 focus:bg-white outline-none text-xs font-[1000] text-gray-900 transition-all placeholder:text-gray-200 resize-none"
              rows={3}
              placeholder="Any comments for the auditor..."
            />
          </div>
        </div>

        {/* Submit Execution */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={submitting || !formData.amount || !formData.paymentReference || !formData.paymentProof}
          className="w-full mt-10 py-6 rounded-[32px] font-[1000] text-white text-[12px] uppercase tracking-[0.35em] flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-20 bg-teal-600 shadow-2xl shadow-teal-900/20 group relative overflow-hidden"
        >
          {submitting ? (
            <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Submit Audit Logs
              <FiSend className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </>
          )}
        </motion.button>

        {/* Audit Disclaimer */}
        <div className="mt-12 mb-12 flex flex-col items-center gap-3 px-8 opacity-40">
          <FiCheck className="w-4 h-4 text-gray-400" />
          <p className="text-center text-[8px] text-gray-400 font-black uppercase tracking-[0.2em] leading-relaxed">
            Payment verification is performed by our financial audit team.<br />
            Balance updates are finalized within 24 operational hours.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default SettlementRequest;
