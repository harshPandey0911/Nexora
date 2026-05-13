import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  if (!wallet.available && !history.length) {
    return <LogoLoader />;
  }

  return (
    <div className="min-h-screen pb-28 bg-white relative" style={{ background: '#FFFFFF' }}>
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
            <FiArrowRight className="w-5 h-5 text-gray-900 rotate-180" />
          </motion.button>
          <h1 className="text-xl font-[1000] text-gray-900 tracking-tight">Redeem Assets</h1>
        </div>
        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-black/[0.02] flex items-center justify-center">
          <FiActivity className="w-5 h-5 text-teal-600" />
        </div>
      </header>

      <main className="px-5 pt-8 relative z-10 max-w-lg mx-auto">
        {/* Compact Premium Balance Card */}
        <div
          className="rounded-[40px] p-8 shadow-[0_20px_50px_rgba(13,148,136,0.15)] mb-8 relative overflow-hidden group"
          style={{ background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)' }}
        >
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-[1000] text-teal-50/60 uppercase tracking-[0.2em] mb-1">Redeemable Liquidity</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-[1000] text-teal-200">₹</span>
                <h2 className="text-4xl font-[1000] text-white tracking-tighter leading-none">{wallet.available.toLocaleString()}</h2>
              </div>
            </div>
            <div className="w-14 h-14 rounded-[22px] bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50">
              <FiDollarSign className="w-7 h-7" />
            </div>
          </div>

          <div className="relative z-10 mt-6 pt-5 border-t border-white/5 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Assets Verified & Transferrable</p>
          </div>
        </div>

        {/* Amount Input Section */}
        <div className="bg-white/70 backdrop-blur-md rounded-[36px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 mb-6 group transition-all">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] font-[1000] text-gray-400 uppercase tracking-[0.2em]">Settlement Value</h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleMaxAmount}
              className="text-[9px] font-[1000] text-teal-600 px-4 py-2 rounded-full bg-teal-50 active:scale-95 transition-all uppercase tracking-widest border border-teal-100/50"
            >
              Maximum
            </motion.button>
          </div>

          <div className="relative mb-8">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 text-gray-200 font-[1000] text-4xl opacity-50">₹</div>
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              className={`w-full pl-10 pr-2 py-4 bg-transparent border-b-2 border-dashed ${error ? 'border-rose-200 text-rose-500' : 'border-gray-100 focus:border-teal-500'
                } text-5xl font-[1000] text-right focus:outline-none transition-all text-gray-900 placeholder:text-gray-100 tracking-tighter`}
            />
          </div>

          {error && (
            <div className="bg-rose-50 rounded-2xl p-4 flex items-center gap-3 mb-8">
              <FiAlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <p className="text-rose-600 text-[10px] font-[1000] uppercase tracking-widest leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {amount && !error && (
            <div className="bg-gray-50/50 rounded-[28px] p-6 space-y-4 border border-black/[0.02]">
              <div className="flex justify-between items-center text-[10px] font-[1000] uppercase tracking-widest text-gray-400">
                <span>Network Fee ({commissionRate + platformFeeRate}%)</span>
                <span className="text-gray-900">₹{(commissionAmount + platformFeeAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-[1000] uppercase tracking-widest text-gray-400">
                <span>Statutory TDS (1%)</span>
                <span className="text-gray-900">₹{tdsAmount.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-black/[0.05] flex justify-between items-center">
                <span className="text-[11px] font-[1000] text-gray-900 uppercase tracking-widest">Net Credit</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-teal-600">₹</span>
                  <span className="text-3xl font-[1000] text-teal-600 tracking-tighter">{netAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bank Details Container */}
        <div className="bg-white/70 backdrop-blur-md rounded-[36px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 mb-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[20px] bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                <FiCreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[11px] font-[1000] text-gray-900 uppercase tracking-widest">Destination</h3>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Verified Payout Path</p>
              </div>
            </div>
            {isBankSaved && !showBankForm && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBankForm(true)}
                className="text-[10px] font-[1000] text-teal-600 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-all"
              >
                <FiEdit2 /> Update
              </motion.button>
            )}
          </div>

          {!isBankSaved || showBankForm ? (
            <div className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-[1000] text-gray-400 uppercase tracking-widest ml-1">Account Holder</label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={bankAccount.accountHolderName}
                    onChange={handleBankInputChange}
                    className="w-full px-5 py-4 bg-gray-50/50 rounded-[20px] border border-gray-100 focus:border-teal-500 focus:bg-white outline-none text-xs font-[1000] text-gray-900 uppercase tracking-widest transition-all"
                    placeholder="ENTER FULL NAME"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-[1000] text-gray-400 uppercase tracking-widest ml-1">Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      value={bankAccount.bankName}
                      onChange={handleBankInputChange}
                      className="w-full px-5 py-4 bg-gray-50/50 rounded-[20px] border border-gray-100 focus:border-teal-500 focus:bg-white outline-none text-xs font-[1000] text-gray-900 uppercase tracking-widest transition-all"
                      placeholder="HDFC, SBI, ETC."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-[1000] text-gray-400 uppercase tracking-widest ml-1">IFSC Code</label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={bankAccount.ifscCode}
                      onChange={handleBankInputChange}
                      className="w-full px-5 py-4 bg-gray-50/50 rounded-[20px] border border-gray-100 focus:border-teal-500 focus:bg-white outline-none text-xs font-[1000] text-gray-900 uppercase tracking-widest transition-all"
                      placeholder="IFSC000XXXX"
                      maxLength={11}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-[1000] text-gray-400 uppercase tracking-widest ml-1">Account Number</label>
                  <input
                    type="tel"
                    name="accountNumber"
                    value={bankAccount.accountNumber}
                    onChange={handleBankInputChange}
                    className="w-full px-5 py-4 bg-gray-50/50 rounded-[20px] border border-gray-100 focus:border-teal-500 focus:bg-white outline-none text-lg font-[1000] text-gray-900 tracking-[0.2em] transition-all"
                    placeholder="0000 0000 0000"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={saveBankDetails}
                className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-[1000] text-[11px] uppercase tracking-[0.25em] shadow-xl shadow-black/10 active:scale-95 transition-all"
              >
                Authenticate Account
              </motion.button>
            </div>
          ) : (
            <div
              className="bg-gray-50/50 rounded-[32px] p-6 border border-gray-100 flex flex-col gap-6 group cursor-pointer hover:border-teal-500/20 transition-all"
              onClick={() => setShowBankForm(true)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] text-gray-400 font-[1000] uppercase tracking-widest mb-1.5 opacity-60">Primary Payout Institution</p>
                  <p className="font-[1000] text-gray-900 text-sm uppercase tracking-[0.1em]">{bankAccount.bankName}</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100/50">
                  <FiCheckCircle className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 font-[1000] uppercase tracking-widest mb-2 opacity-60">Current Linked Account</p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-200" />)}
                  </div>
                  <p className="font-[1000] text-gray-900 text-xl tracking-[0.25em]">
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
          className="w-full py-6 rounded-[30px] font-[1000] text-white text-[12px] uppercase tracking-[0.35em] flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-20 bg-teal-600 shadow-2xl shadow-teal-900/20 group relative overflow-hidden"
        >
          {loading ? (
            <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Initialize Transfer
              <FiArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </>
          )}
        </motion.button>

        <div className="mt-12 flex flex-col items-center gap-2 px-8">
          <FiClock className="w-4 h-4 text-gray-300" />
          <p className="text-center text-[9px] text-gray-400 font-black uppercase tracking-[0.15em] leading-relaxed opacity-50">
            Secure processing timeline: 24-48 business hours.<br />
            Digital receipt will be issued post-verification.
          </p>
        </div>
      </main>
    </div>
  );
};

export default WithdrawalRequest;
