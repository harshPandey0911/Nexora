import React, { useState, useEffect, memo, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiBriefcase, FiUser, FiDollarSign, FiBell } from 'react-icons/fi';
import { HiHome, HiBriefcase, HiUser } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../../services/api';

const BottomNav = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingJobsCount, setPendingJobsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Load counts
  useEffect(() => {
    const updatePendingCount = () => {
      try {
        const assignedJobs = JSON.parse(localStorage.getItem('workerAssignedJobs') || '[]');
        const pendingJobs = assignedJobs.filter(job => job.workerStatus === 'PENDING');
        setPendingJobsCount(pendingJobs.length);
      } catch (error) {
        console.error('Error reading pending jobs:', error);
      }
    };

    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/notifications/worker');
        if (res.data.success && typeof res.data.unreadCount === 'number') {
          setUnreadNotificationsCount(res.data.unreadCount);
        }
      } catch (error) {}
    };

    updatePendingCount();
    fetchUnreadCount();

    window.addEventListener('storage', updatePendingCount);
    window.addEventListener('workerJobsUpdated', updatePendingCount);
    const interval = setInterval(fetchUnreadCount, 60000);

    return () => {
      window.removeEventListener('storage', updatePendingCount);
      window.removeEventListener('workerJobsUpdated', updatePendingCount);
      clearInterval(interval);
    };
  }, []);

  const navItems = useMemo(() => [
    { path: '/worker/dashboard', icon: FiHome, activeIcon: HiHome, label: 'Home' },
    { path: '/worker/jobs', icon: FiBriefcase, activeIcon: HiBriefcase, label: 'Jobs', badge: pendingJobsCount },
    { path: '/worker/wallet', icon: FiDollarSign, activeIcon: FiDollarSign, label: 'Wallet' },
    { path: '/worker/notifications', icon: FiBell, activeIcon: FiBell, label: 'Alerts', badge: unreadNotificationsCount },
    { path: '/worker/profile', icon: FiUser, activeIcon: HiUser, label: 'Profile' },
  ], [pendingJobsCount, unreadNotificationsCount]);

  const handleNavClick = (path) => {
    if (location.pathname !== path) navigate(path);
  };

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center lg:hidden px-4">
      <div 
        className="flex items-center justify-between bg-white/90 backdrop-blur-xl px-2 py-2 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100/50 w-full max-w-sm"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/worker/dashboard' && location.pathname === '/worker');
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className="relative flex items-center justify-center transition-all duration-300"
            >
              <motion.div
                layout
                initial={false}
                animate={{
                  width: isActive ? 'auto' : '44px',
                  backgroundColor: isActive ? '#0D463C' : 'transparent',
                }}
                className={`flex items-center gap-2 px-2.5 h-10 rounded-full overflow-hidden`}
              >
                <div className="relative">
                  <Icon 
                    className={`w-4.5 h-4.5 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-400'}`} 
                  />
                  {item.badge !== undefined && item.badge > 0 && !isActive && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>

                <AnimatePresence mode="popLayout">
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-[11px] font-black text-white whitespace-nowrap pr-0.5"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {item.badge !== undefined && item.badge > 0 && isActive && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
export default BottomNav;

