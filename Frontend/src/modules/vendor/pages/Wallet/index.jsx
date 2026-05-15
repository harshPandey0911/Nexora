import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDollarSign, FiArrowUp, FiArrowDown, FiArrowRight, FiClock, FiCheckCircle, FiAlertCircle, FiSend } from 'react-icons/fi';
import { vendorTheme as themeColors } from '../../../../theme';
import LogoLoader from '../../../../components/common/LogoLoader';
import vendorWalletService from '../../../../services/vendorWalletService';
import { toast } from 'react-hot-toast';

const Wallet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(() => {
    const cached = localStorage.getItem('vendorWalletData');
    return cached ? JSON.parse(cached) : {
      balance: 0,
      dues: 0,
      earnings: 0,
      amountDue: 0,
      totalCashCollected: 0,
      totalSettled: 0,
      totalWithdrawn: 0,
      pendingSettlements: 0,
      cashLimit: 10000
    };
  });
  const [transactions, setTransactions] = useState(() => {
    const cached = localStorage.getItem('vendorTransactions');
    return cached ? JSON.parse(cached) : [];
  });
  const [filter, setFilter] = useState('all');


  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      if (transactions.length === 0) setLoading(true);
      const [walletRes, txnRes] = await Promise.all([
        vendorWalletService.getWallet(),
        vendorWalletService.getTransactions({ limit: 50 })
      ]);

      if (walletRes.success) {
        setWallet(walletRes.data);
        localStorage.setItem('vendorWalletData', JSON.stringify(walletRes.data));
      }

      if (txnRes.success) {
        const txns = txnRes.data || [];
        setTransactions(txns);
        localStorage.setItem('vendorTransactions', JSON.stringify(txns));
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(txn => {
    if (filter === 'all') return true;
    return txn.type === filter;
  });

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'cash_collected':
        return <FiArrowDown className="w-5 h-5 text-red-500" />;
      case 'earnings_credit':
        return <FiArrowUp className="w-5 h-5 text-green-500" />;
      case 'settlement':
        return <FiSend className="w-5 h-5 text-blue-500" />;
      case 'withdrawal':
        return <FiDollarSign className="w-5 h-5 text-purple-500" />;
      case 'tds_deduction':
        return <FiAlertCircle className="w-5 h-5 text-amber-500" />;
      case 'commission':
        return <FiDollarSign className="w-5 h-5 text-orange-500" />;
      case 'platform_fee':
        return <FiAlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <FiDollarSign className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'cash_collected':
        return 'Cash Collected';
      case 'earnings_credit':
        return 'Earnings Credited';
      case 'settlement':
        return 'Settlement Paid';
      case 'withdrawal':
        return 'Withdrawal Payout';
      case 'tds_deduction':
        return 'TDS Deduction';
      case 'commission':
        return 'Commission';
      case 'platform_fee':
        return 'Platform Charge';
      default:
        return type;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return <LogoLoader />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header - White Style */}
      <div className="bg-white p-5 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between text-gray-900 border border-gray-100 gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
            Financial Ledger
          </h2>
          <p className="text-gray-500 text-[11px] font-medium mt-2">
            Monitor your assets, collections, and withdrawal history
          </p>
        </div>
        <div className="w-12 h-12 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center shadow-inner group transition-all">
          <FiDollarSign className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Available Earnings Card (Light Blue Gradient) */}
      <div
        className="rounded-3xl p-6 shadow-xl shadow-blue-500/10 relative overflow-hidden group"
        style={{ 
          background: `linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)` 
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
              <FiArrowUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[9px] font-black text-blue-50 uppercase tracking-widest">Net Available Assets</p>
              <p className="text-[8px] font-bold text-white/60 uppercase tracking-widest mt-0.5">Real-time sync active</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white tracking-tighter">₹{wallet.balance?.toFixed(2)}</span>
                <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mb-1">Available for payout</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black text-blue-100 uppercase tracking-[0.15em]">Weekly Payout Cycle</span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/vendor/wallet/withdraw')}
              className="bg-white text-blue-600 px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-50 transition-all active:scale-90"
            >
              Withdraw
            </motion.button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Dues */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
              <FiArrowDown className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Dues</p>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-black text-gray-900 tracking-tighter">₹{wallet.amountDue || 0}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Current Liability</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/vendor/wallet/settle')}
              className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95"
            >
              Clear Dues
            </motion.button>
          </div>
        </div>

        {/* Total Settled */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm group">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <FiCheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Settled</p>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-black text-gray-900 tracking-tighter">₹{wallet.totalSettled || 0}</span>
            </div>

            <div className="flex items-center gap-2 mt-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Verified Portfolio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Limit Visualizer */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FiClock className="text-blue-600 w-5 h-5" />
            <p className="text-sm font-bold text-gray-800 uppercase tracking-widest">Cash Collection Limit</p>
          </div>
          <p className="text-base font-black text-blue-600">
            ₹{(wallet.dues || 0).toLocaleString()} <span className="text-gray-300">/</span> ₹{(wallet.cashLimit || 10000).toLocaleString()}
          </p>
        </div>
        <div className="w-full h-4 bg-gray-50 rounded-full overflow-hidden p-1 border border-gray-100 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (wallet.dues / (wallet.cashLimit || 10000)) * 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full transition-all duration-700 shadow-sm ${(wallet.dues / (wallet.cashLimit || 10000)) > 0.8 ? 'bg-red-500' : 'bg-blue-600'
              }`}
          />
        </div>
        <div className="mt-6 flex items-center gap-3 px-1">
          <FiAlertCircle className="text-gray-400 w-4 h-4 shrink-0" />
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
            Maintain dues below 80% to ensure uninterrupted platform accessibility.
          </p>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-base font-bold text-gray-800 uppercase tracking-widest">Audit Ledger</h3>
          
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {['all', 'cash_collected', 'settlement'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[9px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all border ${filter === f 
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-200' 
                  : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50 shadow-sm'
                }`}
              >
                {f === 'all' ? 'Consolidated' : f.split('_')[0]}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-[40px] p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-100">
              <span className="text-2xl">🧾</span>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No activity recorded</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTransactions.map((txn) => {
              const isNegative = ['cash_collected', 'tds_deduction', 'withdrawal', 'platform_fee'].includes(txn.type);

              return (
                <div
                  key={txn._id}
                  className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all"
                >
                  <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 border transition-all ${isNegative 
                    ? 'bg-red-50 text-red-600 border-red-100' 
                    : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {getTransactionIcon(txn.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-base font-bold text-gray-900 truncate tracking-tight uppercase">
                        {getTransactionLabel(txn.type)}
                      </p>
                      <p className={`text-lg font-black tracking-tight ${isNegative ? 'text-red-600' : 'text-blue-600'}`}>
                        {isNegative ? '-' : '+'}₹{Math.abs(txn.amount).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium text-gray-500 truncate uppercase">
                        {txn.description}
                      </p>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {formatDate(txn.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/vendor/wallet/settlements')}
        className="w-full mt-12 mb-10 py-5 rounded-[24px] font-bold text-[10px] text-gray-600 bg-white border border-gray-100 shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest hover:bg-gray-50 hover:text-blue-600"
      >
        Detailed Analysis <FiArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

export default Wallet;
