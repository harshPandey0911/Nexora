import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiLocationMarker, HiOutlineSearch, HiOutlineShoppingCart, HiOutlineUser } from 'react-icons/hi';
import { gsap } from 'gsap';
import LocationSelector from '../common/LocationSelector';
import { animateLogo } from '../../../../utils/gsapAnimations';
import Logo from '../../../../components/common/Logo';
import { themeColors, getColorWithOpacity } from '../../../../theme';
import { useCart } from '../../../../context/CartContext';
import { motion } from 'framer-motion';

const Header = ({ location: address, onLocationClick }) => {
  const logoRef = useRef(null);
  const routerLocation = useLocation();
  const { cartCount } = useCart();

  useEffect(() => {
    if (logoRef.current) {
      animateLogo(logoRef.current);
    }
  }, []);

  const navLinks = [
    { name: 'Home', path: '/user' },
    { name: 'Bookings', path: '/user/my-bookings' },
    { name: 'Cart', path: '/user/cart' },
    { name: 'Account', path: '/user/account' },
  ];

  const isActive = (path) => {
    if (path === '/user') return routerLocation.pathname === '/user';
    return routerLocation.pathname.startsWith(path);
  };

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 transition-all duration-300">
      {/* Top Blue Bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: themeColors.primary }}></div>

      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Logo & Brand Name */}
          <Link to="/user" className="flex items-center gap-3 shrink-0 group">
            <div ref={logoRef} className="relative">
              <Logo className="h-10 w-10 sm:h-12 sm:w-12" />
              <div className="absolute inset-0 bg-brand/10 rounded-full scale-0 group-hover:scale-110 transition-transform duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter leading-none" style={{ color: themeColors.primary }}>
                NEXORA
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mt-0.5">
                Everything you need, one place
              </span>
            </div>
          </Link>

          {/* Center: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path}
                className="relative py-2 text-[15px] font-bold transition-colors duration-200"
                style={{ color: isActive(link.path) ? themeColors.primary : '#4B5563' }}
              >
                {link.name}
                {isActive(link.path) && (
                  <motion.div 
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: themeColors.primary }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right: Actions (Search, Cart, Account, Location) */}
          <div className="flex items-center gap-2 sm:gap-5">
            {/* Location (Subtle integration) */}
            <div 
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-black/[0.03]"
              onClick={onLocationClick}
            >
              <HiLocationMarker className="w-4 h-4 text-gray-400" />
              <span className="text-[11px] font-bold text-gray-600 truncate max-w-[100px]">
                {address && address !== '...' ? address.split(',')[0] : 'Location'}
              </span>
            </div>

            {/* Icons Group */}
            <div className="flex items-center gap-1 sm:gap-3">
              <button className="p-2.5 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
                <HiOutlineSearch className="w-6 h-6" />
              </button>
              
              <Link to="/user/cart" className="relative p-2.5 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
                <HiOutlineShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span 
                    className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-black text-white rounded-full shadow-sm ring-2 ring-white"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Login / My Account Button */}
            <Link to="/user/account">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2.5 rounded-full text-sm font-bold text-white shadow-lg transition-all duration-300"
                style={{ 
                  backgroundColor: themeColors.primary,
                  boxShadow: `0 4px 14px ${getColorWithOpacity('teal', 0.25)}`
                }}
              >
                My Account
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

