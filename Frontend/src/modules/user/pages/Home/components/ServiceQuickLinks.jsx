import React from 'react';
import { motion } from 'framer-motion';
import { HiArrowRight } from 'react-icons/hi';
import { 
  FiZap, 
  FiDroplet, 
  FiTool, 
  FiWind, 
  FiShield, 
  FiScissors, 
  FiCoffee, 
  FiTruck, 
  FiLayout, 
  FiHome,
  FiBox
} from 'react-icons/fi';
import Logo from '../../../../../components/common/Logo';

const ServiceQuickLinks = ({ categories = [], onCategoryClick, title = "Our Services" }) => {
  // Mapping of category slugs/titles to icons
  const getCategoryIcon = (category) => {
    const titleText = category.title?.toLowerCase() || '';
    const slug = category.slug?.toLowerCase() || '';
    
    if (titleText.includes('electric') || slug.includes('electric')) return <FiZap />;
    if (titleText.includes('plumb') || slug.includes('plumb') || titleText.includes('water')) return <FiDroplet />;
    if (titleText.includes('clean') || slug.includes('clean')) return <FiBox />; // Box as placeholder for cleaning stuff
    if (titleText.includes('repair') || titleText.includes('fix') || slug.includes('fix')) return <FiTool />;
    if (titleText.includes('ac') || titleText.includes('air') || slug.includes('ac')) return <FiWind />;
    if (titleText.includes('security') || titleText.includes('guard')) return <FiShield />;
    if (titleText.includes('salon') || titleText.includes('beauty')) return <FiScissors />;
    if (titleText.includes('cook') || titleText.includes('food')) return <FiCoffee />;
    if (titleText.includes('shift') || titleText.includes('pack')) return <FiTruck />;
    
    return <FiLayout />; // Default
  };

  if (!categories || categories.length === 0) return null;

  return (
    <section className="max-w-[1400px] mx-auto px-5 relative z-20 mt-12 mb-16">
      <div className="flex items-center justify-between mb-8 px-1">
        <h2 className="text-2xl font-[1000] text-[#0F1B73] tracking-tight">
          {title}
        </h2>
        <button
          onClick={() => onCategoryClick?.(categories[0])}
          className="text-sm font-black text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 group"
        >
          See All <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8">
        {(categories || []).slice(0, 12).map((category, index) => (
          <motion.div
            key={category.id || index}
            whileHover={{ y: -10, shadow: '0 25px 50px rgba(0,0,0,0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCategoryClick?.(category)}
            className="flex flex-col items-center bg-white rounded-[32px] p-4 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100 cursor-pointer transition-all duration-500 hover:border-blue-200 group"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-5 flex items-center justify-center bg-gray-50/50 rounded-[28px] p-4 group-hover:bg-gray-100/50 transition-colors duration-500">
              {category.icon ? (
                <img 
                  src={category.icon} 
                  alt={category.title} 
                  className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="text-4xl sm:text-5xl text-blue-600 transform group-hover:scale-110 transition-transform duration-500">
                  {getCategoryIcon(category)}
                </div>
              )}
            </div>
            <div className="flex flex-col items-center text-center gap-2 w-full">
              <span className="text-[15px] sm:text-[17px] font-[1000] text-gray-900 leading-tight">
                {category.title}
              </span>
              <span className="text-[11px] sm:text-[12px] font-bold text-gray-400 leading-tight opacity-80">
                {category.description || 'Service at your doorstep'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ServiceQuickLinks;
