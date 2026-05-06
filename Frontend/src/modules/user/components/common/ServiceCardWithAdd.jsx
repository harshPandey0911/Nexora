import React, { memo } from 'react';
import { AiFillStar } from 'react-icons/ai';
import { themeColors, getColorWithOpacity } from '../../../../theme';

const ServiceCardWithAdd = memo(({ image, title, rating, reviews, price, onAddClick, onClick }) => {
  return (
    <div
      className="min-w-[190px] w-[190px] bg-white rounded-[24px] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 active:scale-95 group border border-black/[0.03]"
      style={{
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
      }}
      onClick={onClick}
    >
      <div className="relative h-36 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-4">
        <h3 className="text-sm font-bold text-gray-900 leading-snug mb-2 line-clamp-2 h-10">{title}</h3>
        
        {rating && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 rounded-lg">
              <AiFillStar className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-[11px] text-yellow-700 font-bold">{rating}</span>
            </div>
            {reviews && (
              <span className="text-[11px] text-gray-400 font-medium">{reviews} reviews</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Starting at</span>
            <span className="text-lg font-black text-gray-900">₹{price}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddClick?.();
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90"
            style={{
              backgroundColor: themeColors.primary,
              color: 'white',
              boxShadow: `0 4px 12px ${getColorWithOpacity('teal', 0.3)}`
            }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

ServiceCardWithAdd.displayName = 'ServiceCardWithAdd';

export default ServiceCardWithAdd;


