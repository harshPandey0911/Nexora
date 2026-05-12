import React, { useState, useEffect, memo, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiBriefcase, FiUsers, FiUser } from 'react-icons/fi';
import { HiHome, HiBriefcase, HiUsers, HiUser } from 'react-icons/hi';
import { FaWallet } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const BottomNav = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingJobsCount, setPendingJobsCount] = useState(0);

  // Load pending jobs count from localStorage
  useEffect(() => {
    const updatePendingCount = () => {
      try {
        const acceptedBookings = JSON.parse(localStorage.getItem('vendorAcceptedBookings') || '[]');
        const activeJobs = acceptedBookings.filter(job => job.status === 'PENDING');
        setPendingJobsCount(activeJobs.length);
      } catch (error) {
        console.error('Error reading pending jobs:', error);
      }
    };

    updatePendingCount();
    window.addEventListener('storage', updatePendingCount);
    window.addEventListener('vendorJobsUpdated', updatePendingCount);

    return () => {
      window.removeEventListener('storage', updatePendingCount);
      window.removeEventListener('vendorJobsUpdated', updatePendingCount);
    };
  }, []);

  const navItems = useMemo(() => [
    { path: '/vendor/dashboard', icon: FiHome, activeIcon: HiHome, label: 'Home' },
    { path: '/vendor/jobs', icon: FiBriefcase, activeIcon: HiBriefcase, label: 'Jobs', badge: pendingJobsCount },
    { path: '/vendor/workers', icon: FiUsers, activeIcon: HiUsers, label: 'Workers' },
    { path: '/vendor/wallet', icon: FaWallet, activeIcon: FaWallet, label: 'Wallet' },
    { path: '/vendor/profile', icon: FiUser, activeIcon: HiUser, label: 'Profile' },
  ], [pendingJobsCount]);

  const handleNavClick = (path) => {
    if (location.pathname !== path) navigate(path);
  };

  const hideNavRoutes = ['/vendor/booking-alert/', '/vendor/booking/'];
  const shouldHideNav = hideNavRoutes.some(route => 
    location.pathname.includes(route) && (location.pathname.includes('/map') || location.pathname.includes('/alert/'))
  );

  if (shouldHideNav) return null;

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center lg:hidden px-4 pointer-events-none">
      <div 
        className="flex items-center justify-between bg-white px-2 py-2 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-gray-100 w-full max-w-sm pointer-events-auto"
      >
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path) || (item.path === '/vendor/dashboard' && location.pathname === '/vendor');
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className="relative flex items-center justify-center p-1 outline-none group flex-1 h-11"
            >
              <motion.div
                layout
                className={`flex items-center gap-2 px-3 h-full rounded-full transition-colors duration-200 ${
                  isActive ? 'bg-[#0D463C]' : 'hover:bg-gray-50'
                }`}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35
                }}
              >
                <div className="relative flex items-center justify-center w-5 shrink-0">
                  <Icon 
                    className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-400'}`} 
                  />
                  {item.badge !== undefined && item.badge > 0 && !isActive && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-[11px] font-black text-white whitespace-nowrap overflow-hidden tracking-tight"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
export default BottomNav;

