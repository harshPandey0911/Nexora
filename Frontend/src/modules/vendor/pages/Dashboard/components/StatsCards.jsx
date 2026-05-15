import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiBriefcase, FiUsers, FiCheckCircle } from 'react-icons/fi';
import { FaWallet } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../../theme';

const StatsCards = memo(({ stats }) => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Today's Yield",
      value: `₹${stats.todayEarnings.toLocaleString()}`,
      icon: FaWallet,
      color: 'blue',
      onClick: () => navigate('/vendor/earnings')
    },
    {
      title: 'Active Protocols',
      value: stats.activeJobs,
      icon: FiBriefcase,
      color: 'emerald',
      onClick: () => navigate('/vendor/jobs')
    },
    {
      title: 'Pending Signals',
      value: stats.pendingAlerts,
      icon: FiClock,
      color: 'amber',
      onClick: () => navigate('/vendor/booking-alerts')
    },
    {
      title: 'Service Catalog',
      value: stats.totalCategories || 0,
      icon: FiBox,
      color: 'purple',
      onClick: () => navigate('/vendor/my-services')
    }
  ];

  return (
    <div className="px-10 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const IconComponent = card.icon;

          return (
            <motion.div
              key={index}
              whileTap={{ scale: 0.98 }}
              onClick={card.onClick}
              className="bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-white/5 cursor-pointer hover:bg-white/[0.08] transition-all duration-500 group flex flex-col justify-between h-full shadow-2xl"
            >
              <div 
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 bg-white/5 border border-white/5 group-hover:scale-110 shadow-inner ${
                  card.color === 'blue' ? 'text-blue-500' : 
                  card.color === 'emerald' ? 'text-emerald-500' : 
                  card.color === 'amber' ? 'text-amber-500' : 'text-purple-500'
                }`}
              >
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="mt-6">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-2">
                  {card.title}
                </p>
                <p className="text-3xl font-black text-white tracking-tighter">
                  {card.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

StatsCards.displayName = 'VendorStatsCards';

export default StatsCards;
