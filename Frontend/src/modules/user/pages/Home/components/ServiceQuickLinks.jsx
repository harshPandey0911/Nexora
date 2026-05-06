import React from 'react';
import { motion } from 'framer-motion';
import { HiArrowRight } from 'react-icons/hi';
import Logo from '../../../../../components/common/Logo';

const ServiceQuickLinks = ({ categories = [], onCategoryClick }) => {
  const cardColors = [
    { bg: 'bg-[#E8F5E9]', accent: 'bg-[#2E7D32]', text: 'text-[#1B5E20]' }, // Greenish
    { bg: 'bg-[#E3F2FD]', accent: 'bg-[#1565C0]', text: 'text-[#0D47A1]' }, // Bluish
    { bg: 'bg-[#FFF3E0]', accent: 'bg-[#EF6C00]', text: 'text-[#E65100]' }, // Orangish
    { bg: 'bg-[#F3E5F5]', accent: 'bg-[#7B1FA2]', text: 'text-[#4A148C]' }, // Purplish
  ];

  if (!categories || categories.length === 0) return null;

  return (
    <div className="w-full px-4 lg:px-8 -mt-16 lg:-mt-24 relative z-20">
      <div className="bg-white rounded-[32px] lg:rounded-[48px] p-6 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {categories.slice(0, 4).map((category, index) => {
            const colors = cardColors[index % cardColors.length];
            return (
              <motion.div
                key={category._id || index}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                onClick={() => onCategoryClick?.(category)}
                className={`relative overflow-hidden rounded-[24px] lg:rounded-[32px] p-6 flex items-center gap-4 cursor-pointer shadow-sm border border-black/[0.02] ${colors.bg} min-h-[140px] lg:min-h-[160px]`}
              >
                {/* Logo in top left */}
                <div className="absolute top-4 left-4 opacity-50 scale-75 origin-top-left">
                  <Logo className="h-4 w-auto" />
                </div>

                {/* Icon/Image Section */}
                <div className="w-[35%] lg:w-[40%] shrink-0 flex items-center justify-center">
                  <img 
                    src={category.icon || category.image} 
                    alt={category.title}
                    className="w-full h-auto object-contain drop-shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = "https://cdn-icons-png.flaticon.com/512/1048/1048329.png";
                    }}
                  />
                </div>

                {/* Text Section */}
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className={`text-xl lg:text-2xl font-black ${colors.text} leading-none mb-1.5`}>
                    {category.title}
                  </h3>
                  <p className="text-[10px] lg:text-[11px] font-bold text-gray-400 leading-tight uppercase tracking-wider">
                    {category.description || 'Premium Services'}
                  </p>
                </div>

                {/* Arrow Button */}
                <div className={`absolute bottom-5 right-5 w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 ${colors.accent}`}>
                  <HiArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ServiceQuickLinks;
