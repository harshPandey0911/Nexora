import React from 'react';
import ServiceCardWithAdd from '../../../components/common/ServiceCardWithAdd';
import { themeColors, getColorWithOpacity } from '../../../../../theme';
import { motion } from 'framer-motion';

const HomeRepairSection = ({ services, onSeeAllClick, onServiceClick, onAddClick }) => {
  // Default home repair services if none provided
  if (!services || services.length === 0) {
    return null;
  }

  const serviceList = services;

  return (
    <div className="mb-10">
      <div className="px-5 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-1.5 h-7 rounded-full shadow-sm" 
            style={{ 
              background: `linear-gradient(to bottom, ${themeColors.primary}, ${themeColors.brand.yellow})` 
            }}
          ></div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Home repair & installation
          </h2>
        </div>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={onSeeAllClick}
          className="text-sm font-bold px-4 py-2 rounded-2xl transition-all shadow-sm border border-black/[0.03]"
          style={{ 
            color: themeColors.primary,
            backgroundColor: getColorWithOpacity('teal', 0.08)
          }}
        >
          See all
        </motion.button>
      </div>

      <div className="flex gap-5 overflow-x-auto px-5 pb-4 scrollbar-hide">
        {serviceList.map((service, index) => (
          <motion.div
            key={service.id || index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ServiceCardWithAdd
              title={service.title}
              rating={service.rating}
              reviews={service.reviews}
              price={service.price}
              image={service.image}
              onClick={() => onServiceClick?.(service)}
              onAddClick={() => onAddClick?.(service)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HomeRepairSection;


