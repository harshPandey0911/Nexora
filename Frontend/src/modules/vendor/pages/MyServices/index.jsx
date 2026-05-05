import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiStar, FiCheckCircle, FiChevronRight, FiInfo, FiActivity, FiPlus } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import vendorService from '../../services/vendorService';
import LogoLoader from '../../../../components/common/LogoLoader';

const MyServices = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const bgStyle = themeColors.backgroundGradient;

    if (html) html.style.background = bgStyle;
    if (body) body.style.background = bgStyle;
    if (root) root.style.background = bgStyle;

    return () => {
      if (html) html.style.background = '';
      if (body) body.style.background = '';
      if (root) root.style.background = '';
    };
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const res = await vendorService.getMyServices();
        if (res.success) {
          setServices(res.data || []);
        }
      } catch (error) {
        console.error('Error loading services:', error);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  return (
    <div className="min-h-screen pb-24" style={{ background: themeColors.backgroundGradient }}>
      <Header title="My Services" showBack={true} />

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Stats Header */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-5 border border-white/40 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Expertise</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-gray-900">{services.length}</span>
              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Categories</span>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-5 border border-white/40 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Overall Rating</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-gray-900">
                {services.length > 0 
                  ? (services.reduce((acc, s) => acc + s.stats.rating, 0) / services.length).toFixed(1) 
                  : '0.0'}
              </span>
              <FiStar className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Authorized Portfolios</h2>
          </div>
          <button 
            onClick={() => navigate('/vendor/add-custom-content')}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-100 active:scale-95 transition-all"
          >
            <FiPlus className="w-3 h-3" />
            Add New
          </button>
        </div>

        {/* Services List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: `${themeColors.button} transparent ${themeColors.button} ${themeColors.button}` }}></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Portfolio...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-12 text-center border border-white/40 shadow-xl">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300">
              <FiBriefcase className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">No Services Yet</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Contact admin to get assigned categories</p>
          </div>
        ) : (
          <div className="space-y-5">
            {services.map((service, index) => (
              <motion.div
                key={service.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white/80 backdrop-blur-lg rounded-[2.5rem] p-1 border border-white/40 shadow-lg hover:shadow-2xl transition-all duration-500"
              >
                <div className="flex p-4 gap-4">
                  {/* Service Image/Icon */}
                  <div className="relative w-24 h-24 rounded-[2rem] overflow-hidden shrink-0 shadow-inner">
                    <img 
                      src={service.imageUrl || service.iconUrl || 'https://via.placeholder.com/150'} 
                      alt={service.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-0 right-0 text-center">
                      <span className="text-[8px] font-black uppercase tracking-tighter text-white bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">
                        {service.status}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-gray-900 truncate tracking-tight">{service.title}</h3>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg">
                          <span className="text-[10px] font-black text-amber-600">{service.stats.rating}</span>
                          <FiStar className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 leading-relaxed font-medium">
                        {service.description || `High-quality ${service.title} services for your professional needs.`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Jobs</span>
                          <span className="text-xs font-black text-gray-800">{service.stats.totalJobs}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-gray-100 mt-1" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Done</span>
                          <span className="text-xs font-black text-teal-600">{service.stats.completedJobs}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => navigate(`/vendor/jobs?category=${service.title}`)}
                        className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-teal-500 hover:text-white transition-all duration-300 shadow-sm active:scale-90"
                      >
                        <FiChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-10 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <FiInfo className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-blue-900">Need more categories?</h4>
              <p className="text-[10px] text-blue-700 mt-1 font-medium leading-relaxed">
                Your service portfolio is managed by the administrator. To add new skills or service categories, please raise a support ticket.
              </p>
              <button 
                onClick={() => navigate('/vendor/support')}
                className="mt-3 text-[10px] font-black uppercase tracking-widest text-blue-600 underline"
              >
                Open Support Ticket
              </button>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default MyServices;
