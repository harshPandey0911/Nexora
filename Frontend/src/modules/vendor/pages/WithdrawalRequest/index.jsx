import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDollarSign, FiArrowRight, FiCreditCard, FiAlertCircle, FiCheckCircle, FiEdit2, FiClock, FiPlusCircle, FiActivity } from 'react-icons/fi';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
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

  return (  return (
    <div className="min-h-screen pb-24 bg-white relative">
      {/* Premium Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 0% 0%, rgba(13, 148, 136, 0.05) 0%, transparent 70%),
              radial-gradient(at 100% 0%, rgba(13, 70, 60, 0.03) 0%, transparent 70%),
              #FFFFFF
            `
          }}
        />
      </div>

      <Header title="Redeem Earnings" showBack={true} />

      <main className="px-5 py-6 relative z-10 max-w-lg mx-auto">
        {/* Compact Premium Balance Card */}
        <div 
          className="rounded-[32px] p-6 shadow-2xl shadow-[#0D463C]/20 mb-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0D463C 0%, #062F28 100%)' }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-teal-400/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-black text-teal-300/50 uppercase tracking-[0.2em] mb-1">Redeemable Balance</p>
              <h2 className="text-4xl font-[1000] text-white tracking-tighter">₹{wallet.available.toLocaleString()}</h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50">
              <FiDollarSign className="w-6 h-6" />
            </div>
          </div>
          
          <div className="relative z-10 mt-6 pt-5 border-t border-white/5 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Verified & Ready for Transfer</p>
          </div>
        </div>

        {/* Amount Input */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-6 group transition-all">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Withdrawal Amount</h3>
            <button
              onClick={handleMaxAmount}
              className="text-[9px] font-black text-teal-600 px-3 py-1.5 rounded-full bg-teal-50 active:scale-95 transition-all uppercase tracking-widest"
            >
              Use Max
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 text-gray-200 font-black text-3xl">₹</div>
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              className={`w-full pl-8 pr-2 py-4 bg-white border-b-2 border-dashed ${
                error ? 'border-red-200 text-red-500' : 'border-gray-100 focus:border-[#0D463C]'
              } text-4xl font-[1000] text-right focus:outline-none transition-all text-gray-900 placeholder:text-gray-100`}
            />
          </div>

          {error && (
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center mb-6 flex justify-center items-center gap-2">
              <FiAlertCircle className="w-4 h-4" /> {error}
            </p>
          )}

          {amount && !error && (
            <div className="bg-gray-50/50 rounded-[24px] p-5 space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Commission ({commissionRate}%)</span>
                <span className="text-gray-900">- ₹{commissionAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Platform Fee ({platformFeeRate}%)</span>
                <span className="text-gray-900">- ₹{platformFeeAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Mandatory TDS (1%)</span>
                <span className="text-gray-900">- ₹{tdsAmount.toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Net Payout</span>
                <span className="text-2xl font-[1000] text-[#0D463C] tracking-tighter">₹{netAmount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                <FiCreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Payout Account</h3>
            </div>
            {isBankSaved && !showBankForm && (
              <button
                onClick={() => setShowBankForm(true)}
                className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center gap-1"
              >
                <FiEdit2 /> Change
              </button>
            )}
          </div>

          {!isBankSaved || showBankForm ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Holder</label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={bankAccount.accountHolderName}
                    onChange={handleBankInputChange}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-[#0D463C] focus:bg-white outline-none text-xs font-black text-gray-900 uppercase tracking-widest transition-all"
                    placeholder="FULL NAME"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      value={bankAccount.bankName}
                      onChange={handleBankInputChange}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-[#0D463C] focus:bg-white outline-none text-xs font-black text-gray-900 uppercase tracking-widest transition-all"
                      placeholder="BANK NAME"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">IFSC</label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={bankAccount.ifscCode}
                      onChange={handleBankInputChange}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-[#0D463C] focus:bg-white outline-none text-xs font-black text-gray-900 uppercase tracking-widest transition-all"
                      placeholder="IFSC0000XXX"
                      maxLength={11}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Number</label>
                  <input
                    type="tel"
                    name="accountNumber"
                    value={bankAccount.accountNumber}
                    onChange={handleBankInputChange}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:border-[#0D463C] focus:bg-white outline-none text-base font-[1000] text-gray-900 tracking-[0.1em] transition-all"
                    placeholder="ACCOUNT NUMBER"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <button
                onClick={saveBankDetails}
                className="w-full py-4 bg-[#0D463C] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-teal-900/10 active:scale-95 transition-all"
              >
                Save Payout Account
              </button>
            </div>
          ) : (
            <div 
              className="bg-gray-50/50 rounded-[24px] p-5 border border-gray-100 flex flex-col gap-4"
              onClick={() => setShowBankForm(true)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Bank Account</p>
                  <p className="font-black text-gray-900 text-xs uppercase tracking-widest">{bankAccount.bankName}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                  <FiCheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Account Number</p>
                <p className="font-black text-gray-900 text-lg tracking-[0.2em]">
                  {bankAccount.accountNumber?.replace(/(.{4})/g, '$1 ').trim()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit Action */}
        <button
          onClick={handleSubmit}
          disabled={!amount || !!error || !isBankSaved || loading}
          className="w-full py-5 rounded-full font-black text-white text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-20 bg-[#0D463C] shadow-2xl shadow-teal-900/20 group"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Confirm & Redeem
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <p className="text-center text-[9px] text-gray-400 mt-10 font-black uppercase tracking-[0.1em] leading-relaxed opacity-40 px-6">
          Payouts processed within 24-48 business hours.<br />
          Transaction ID will be generated once verified.
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default WithdrawalRequest;
