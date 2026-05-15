import React, { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBell, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';
import Logo from '../../../../components/common/Logo';
import api from '../../../../services/api';

const Header = memo(({
  title,
  onBack,
  showBack = true,
  showSearch = false,
  showNotifications = false,
  notificationCount = 0
}) => {
  const navigate = useNavigate();
  const [count, setCount] = useState(notificationCount);

  // Sync prop changes
  useEffect(() => {
    if (typeof notificationCount !== 'undefined') {
      setCount(notificationCount);
    }
  }, [notificationCount]);

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/notifications/vendor');
        if (res.data.success && typeof res.data.unreadCount === 'number') {
          setCount(res.data.unreadCount);
        }
      } catch (error) {
        // Silent fail
      }
    };

    if (showNotifications) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000); // Poll every minute
      return () => clearInterval(interval);
    }
  }, [showNotifications]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleNotifications = () => {
    navigate('/vendor/notifications');
  };

  const handleLogoClick = () => {
    navigate('/vendor/dashboard');
  };

  return (
    <header
      className="bg-white fixed top-0 left-0 right-0 z-[100] transition-all duration-300 lg:left-[278px] border-b border-gray-100 shadow-sm"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="flex items-center justify-between px-4 lg:px-6 py-5">
        {/* Left: Back button & Page Title */}
        <div className="flex items-center gap-4">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 active:scale-95"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
          )}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-800 leading-tight">
              {title || 'Vendor Hub'}
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
              Manage your business operations and performance
            </p>
          </div>
        </div>

        {/* Right: Notifications */}
        <div className="flex items-center gap-4">
          {showSearch && (
            <button
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
              onClick={() => navigate('/vendor/jobs')}
            >
              <FiSearch className="w-6 h-6" />
            </button>
          )}
          
          {showNotifications && (
            <div className="relative">
              <button
                onClick={handleNotifications}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
              >
                <FiBell className="w-6 h-6" />
              </button>
              
              {count > 0 && (
                <span
                  className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px] px-1 border-2 border-white shadow-sm"
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'VendorHeader';
export default Header;
