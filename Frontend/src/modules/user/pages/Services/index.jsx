import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiGrid, 
  FiArrowRight, 
  FiArrowLeft, 
  FiTruck, 
  FiShoppingBag, 
  FiHome, 
  FiHeart, 
  FiPlusSquare, 
  FiShield, 
  FiHeadphones, 
  FiClock, 
  FiAward, 
  FiRotateCcw, 
  FiGift,
  FiMapPin
} from 'react-icons/fi';
import { publicCatalogService } from '../../../../services/catalogService';
import Header from '../../components/layout/Header';
import CategoryModal from '../Home/components/CategoryModal';
import { useCart } from '../../../../context/CartContext';
import { useCity } from '../../../../context/CityContext';

// Assets
import serviceBoyImg from '../../../../assets/service.png';
import mobileMockupImg from '../../../../assets/mobile.png';

const ServicesPage = () => {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { currentCity } = useCity();
  
  const [categories, setCategories] = useState([]);
  const [homeContent, setHomeContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const toAssetUrl = (url) => {
    if (!url) return '';
    const clean = url.replace('/api/upload', '/upload');
    if (clean.startsWith('http')) return clean;
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
    return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const cityId = currentCity?._id || currentCity?.id;
        
        // Fetch both categories and home data for the header
        const [catRes, homeRes] = await Promise.all([
          publicCatalogService.getCategories(cityId),
          publicCatalogService.getHomeData(cityId)
        ]);

        if (catRes.success) {
          setCategories(catRes.categories || []);
        }
        if (homeRes.success) {
          setHomeContent(homeRes.homeContent);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentCity]);

  const tabs = [
    { id: 'All', label: 'All Services', icon: <FiGrid /> },
    { id: 'Delivery', label: 'Delivery Services', icon: <FiTruck /> },
    { id: 'Needs', label: 'Daily Needs', icon: <FiShoppingBag /> },
    { id: 'Home', label: 'Home Services', icon: <FiHome /> },
    { id: 'Health', label: 'Health & Care', icon: <FiPlusSquare /> },
    { id: 'More', label: 'More Services', icon: <FiGrid /> },
  ];

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cat.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'All') return matchesSearch;
    // Simple mapping for demonstration - in production this would be based on category types from backend
    if (activeTab === 'Delivery') return matchesSearch && (cat.title.toLowerCase().includes('delivery') || cat.title.toLowerCase().includes('grocery'));
    if (activeTab === 'Needs') return matchesSearch && (cat.title.toLowerCase().includes('grocery') || cat.title.toLowerCase().includes('medicine'));
    if (activeTab === 'Home') return matchesSearch && cat.title.toLowerCase().includes('home');
    if (activeTab === 'Health') return matchesSearch && cat.title.toLowerCase().includes('health');
    
    return matchesSearch;
  });

  const handleCategoryClick = (category) => {
    setSelectedCategory({
      ...category,
      icon: toAssetUrl(category.icon)
    });
    setIsCategoryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f0f9ff]">
      <Header
        location={localStorage.getItem('currentAddress') || ''}
        onLocationClick={() => {}} // Can be implemented if needed
        navLinks={homeContent?.navLinks}
        siteIdentity={homeContent?.siteIdentity}
        homeContent={homeContent}
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#f0f9ff] pt-4 pb-6">
        {/* Abstract Background Elements - Adjusted for new color */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-[120px] -z-0 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/20 rounded-full blur-[100px] -z-0 -translate-x-1/4 translate-y-1/4" />

        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            
            {/* Left Content */}
            <div className="flex-1 max-w-2xl text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-5xl lg:text-7xl font-[1000] text-gray-900 leading-tight tracking-tight mb-4">
                  All <span className="text-[#00246b]">Services</span>
                </h1>
                <p className="text-gray-500 font-medium text-lg lg:text-xl leading-relaxed max-w-xl mb-6 mx-auto lg:mx-0">
                  One app for all your needs. Explore wide range of services designed to make your life easier.
                </p>
              </motion.div>
            </div>

            {/* Right Graphics */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative hidden lg:flex items-center"
            >
              <div className="relative z-10 -mt-6 lg:-mt-8">
                <img 
                  src={serviceBoyImg} 
                  alt="Service Character" 
                  className="h-[320px] w-auto drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 -mt-16 lg:-mt-20 relative z-20 pb-16">
        <div className="bg-white rounded-[24px] p-4 lg:p-6 shadow-2xl shadow-blue-900/5 border border-white">
          {/* Category Tabs */}
          <div className="bg-slate-50/50 rounded-[16px] p-1.5 mb-4 flex overflow-x-auto no-scrollbar gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-2 rounded-[12px] whitespace-nowrap transition-all duration-300 font-black text-sm ${
                  activeTab === tab.id 
                  ? 'bg-[#00246b] text-white shadow-lg shadow-blue-900/30' 
                  : 'bg-transparent text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Services Grid */}
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-slate-50 rounded-[16px] p-8 h-48 animate-pulse" />
                ))}
              </div>
            ) : filteredCategories.length > 0 ? (
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6"
              >
                {filteredCategories.map((category) => (
                  <motion.div
                    key={category.id || category._id}
                    whileHover={{ y: -5, shadow: "0 20px 40px -12px rgba(0, 36, 107, 0.12)" }}
                    onClick={() => handleCategoryClick(category)}
                    className="group bg-white p-4 rounded-[20px] border border-gray-100 hover:border-blue-100 cursor-pointer transition-all duration-500 flex flex-col shadow-sm hover:shadow-xl"
                  >
                    {/* Top Part: Image & Text */}
                    <div className="flex gap-4 mb-4">
                      {/* Left: Image */}
                      <div className="shrink-0">
                        <div className="w-20 h-20 bg-slate-50 rounded-[16px] p-2 flex items-center justify-center group-hover:bg-blue-50 transition-colors duration-500">
                          <img 
                            src={toAssetUrl(category.icon)} 
                            alt={category.title} 
                            className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      </div>
                      
                      {/* Right: Title & Description */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-[1000] text-[#1E293B] leading-tight mb-1 group-hover:text-[#00246b] transition-colors">
                          {category.title}
                        </h3>
                        <p className="text-[#64748B] text-[11px] font-medium leading-relaxed line-clamp-3">
                          {category.description || 'Professional services delivered right at your doorstep with fast & secure delivery.'}
                        </p>
                      </div>
                    </div>

                    {/* Middle Part: Trust Points */}
                    <div className="flex items-center gap-4 mb-4 mt-auto">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[#475569]">
                        <FiTruck className="text-[#00246b] text-sm" />
                        <span>Fast Delivery</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[#475569]">
                        <FiMapPin className="text-[#00246b] text-sm" />
                        <span>Live Tracking</span>
                      </div>
                    </div>
                    
                    {/* Bottom Part: Explore Button */}
                    <div className="flex items-center justify-start">
                      <div className="flex items-center justify-between w-32 px-4 py-2 border border-blue-100 rounded-lg text-[#00246b] text-[11px] font-black group-hover:bg-[#00246b] group-hover:text-white group-hover:border-[#00246b] transition-all duration-300">
                        <span>Explore</span>
                        <FiArrowRight className="text-sm" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <FiSearch className="text-4xl text-blue-300" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">No services found</h2>
                <p className="text-gray-500 mt-2 font-medium">We couldn't find any services matching your selection.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trust Badges Section */}
        <div className="mt-12 bg-[#003a8c] rounded-[16px] p-5 lg:p-6 shadow-2xl shadow-blue-900/20 overflow-hidden relative">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { icon: <FiShield />, title: "100% SECURE", sub: "Payments" },
              { icon: <FiHeadphones />, title: "24/7 SUPPORT", sub: "Happy customers" },
              { icon: <FiTruck />, title: "FAST DELIVERY", sub: "On-time always" },
              { icon: <FiAward />, title: "VERIFIED", sub: "Trusted Experts" },
              { icon: <FiRotateCcw />, title: "EASY RETURNS", sub: "Hassle-free" },
              { icon: <FiGift />, title: "EXCLUSIVE", sub: "Offers for you" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white text-xl mb-2 backdrop-blur-sm">
                  {item.icon}
                </div>
                <h4 className="text-white text-[10px] font-black tracking-wider">{item.title}</h4>
                <p className="text-white/60 text-[8px] font-medium">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        location={localStorage.getItem('currentAddress') || ''}
        cartCount={cartCount}
        currentCity={currentCity}
      />
    </div>
  );
};

const TrustBadge = ({ icon, label, sub }) => (
  <div className="flex flex-col items-center text-center">
    <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white text-2xl mb-4 border border-white/10">
      {icon}
    </div>
    <div className="text-[12px] font-black text-white leading-tight uppercase tracking-widest">{label}</div>
    <div className="text-[10px] font-medium text-blue-100 mt-1 opacity-70">{sub}</div>
  </div>
);

export default ServicesPage;
