import React from 'react';
import { motion } from 'framer-motion';
import { HiOutlineSearch } from 'react-icons/hi';
import { themeColors, getColorWithOpacity } from '../../../../../theme';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const HeroBanner = ({ banners = [], onSearchClick }) => {
  return (
    <div className="relative w-full overflow-hidden bg-white">
      {/* Background Banner Slider */}
      <div className="absolute inset-0 z-0">
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          effect="fade"
          spaceBetween={0}
          slidesPerView={1}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          className="w-full h-full"
        >
          {banners.length > 0 ? (
            banners.map((banner) => (
              <SwiperSlide key={banner._id}>
                <div className="relative w-full h-[500px] lg:h-[600px] bg-[#F0F7FF]">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title || 'Promo'}
                    className="w-full h-full object-contain object-top transition-transform duration-700"
                  />
                  {/* Overlay Gradient for readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-transparent to-transparent lg:from-white/40 lg:via-transparent lg:to-transparent" />
                </div>
              </SwiperSlide>
            ))
          ) : (
            <SwiperSlide>
              <div className="w-full h-[500px] lg:h-[600px] bg-blue-50" />
            </SwiperSlide>
          )}
        </Swiper>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 lg:px-12 pt-6 pb-16 lg:pt-12 lg:pb-28 pointer-events-none">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col gap-6 pointer-events-auto"
          >
            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight drop-shadow-sm">
                Everything You Need,<br />
                <span style={{ color: themeColors.primary }}>One Place</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 font-bold max-w-md leading-relaxed drop-shadow-sm">
                Grocery, Cleaning & Home Services at your doorstep
              </p>
            </div>

            {/* Search Bar Overlay */}
            <div className="relative max-w-xl group mt-4">
              <div 
                className="flex items-center bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 focus-within:ring-4 focus-within:ring-blue-100 cursor-pointer"
                onClick={onSearchClick}
              >
                <div className="pl-5 pr-3 text-gray-400">
                  <HiOutlineSearch className="w-6 h-6" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search for products or services..." 
                  className="flex-1 py-4 text-gray-700 bg-transparent outline-none text-base placeholder:text-gray-400 font-bold"
                  readOnly
                />
                <button 
                  className="px-8 py-4 text-white font-bold transition-all hover:brightness-110 active:scale-95"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  Search
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mt-2">
              <button 
                className="flex items-center gap-2.5 px-10 py-4 rounded-xl text-white font-bold shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 active:scale-95 pointer-events-auto"
                style={{ backgroundColor: themeColors.primary }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Book Service
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Scroll indicator or spacing if needed */}
      <div className="h-4 w-full bg-gradient-to-t from-gray-50 to-transparent" />
    </div>
  );
};

export default HeroBanner;

