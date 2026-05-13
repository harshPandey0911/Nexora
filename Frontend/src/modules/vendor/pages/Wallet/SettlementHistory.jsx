import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiCheck, FiX, FiDollarSign, FiChevronRight } from 'react-icons/fi';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import vendorWalletService from '../../../../services/vendorWalletService';
import { toast } from 'react-hot-toast';

const SettlementHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState([]);
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
    loadSettlements();
  }, [filter]);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await vendorWalletService.getSettlements(params);
      if (res.success) {
        setSettlements(res.data || []);
      }
    } catch (error) {
      toast.error('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="w-5 h-5 text-orange-500" />;
      case 'approved':
        return <FiCheck className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <FiX className="w-5 h-5 text-red-500" />;
      default:
        return <FiDollarSign className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
      case 'approved':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
            <FiClock className="w-5 h-5 text-gray-900 rotate-180" />
          </motion.button>
          <h1 className="text-xl font-[1000] text-gray-900 tracking-tight">Archive Ledger</h1>
        </div>
        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-black/[0.02] flex items-center justify-center">
          <FiDollarSign className="w-5 h-5 text-teal-600" />
        </div>
      </header>

      <main className="px-5 pt-8 relative z-10">
        {/* Filter Tabs (Premium Theme) */}
        <div className="flex gap-2.5 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all', label: 'All Logs' },
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
          ].map(option => (
            <button
              key={option.id}
              onClick={() => setFilter(option.id)}
              className={`px-7 py-3 rounded-full font-[1000] text-[10px] uppercase tracking-widest whitespace-nowrap transition-all duration-500 ${filter === option.id
                ? 'bg-teal-600 text-white shadow-xl shadow-teal-900/20 scale-105'
                : 'bg-white/60 backdrop-blur-md text-gray-500 border border-white/60 shadow-sm hover:bg-gray-50'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Settlements List */}
        {loading ? (
          <div className="space-y-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/60 backdrop-blur-md rounded-[32px] p-6 border border-white shadow-sm animate-pulse h-28" />
            ))}
          </div>
        ) : settlements.length === 0 ? (
          <div className="bg-white/40 backdrop-blur-md rounded-[40px] p-16 text-center border border-white/60">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">
              📜
            </div>
            <h3 className="text-xl font-[1000] text-gray-900 mb-2">History is Empty</h3>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest opacity-60">
              No settlement records found for this period
            </p>
          </div>
        ) : (
          <div className="space-y-5 pb-10">
            {settlements.map((settlement) => {
              const statusColors = getStatusColor(settlement.status);
              return (
                <div
                  key={settlement._id}
                  className="bg-white/70 backdrop-blur-md rounded-[36px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 group hover:shadow-xl transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon Box */}
                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border transition-all ${
                      settlement.status === 'approved' ? 'bg-teal-50 border-teal-100/50 text-teal-600' :
                      settlement.status === 'pending' ? 'bg-amber-50 border-amber-100/50 text-amber-500' :
                      'bg-rose-50 border-rose-100/50 text-rose-500'
                    }`}>
                      {getStatusIcon(settlement.status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-black text-gray-400">₹</span>
                          <p className="text-xl font-[1000] text-gray-900 tracking-tight">
                            {settlement.amount.toLocaleString()}
                          </p>
                        </div>
                        <span className={`text-[9px] font-[1000] px-3 py-1.5 rounded-full uppercase tracking-widest border ${
                          settlement.status === 'approved' ? 'bg-teal-600 text-white border-teal-500' :
                          settlement.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-rose-100 text-rose-700 border-rose-200'
                        }`}>
                          {settlement.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-70">
                          {settlement.paymentMethod === 'upi' ? 'UPI' : 'Bank Transfer'}
                        </p>
                        {settlement.paymentReference && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                            <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">
                              {settlement.paymentReference}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/[0.03]">
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.1em]">
                          {formatDate(settlement.createdAt)}
                        </p>
                        <FiChevronRight className="w-4 h-4 text-gray-200 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                      </div>

                      {settlement.status === 'rejected' && settlement.rejectionReason && (
                        <div className="mt-4 p-4 bg-rose-50/50 rounded-[20px] border border-rose-100/30">
                          <p className="text-[10px] font-[1000] text-rose-600 uppercase tracking-widest leading-relaxed">
                            <span className="opacity-50">Notice:</span> {settlement.rejectionReason}
                          </p>
                        </div>
                      )}

                      {settlement.adminNotes && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-[20px] border border-black/[0.02]">
                          <p className="text-[10px] font-[1000] text-gray-600 uppercase tracking-widest leading-relaxed">
                            <span className="opacity-50">Audit Note:</span> {settlement.adminNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default SettlementHistory;
