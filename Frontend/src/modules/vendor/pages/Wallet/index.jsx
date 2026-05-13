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
        <h1 className="text-xl font-[1000] text-gray-900 tracking-tight">Financial Ledger</h1>
        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-black/[0.02] flex items-center justify-center">
          <FiDollarSign className="w-5 h-5 text-teal-600" />
        </div>
      </header>

      <main className="px-5 pt-8 relative z-10">
        {/* Available Earnings Card (Premium Teal Gradient) */}
        <div
          className="rounded-[40px] p-8 shadow-[0_20px_50px_rgba(13,148,136,0.15)] mb-8 relative overflow-hidden group"
          style={{ 
            background: `linear-gradient(135deg, #0D9488 0%, #0F766E 100%)` 
          }}
        >
          {/* Decorative Elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                <FiArrowUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-[1000] text-teal-50/60 uppercase tracking-[0.2em]">Net Available Assets</p>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Real-time sync active</p>
              </div>
            </div>
            
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-[1000] text-teal-200">₹</span>
                  <p className="text-4xl font-[1000] text-white leading-none tracking-tight">
                    {wallet.balance.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
                  <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Weekly Payout Cycle</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="bg-white/10 hover:bg-white/20 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/10 transition-all group/btn"
              >
                <span className="text-[10px] font-[1000] text-white uppercase tracking-widest group-hover/btn:translate-x-1 transition-transform inline-block">Withdraw</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Stats Grid (Premium Theme) */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/70 backdrop-blur-md rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100/30">
                <FiArrowDown className="w-4.5 h-4.5 text-rose-500" />
              </div>
              <p className="text-[9px] font-[1000] text-gray-400 uppercase tracking-widest">Active Dues</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[13px] font-black text-gray-400">₹</span>
              <p className="text-2xl font-[1000] text-gray-900 tracking-tight">
                {wallet.dues?.toLocaleString() || 0}
              </p>
            </div>
            {wallet.dues > 0 && (
              <button
                onClick={() => navigate('/vendor/wallet/settle')}
                className="mt-5 w-full py-3 bg-gray-900 hover:bg-black text-white rounded-[18px] text-[10px] font-[1000] uppercase tracking-widest transition-all shadow-lg shadow-black/10 active:scale-95"
              >
                Clear Dues
              </button>
            )}
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100/30">
                <FiCheckCircle className="w-4.5 h-4.5 text-teal-600" />
              </div>
              <p className="text-[9px] font-[1000] text-gray-400 uppercase tracking-widest">Total Settled</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[13px] font-black text-gray-400">₹</span>
              <p className="text-2xl font-[1000] text-gray-900 tracking-tight">
                {wallet.totalSettled?.toLocaleString() || 0}
              </p>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-teal-600" />
              <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest">Verified Portfolio</p>
            </div>
          </div>
        </div>

        {/* Collection Threshold (Premium Theme) */}
        <div className="bg-white/70 backdrop-blur-md rounded-[36px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiClock className="text-teal-600 w-4 h-4" />
              <p className="text-[10px] font-[1000] text-gray-900 uppercase tracking-widest">Cash Collection Limit</p>
            </div>
            <p className="text-[11px] font-[1000] text-teal-600">
              ₹{(wallet.dues || 0).toLocaleString()} <span className="text-gray-300 font-black">/</span> ₹{(wallet.cashLimit || 10000).toLocaleString()}
            </p>
          </div>
          <div className="w-full h-3 bg-gray-100/50 rounded-full overflow-hidden p-0.5 border border-black/[0.02]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (wallet.dues / (wallet.cashLimit || 10000)) * 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full transition-all duration-700 ${(wallet.dues / (wallet.cashLimit || 10000)) > 0.8 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-teal-600 shadow-[0_0_10px_rgba(13,148,136,0.3)]'
                }`}
            />
          </div>
          <div className="mt-4 flex items-center gap-2 px-1">
            <FiAlertCircle className="text-gray-300 w-3 h-3 shrink-0" />
            <p className="text-[8px] font-[1000] text-gray-400 uppercase tracking-[0.05em] leading-relaxed">
              Maintain dues below 80% to ensure uninterrupted platform accessibility.
            </p>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-[1000] text-gray-900 uppercase tracking-[0.25em]">Audit Ledger</h3>
            
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {['all', 'cash_collected', 'settlement'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[8px] font-[1000] uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${filter === f 
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/20' 
                    : 'bg-white text-gray-400 border border-black/[0.03]'
                  }`}
                >
                  {f === 'all' ? 'Logs' : f.split('_')[0]}
                </button>
              ))}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="bg-white/40 backdrop-blur-md rounded-[40px] p-16 text-center border border-white/60">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-inner">
                🧾
              </div>
              <p className="text-[10px] font-[1000] text-gray-400 uppercase tracking-widest">No activity recorded</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((txn) => {
                const isNegative = ['cash_collected', 'tds_deduction', 'withdrawal', 'platform_fee'].includes(txn.type);

                return (
                  <div
                    key={txn._id}
                    className="bg-white/70 backdrop-blur-md rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 flex items-center gap-4 group hover:shadow-lg transition-all"
                  >
                    <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center shrink-0 border transition-all ${isNegative 
                      ? 'bg-rose-50/50 text-rose-500 border-rose-100/30 group-hover:bg-rose-500 group-hover:text-white' 
                      : 'bg-teal-50/50 text-teal-600 border-teal-100/30 group-hover:bg-teal-600 group-hover:text-white'
                    }`}>
                      {getTransactionIcon(txn.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[13px] font-[1000] text-gray-900 truncate tracking-tight">
                          {getTransactionLabel(txn.type)}
                        </p>
                        <p className={`text-[15px] font-[1000] tracking-tight ${isNegative ? 'text-rose-500' : 'text-teal-600'}`}>
                          {isNegative ? '-' : '+'}₹{Math.abs(txn.amount).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-gray-400/60 truncate uppercase tracking-tighter">
                          {txn.description}
                        </p>
                        <span className="text-[9px] font-black text-teal-600/30 uppercase">
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
          className="w-full mt-12 mb-10 py-5 rounded-[28px] font-[1000] text-[11px] text-gray-400 bg-white border border-black/[0.03] shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-[0.25em] hover:text-teal-600 hover:border-teal-500/20"
        >
          Detailed Analysis <FiArrowRight className="w-4 h-4" />
        </motion.button>
      </main>
    </div>
  );
};

export default Wallet;
