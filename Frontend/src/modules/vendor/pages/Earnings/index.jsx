import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDollarSign, FiTrendingUp, FiCalendar, FiGift, FiAlertCircle, FiPieChart } from 'react-icons/fi';
import { FaWallet } from 'react-icons/fa';
import { vendorTheme as themeColors } from '../../../../theme';
import { getEarningsOverview } from '../../services/earningsService';
import LogoLoader from '../../../../components/common/LogoLoader';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Earnings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('monthly'); // for chart: daily, weekly, monthly
  const [filter, setFilter] = useState('all'); // for history and breakdown: all, today, week, month
  
  const [earningsData, setEarningsData] = useState(() => {
    const cached = localStorage.getItem('vendorEarningsData');
    return cached ? JSON.parse(cached) : {
      totals: { total: 0, today: 0, week: 0, month: 0 },
      breakdown: { totalEarnings: 0, totalDeductions: 0, totalBonuses: 0 },
      chartData: [],
      history: []
    };
  });


  const fetchEarnings = async () => {
    try {
      if (!earningsData.history || earningsData.history.length === 0) setLoading(true);
      setError('');
      const res = await getEarningsOverview({ period, filter });
      if (res.success) {
        setEarningsData(res.data);
        localStorage.setItem('vendorEarningsData', JSON.stringify(res.data));
      } else {
        setError(res.message || 'Failed to load earnings data');
      }
    } catch (err) {
      console.error('Fetch earnings error:', err);
      setError('An error occurred while fetching earnings data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [period, filter]);

  // Format date for chart X-axis
  const formatXAxis = (tickItem) => {
    if (!tickItem) return '';
    const parts = tickItem.split('-');
    if (period === 'daily' && parts.length === 3) {
      return `${parts[2]}/${parts[1]}`; // DD/MM
    }
    if (period === 'weekly') {
      return `W${parts[1]}`;
    }
    if (period === 'monthly' && parts.length >= 2) {
      const date = new Date(parts[0], parseInt(parts[1]) - 1, 1);
      return date.toLocaleString('default', { month: 'short' });
    }
    return tickItem;
  };

  if (loading && !earningsData.chartData.length) {
    return <LogoLoader />;
  }

  const { totals, breakdown, chartData, history } = earningsData;

  return (
    <div className="space-y-6 pb-12">
      {/* Header - White Style */}
      <div className="bg-white p-5 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between text-gray-900 border border-gray-100 gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
            Revenue Analytics
          </h2>
          <p className="text-gray-500 text-[11px] font-medium mt-2">
            Monitor your financial performance and deployment growth
          </p>
        </div>
        <div className="w-12 h-12 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center shadow-inner">
          <FiTrendingUp className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-3.5 rounded-2xl text-[13px] font-bold flex items-center gap-3">
          <FiAlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Top Totals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <FiCalendar className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Today</p>
          </div>
          <p className="text-2xl font-black text-gray-800">₹{totals.today.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <FiTrendingUp className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">This Week</p>
          </div>
          <p className="text-2xl font-black text-gray-800">₹{totals.week.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <FiPieChart className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">This Month</p>
          </div>
          <p className="text-2xl font-black text-gray-800">₹{totals.month.toLocaleString()}</p>
        </div>

        <div className="bg-[#2874F0] rounded-[24px] p-5 shadow-xl shadow-blue-100 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaWallet className="w-4 h-4 text-white" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/80">All Time</p>
          </div>
          <p className="text-2xl font-black text-white relative z-10">₹{totals.total.toLocaleString()}</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <h3 className="text-base font-bold text-gray-800 uppercase tracking-widest">Revenue Growth</h3>
          <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100">
            {['daily', 'weekly', 'monthly'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${
                  period === p ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {p.replace('ly', '')}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2874F0" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2874F0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tickFormatter={formatXAxis} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #F1F5F9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#1E293B', fontWeight: '800', fontSize: '14px' }}
                  labelStyle={{ color: '#64748B', fontSize: '11px', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="amount" stroke="#2874F0" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-gray-400 text-sm font-bold uppercase tracking-widest">
               No data available for this period
             </div>
          )}
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-gray-800 uppercase tracking-widest">Operational Breakdown</h3>
          <div className="relative group">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white border border-gray-200 text-[10px] font-bold text-gray-600 px-6 py-2.5 rounded-xl outline-none cursor-pointer appearance-none uppercase tracking-widest hover:border-blue-500/50 transition-all shadow-sm"
            >
              <option value="all">Consolidated</option>
              <option value="today">Today</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 flex items-center justify-between border border-gray-100 group hover:shadow-md transition-all shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FiDollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Gross Earnings</p>
                <p className="text-xl font-black text-gray-800">+₹{breakdown.totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 flex items-center justify-between border border-gray-100 group hover:shadow-md transition-all shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FiGift className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Protocol Bonuses</p>
                <p className="text-xl font-black text-gray-800">+₹{breakdown.totalBonuses.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 flex items-center justify-between border border-gray-100 group hover:shadow-md transition-all shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <FiAlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">System Deductions</p>
                <p className="text-xl font-black text-rose-600">-₹{breakdown.totalDeductions.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="space-y-6 pt-6">
         <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Recent Activity</h2>
          <button onClick={() => navigate('/vendor/wallet')} className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest">View Wallet</button>
        </div>
        
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="bg-white rounded-[40px] p-20 text-center border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gray-100">
                <span className="text-3xl opacity-20">📊</span>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No activity history recorded</p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center justify-between hover:shadow-md transition-all shadow-sm group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.isDeduction ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                    {item.isDeduction ? <FiTrendingUp className="w-5 h-5 rotate-180" /> : <FiTrendingUp className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 uppercase tracking-tight">{item.description || item.type.replace('_', ' ')}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                <div className="text-right px-2">
                  <p className={`text-lg font-black ${item.isDeduction ? 'text-rose-600' : 'text-[#2874F0]'}`}>
                    {item.isDeduction ? '-' : '+'}₹{item.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Earnings;
