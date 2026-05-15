import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDollarSign, FiArrowRight, FiCreditCard, FiAlertCircle, FiCheckCircle, FiEdit2, FiClock, FiPlusCircle, FiActivity } from 'react-icons/fi';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import { requestWithdrawal, getWalletBalance, getWithdrawalHistory } from '../../services/walletService';
import { vendorDashboardService } from '../../services/dashboardService';
import { toast } from 'react-hot-toast';
import LogoLoader from '../../../../components/common/LogoLoader';

const WithdrawalRequest = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState({ available: 0 });
  const [amount, setAmount] = useState('');
  const [showBankForm, setShowBankForm] = useState(false);
  const [history, setHistory] = useState([]);
  const [bankAccount, setBankAccount] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    upiId: ''
  });
  const [isBankSaved, setIsBankSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [vendorStats, setVendorStats] = useState({
    commissionRate: 15,
    level: 3,
    platformFeeRate: 2
  });

  // Removed legacy layout effect background injection

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletRes, historyRes, statsRes] = await Promise.all([
        getWalletBalance(),
        getWithdrawalHistory(),
        vendorDashboardService.getDashboardStats()
      ]);
      setWallet({ available: walletRes.earnings || 0 });
      setHistory(historyRes || []);

      if (statsRes.success) {
        const stats = statsRes.data.stats;
        const level = stats.level || 3;
        const levelKey = `level${level}`;

        // Use dynamic rates from backend
        const commRate = stats.commissionRates?.[levelKey] || stats.commissionRate || 15;
        const pfRate = stats.platformFeeRates?.[levelKey] || 2;

        setVendorStats({
          commissionRate: commRate,
          level: level,
          platformFeeRate: pfRate
        });
      }

      const savedBank = JSON.parse(localStorage.getItem('vendorBankAccount') || 'null');
      if (savedBank) {
        setBankAccount({ ...savedBank, confirmAccountNumber: savedBank.accountNumber });
        setIsBankSaved(true);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAmountChange = (value) => {
    const numValue = value.replace(/[^0-9]/g, '');
    setAmount(numValue);
    setError('');

    const numAmount = parseInt(numValue) || 0;
    if (numAmount > wallet.available) {
      setError('Amount cannot exceed available earnings');
    } else if (numAmount < 100 && numValue !== '') {
      setError('Minimum withdrawal amount is ₹100');
    }
  };

  const handleMaxAmount = () => {
    setAmount(wallet.available.toString());
    setError('');
  };

  const handleBankInputChange = (e) => {
    const { name, value } = e.target;

    // Validate number-only fields
    if (name === 'accountNumber' || name === 'confirmAccountNumber') {
      const numValue = value.replace(/[^0-9]/g, '');
      setBankAccount(prev => ({ ...prev, [name]: numValue }));
      return;
    }

    setBankAccount(prev => ({ ...prev, [name]: value }));
  };

  const saveBankDetails = () => {
    if (!bankAccount.accountHolderName || !bankAccount.accountNumber || !bankAccount.bankName || !bankAccount.ifscCode) {
      toast.error('Please fill all mandatory bank details');
      return;
    }

    if (bankAccount.accountNumber !== bankAccount.confirmAccountNumber) {
      toast.error('Account numbers do not match');
      return;
    }

    localStorage.setItem('vendorBankAccount', JSON.stringify(bankAccount));
    setIsBankSaved(true);
    setShowBankForm(false);
    toast.success('Bank details updated');
  };

  const handleSubmit = async () => {
    const numAmount = parseInt(amount) || 0;
    if (!amount || numAmount === 0 || error) return;
    if (!isBankSaved) {
      toast.error('Please add bank details');
      return;
    }

    try {
      setLoading(true);
      await requestWithdrawal({
        amount: numAmount,
        bankDetails: bankAccount
      });
      toast.success('Request sent successfully!');
      window.dispatchEvent(new Event('vendorWalletUpdated'));
      navigate('/vendor/wallet');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const tdsRate = 1; // Updated to 1% as per user request
  const commissionRate = vendorStats.commissionRate;
  const platformFeeRate = vendorStats.platformFeeRate;

  const grossAmount = parseInt(amount) || 0;
  const commissionAmount = Math.round(grossAmount * (commissionRate / 100));
  const platformFeeAmount = Math.round(grossAmount * (platformFeeRate / 100));
  const tdsAmount = Math.round(grossAmount * (tdsRate / 100));
  const netAmount = grossAmount - commissionAmount - platformFeeAmount - tdsAmount;

  return (
    <AnimatePresence mode="wait">
      {(!wallet.available && !history.length) ? (
        <LogoLoader key="loader" fullScreen overlay />
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen bg-gray-50 pb-28 relative"
        >
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-gray-50 shadow-sm border border-gray-100 flex items-center justify-center text-gray-700"
          >
            <FiArrowRight className="w-5 h-5 rotate-180" />
          </motion.button>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Redeem Assets</h1>
        </div>
        <div className="w-10 h-10 bg-gray-50 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
          <FiActivity className="w-5 h-5 text-blue-600" />
        </div>
      </header>

      <main className="px-5 pt-6 relative z-10 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Balance & Input */}
          <div className="space-y-5">
            {/* Compact Premium Balance Card */}
            <div
              className="rounded-2xl p-6 shadow-lg shadow-blue-500/5 relative overflow-hidden group"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
            >
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-[9px] font-black text-blue-50 uppercase tracking-[0.2em] mb-1 opacity-80">Redeemable Liquidity</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-blue-100">₹</span>
                    <h2 className="text-3xl font-black text-white tracking-tighter leading-none">{wallet.available.toLocaleString()}</h2>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                  <FiDollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="relative z-10 mt-4 pt-4 border-t border-white/10 flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[8px] font-black text-blue-50 uppercase tracking-widest opacity-80">Assets Verified & Transferrable</p>
              </div>
            </div>

            {/* Amount Input Section */}
            <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Settlement Value</h3>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMaxAmount}
                  className="text-[8px] font-black text-blue-600 px-4 py-1.5 rounded-lg bg-blue-50 active:scale-95 transition-all uppercase tracking-widest border border-blue-100"
                >
                  Maximum
                </motion.button>
              </div>

              <div className="relative mb-6">
                <div className="absolute top-1/2 left-0 -translate-y-1/2 text-gray-200 font-black text-3xl">₹</div>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0"
                  className={`w-full pl-10 pr-2 py-2 bg-transparent border-b-2 border-dashed ${error ? 'border-red-500 text-red-500' : 'border-gray-100 focus:border-blue-500'
                    } text-5xl font-black text-right focus:outline-none transition-all text-gray-900 placeholder:text-gray-200 tracking-tighter`}
                />
              </div>

              {error && (
                <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3 mb-6 border border-red-100">
                  <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-red-500 text-[9px] font-black uppercase tracking-widest leading-relaxed">
                    {error}
                  </p>
                </div>
              )}

              {amount && !error && (
                <div className="bg-gray-50 rounded-xl p-6 space-y-4 border border-gray-100">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <span>Infrastructure Fee ({commissionRate + platformFeeRate}%)</span>
                    <span className="text-gray-800">₹{(commissionAmount + platformFeeAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <span>Statutory TDS (1%)</span>
                    <span className="text-gray-800">₹{tdsAmount.toLocaleString()}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Net Deployment Credit</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-black text-blue-600">₹</span>
                      <span className="text-3xl font-black text-blue-600 tracking-tighter">{netAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Bank Details & Action */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 shadow-inner">
                    <FiCreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Destination Path</h3>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Authorized Institution</p>
                  </div>
                </div>
                {isBankSaved && !showBankForm && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowBankForm(true)}
                    className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 transition-all hover:bg-blue-100 border border-blue-100"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" /> Update
                  </motion.button>
                )}
              </div>

              {!isBankSaved || showBankForm ? (
                <div className="space-y-5">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Account Proprietor</label>
                      <input
                        type="text"
                        name="accountHolderName"
                        value={bankAccount.accountHolderName}
                        onChange={handleBankInputChange}
                        className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:border-blue-500 outline-none text-[11px] font-black text-gray-800 uppercase tracking-widest transition-all placeholder:text-gray-300"
                        placeholder="ENTER FULL LEGAL NAME"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Institution</label>
                        <input
                          type="text"
                          name="bankName"
                          value={bankAccount.bankName}
                          onChange={handleBankInputChange}
                          className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:border-blue-500 outline-none text-[11px] font-black text-gray-800 uppercase tracking-widest transition-all placeholder:text-gray-300"
                          placeholder="BANK NAME"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Protocol Code</label>
                        <input
                          type="text"
                          name="ifscCode"
                          value={bankAccount.ifscCode}
                          onChange={handleBankInputChange}
                          className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:border-blue-500 outline-none text-[11px] font-black text-gray-800 uppercase tracking-widest transition-all placeholder:text-gray-300"
                          placeholder="IFSC CODE"
                          maxLength={11}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Identification Number</label>
                      <input
                        type="tel"
                        name="accountNumber"
                        value={bankAccount.accountNumber}
                        onChange={handleBankInputChange}
                        className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:border-blue-500 outline-none text-base font-black text-gray-800 tracking-[0.3em] transition-all placeholder:text-gray-200"
                        placeholder="0000 0000 0000"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={saveBankDetails}
                    className="w-full py-4.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    Authenticate Protocol
                  </motion.button>
                </div>
              ) : (
                <div
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col gap-6 group cursor-pointer hover:bg-gray-100 transition-all shadow-inner"
                  onClick={() => setShowBankForm(true)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.3em] mb-1.5">Primary Asset Destination</p>
                      <p className="font-black text-gray-900 text-sm uppercase tracking-[0.2em]">{bankAccount.bankName}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                      <FiCheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.3em] mb-2">Verified Settlement Path</p>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-200" />)}
                      </div>
                      <p className="font-black text-gray-900 text-xl tracking-[0.3em]">
                        {bankAccount.accountNumber?.slice(-4)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Final Execution Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!amount || !!error || !isBankSaved || loading}
              className="w-full py-6 rounded-2xl font-black text-white text-[10px] uppercase tracking-[0.35em] flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 bg-blue-600 shadow-xl shadow-blue-900/40 group relative overflow-hidden"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Deploy Asset Settlement
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </motion.button>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 px-10">
          <FiClock className="w-4 h-4 text-gray-300" />
          <p className="text-center text-[8px] text-gray-400 font-black uppercase tracking-[0.2em] leading-relaxed">
            Secure processing timeline: 24-48 business hours.<br />
            Digital receipt will be issued post-verification.
          </p>
        </div>
      </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WithdrawalRequest;
