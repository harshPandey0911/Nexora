import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiGift, FiShoppingCart, FiUser, FiTrash2, FiCalendar, FiShoppingBag } from 'react-icons/fi';
import { HiHome, HiGift, HiShoppingCart, HiUser, HiTrash, HiCalendar } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../../../context/CartContext';
import { userTheme as themeColors } from '../../../../theme';



const BottomNav = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);
  const { cartCount } = useCart();
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const navItems = useMemo(() => [
    { id: 'home', label: 'Home', icon: FiHome, filledIcon: HiHome, path: '/user' },
    { id: 'bookings', label: 'Bookings', icon: FiCalendar, filledIcon: HiCalendar, path: '/user/my-bookings' },
    { id: 'cart', label: 'Cart', icon: FiShoppingCart, filledIcon: HiShoppingCart, path: '/user/cart', isCart: true },
    { id: 'account', label: 'Account', icon: FiUser, filledIcon: HiUser, path: '/user/account' },
  ], []);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/user' || path === '/user/' || path.startsWith('/user/category/')) return 'home';
    if (path.startsWith('/user/my-bookings')) return 'bookings';
    if (path.startsWith('/user/cart')) return 'cart';
    if (path.startsWith('/user/account') || path.startsWith('/user/profile')) return 'account';
    return 'home';
  };

  const activeTab = getActiveTab();
  const activeIndex = navItems.findIndex(item => item.id === activeTab);

  const handleTabClick = (path) => {
    navigate(path);
  };

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-[100] px-4 pointer-events-none lg:hidden">
      <div 
        className="max-w-md mx-auto h-20 bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/20 px-4 pointer-events-auto flex items-center justify-between"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = isActive ? item.filledIcon : item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.path)}
              className="relative flex flex-col items-center justify-center w-1/4 h-full"
            >
              {/* Active Glow */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="active-bg"
                    className="absolute inset-x-1 inset-y-2 rounded-2xl"
                    style={{ background: `rgba(13, 148, 136, 0.08)` }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </AnimatePresence>

              <div className="relative z-10 flex flex-col items-center gap-1">
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.2 : 1,
                    y: isActive ? -2 : 0 
                  }}
                  className="relative"
                >
                  <Icon 
                    className={`w-6 h-6 transition-colors duration-300 ${isActive ? 'text-teal-600' : 'text-gray-400'}`}
                  />
                  {item.isCart && cartCount > 0 && (
                    <span className="absolute -top-2 -right-3 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </motion.div>
                <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${isActive ? 'text-teal-600' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </div>

              {/* Bottom Dot */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="active-dot"
                    className="absolute bottom-2 w-1 h-1 bg-teal-600 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </nav>
  );
});


BottomNav.displayName = 'BottomNav';

export default BottomNav;
