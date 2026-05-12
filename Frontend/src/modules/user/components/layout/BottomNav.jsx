import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiCalendar, FiShoppingCart, FiUser } from 'react-icons/fi';
import { HiHome, HiCalendar, HiShoppingCart, HiUser } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../../../context/CartContext';

const BottomNav = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount } = useCart();

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

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center lg:hidden px-4">
      <div 
        className="flex items-center justify-between bg-white/90 backdrop-blur-xl px-2 py-2 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100/50 w-full max-w-sm"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = isActive ? item.filledIcon : item.icon;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="relative flex items-center justify-center transition-all duration-300"
            >
              <motion.div
                layout
                initial={false}
                animate={{
                  width: isActive ? 'auto' : '48px',
                  backgroundColor: isActive ? '#0D463C' : 'transparent',
                }}
                className={`flex items-center gap-2 px-3 h-11 rounded-full overflow-hidden`}
              >
                <div className="relative">
                  <Icon 
                    className={`w-5 h-5 transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`} 
                  />
                  {item.isCart && cartCount > 0 && !isActive && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </div>

                <AnimatePresence mode="popLayout">
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-[12px] font-black text-white whitespace-nowrap pr-1"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {item.isCart && cartCount > 0 && isActive && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                >
                  {cartCount > 9 ? '9+' : cartCount}
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
