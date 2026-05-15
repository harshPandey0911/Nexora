import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium LogoLoader Component
 * Standardized for the Nexora Professional Design System
 */
const LogoLoader = ({ fullScreen = false, overlay = false, inline = false, size = "w-24 h-24" }) => {
  const containerClasses = fullScreen
    ? overlay
      ? "fixed inset-0 flex items-center justify-center bg-white z-[9999]"
      : "fixed inset-0 flex items-center justify-center bg-white/90 backdrop-blur-md z-[100]"
    : inline
      ? "flex items-center justify-center"
      : "flex items-center justify-center w-full min-h-[65vh]";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${containerClasses} transition-all duration-500`}
    >
      <div className="relative flex flex-col items-center">
        {/* Animated Background Glow */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-32 h-32 bg-blue-100 rounded-full blur-3xl -z-10"
        />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative"
        >
          {/* Multi-layered ripples */}
          {[1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-blue-200"
              animate={{
                scale: [1, 1.8],
                opacity: [0.5, 0]
              }}
              transition={{
                duration: 2,
                delay: i * 0.8,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          ))}

          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`relative ${size} flex items-center justify-center bg-white rounded-3xl shadow-2xl shadow-blue-100 p-4 border border-blue-50`}
          >
            <img
              src="/nexora-go-logo.png"
              alt="Nexora Go"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.src = "https://img.icons8.com/color/96/n.png";
              }}
            />
          </motion.div>
        </motion.div>

        {/* Loading Text */}
        {!inline && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
              Initializing Ops
            </span>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((dot) => (
                <motion.div
                  key={dot}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: dot * 0.2 }}
                  className="w-1.5 h-1.5 bg-blue-600 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default LogoLoader;
