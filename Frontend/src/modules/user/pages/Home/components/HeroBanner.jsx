import React from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiTruck, FiBox } from 'react-icons/fi';

const HeroBanner = ({ banners = [], onSearchClick, heroData }) => {
  const title = heroData?.title || 'Everything You Need, Delivered to You.';
  const subtitle = heroData?.subtitle || 'One super app for all your daily needs. Fast, reliable & secure delivery at your doorstep.';
  const secondaryBtnText = heroData?.secondaryBtnText || 'Explore Services';
  const heroImage = heroData?.imageUrl || null;

  return (
    <div className="relative w-full overflow-hidden bg-transparent">
      {/* Decorative Elements - Subtle */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-gray-50/50 rounded-full blur-3xl -z-0" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-gray-50/50 rounded-full blur-3xl -z-0" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 pt-6 lg:pt-10 pb-4 lg:pb-6">
        <div className={`grid grid-cols-1 ${heroImage ? 'lg:grid-cols-2' : ''} gap-6 lg:gap-12 items-center`}>
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`flex flex-col gap-2 lg:gap-6 text-center ${heroImage ? 'lg:text-left items-center lg:items-start' : 'items-center'}`}
          >
            <div className="space-y-1 lg:space-y-4">
              <h1 
                className="text-2xl lg:text-7xl font-[1000] text-gray-900 leading-[1.1] tracking-tight" 
                dangerouslySetInnerHTML={{ __html: title.replace(/,\s*(Delivered to You\.?)/, ', <span class="text-[#0F1B73]">$1</span>') }}
              />
              <p className="text-[11px] lg:text-lg text-gray-500 font-medium max-w-md mx-auto lg:mx-0 leading-relaxed">
                {subtitle}
              </p>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-1 lg:mt-4 w-full">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSearchClick}
                className="w-fit sm:w-auto px-8 py-2.5 lg:px-10 lg:py-4 text-white border-none rounded-[22px] font-black shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 text-sm lg:text-base"
                style={{ background: 'linear-gradient(90deg,rgba(15, 27, 115, 1) 0%, rgba(97, 91, 212, 1) 90%)' }}
              >
                {secondaryBtnText}
              </motion.button>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 mt-2 lg:mt-8">
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <div className="w-5 h-5 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                  <FiCheckCircle className="w-3 h-3" />
                </div>
                Secure Payments
              </div>
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <div className="w-5 h-5 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                  <FiClock className="w-3 h-3" />
                </div>
                24/7 Support
              </div>
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <div className="w-5 h-5 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                  <FiTruck className="w-3 h-3" />
                </div>
                Fast Delivery
              </div>
            </div>
          </motion.div>

          {/* Right Content - Dynamic Hero Image (only shown if admin uploaded one) */}
          {heroImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-center lg:justify-end relative order-first lg:order-last mb-2 lg:mb-0"
            >
              <div className="relative w-full max-w-[220px] lg:max-w-[600px]">
                <img 
                  src={heroImage} 
                  alt="Hero Illustration" 
                  className="w-full h-auto"
                  style={{
                    maskImage: 'radial-gradient(circle at center, black 65%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 100%)',
                    filter: 'drop-shadow(0 20px 20px rgba(0,0,0,0.08))'
                  }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Spacing */}
      <div className="h-2 w-full" />
    </div>
  );
};

export default HeroBanner;


