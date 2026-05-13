import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiEdit2, FiMapPin, FiBriefcase, FiStar, FiSettings, FiChevronRight, FiLogOut, FiPlus, FiUsers } from 'react-icons/fi';
import { FaWallet } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../../theme';
import { vendorAuthService } from '../../../../services/authService';
import LogoLoader from '../../../../components/common/LogoLoader';

const Profile = () => {
  const navigate = useNavigate();

  // Helper function to convert hex to rgba
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const menuItems = [
    { id: 2, label: 'Wallet', icon: FaWallet, path: '/vendor/wallet' },
    { id: 5, label: 'My Ratings', icon: FiStar, path: '/vendor/my-ratings' },
    { id: 10, label: 'My Services', icon: FiBriefcase, path: '/vendor/my-services' },
    { id: 11, label: 'Add Custom Offering', icon: FiPlus, path: '/vendor/add-custom-content', highlight: true },
    { id: 7, label: 'Manage Address', icon: FiMapPin, path: '/vendor/address-management' },
    { id: 8, label: 'Settings', icon: FiSettings, path: '/vendor/settings' },
    { id: 9, label: 'About Nexora', icon: null, customIcon: 'S', path: '/vendor/about-cleaning-expert' },
  ];

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
    const fetchProfile = async () => {
      // Try to load from local storage first for immediate display
      const storedVendorData = JSON.parse(localStorage.getItem('vendorData') || '{}');
      if (storedVendorData && Object.keys(storedVendorData).length > 0) {
        setProfile({
          name: storedVendorData.name || 'Vendor Name',
          businessName: storedVendorData.businessName || null,
          phone: storedVendorData.phone || '',
          email: storedVendorData.email || '',
          address: storedVendorData.address ?
            (typeof storedVendorData.address === 'string' ? storedVendorData.address :
              `${storedVendorData.address.addressLine1 || ''} ${storedVendorData.address.addressLine2 || ''} ${storedVendorData.address.city || ''} ${storedVendorData.address.state || ''} ${storedVendorData.address.pincode || ''}`.trim() || 'Not set')
            : 'Not set',
          rating: storedVendorData.rating || 0,
          totalJobs: storedVendorData.totalJobs || 0,
          completionRate: storedVendorData.completionRate || 0,
          serviceCategory: storedVendorData.service || '',
          skills: [],
          photo: storedVendorData.profilePhoto || null,
          approvalStatus: storedVendorData.approvalStatus,
          isPhoneVerified: storedVendorData.isPhoneVerified || false,
          isEmailVerified: storedVendorData.isEmailVerified || false
        });
        setIsLoading(false); // Show content immediately
      }

      setError(null);
      try {
        const response = await vendorAuthService.getProfile();
        if (response.success) {
          const vendorData = response.vendor;
          // Format address
          const addressString = vendorData.address
            ? (typeof vendorData.address === 'string' ? vendorData.address :
              `${vendorData.address.addressLine1 || ''} ${vendorData.address.addressLine2 || ''} ${vendorData.address.city || ''} ${vendorData.address.state || ''} ${vendorData.address.pincode || ''}`.trim() || 'Not set')
            : 'Not set';

          setProfile({
            name: vendorData.name || 'Vendor Name',
            businessName: vendorData.businessName || null,
            phone: vendorData.phone || '',
            email: vendorData.email || '',
            address: addressString,
            rating: vendorData.rating || 0,
            totalJobs: vendorData.totalJobs || 0,
            completionRate: vendorData.completionRate || 0,
            serviceCategory: vendorData.service || '',
            skills: [],
            photo: vendorData.profilePhoto || null,
            approvalStatus: vendorData.approvalStatus,
            isPhoneVerified: vendorData.isPhoneVerified || false,
            isEmailVerified: vendorData.isEmailVerified || false
          });
          localStorage.setItem('vendorData', JSON.stringify(vendorData));
        } else {
          // If API fails but we have local data, stick with it?
          if (!storedVendorData || Object.keys(storedVendorData).length === 0) {
            setError(response.message || 'Failed to fetch profile');
            toast.error(response.message || 'Failed to fetch profile');
          }
        }
      } catch (err) {
        console.error('Error fetching vendor profile:', err);
        if (!storedVendorData || Object.keys(storedVendorData).length === 0) {
          setError(err.response?.data?.message || 'Failed to fetch profile');
          toast.error(err.response?.data?.message || 'Failed to fetch profile');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    window.addEventListener('vendorDataUpdated', fetchProfile);
    window.addEventListener('vendorProfileUpdated', fetchProfile);

    return () => {
      window.removeEventListener('vendorDataUpdated', fetchProfile);
      window.removeEventListener('vendorProfileUpdated', fetchProfile);
    };
  }, []);

  if (isLoading) {
    return <LogoLoader />;
  }

  if (error && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: themeColors.backgroundGradient }}>
        <div className="text-center p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error loading profile</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:opacity-90"
            style={{ backgroundColor: themeColors.button }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen pb-28 relative" style={{ background: '#FFFFFF' }}>
      {/* Premium Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 0% 0%, rgba(13, 148, 136, 0.1) 0%, transparent 70%),
              radial-gradient(at 100% 100%, rgba(13, 148, 136, 0.05) 0%, transparent 75%),
              #F8FAFC
            `
          }}
        />
      </div>

      <header className="px-6 py-6 flex items-center justify-between relative z-10">
        <h1 className="text-2xl font-[1000] text-gray-900 tracking-tight">Identity Hub</h1>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/vendor/settings')}
          className="w-12 h-12 rounded-[20px] bg-white shadow-sm flex items-center justify-center border border-black/[0.03] group"
        >
          <FiSettings className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" />
        </motion.button>
      </header>

      <main className="px-5 relative z-10 max-w-lg mx-auto">
        {/* Profile Master Card (Teal Gradient) */}
        <div 
          className="rounded-[40px] p-8 shadow-[0_20px_50px_rgba(13,148,136,0.15)] mb-10 relative overflow-hidden group"
          style={{ background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)' }}
        >
          {/* Decorative Elements */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Master Avatar */}
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-[36px] bg-white/20 border-4 border-white/30 overflow-hidden backdrop-blur-xl flex items-center justify-center shadow-2xl">
                {profile.photo ? (
                  <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-teal-800/50 flex items-center justify-center">
                    <FiUser className="w-12 h-12 text-teal-200/50" />
                  </div>
                )}
              </div>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/vendor/profile/details')}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-teal-50 text-teal-600"
              >
                <FiEdit2 className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="w-full">
              <h2 className="text-2xl font-[1000] text-white truncate mb-1 tracking-tight">{profile.name}</h2>
              <p className="text-[10px] font-black text-teal-100/60 uppercase tracking-[0.25em] mb-6">
                {profile.businessName || 'Verified Elite Partner'}
              </p>
              
              <div className="flex items-center justify-center gap-4">
                <div className="px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 flex items-center gap-2">
                  <FiStar className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span className="text-[11px] font-[1000] text-white tracking-wide">{profile.rating.toFixed(1)} Rating</span>
                </div>
                <div className="px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 flex items-center gap-2">
                  <FiBriefcase className="w-3.5 h-3.5 text-teal-200" />
                  <span className="text-[11px] font-[1000] text-white tracking-wide">{profile.totalJobs} Deployments</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Action Grid (High Contrast) */}
        <div className="grid grid-cols-3 gap-5 mb-10">
          {[
            { label: 'Financials', icon: FaWallet, path: '/vendor/wallet', color: 'teal' },
            { label: 'Operations', icon: FiBriefcase, path: '/vendor/jobs', color: 'indigo' },
            { label: 'Team', icon: FiUsers, path: '/vendor/workers', color: 'orange' },
          ].map((item, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-black/[0.02] flex flex-col items-center text-center group hover:bg-black transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-[20px] bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-white/10 transition-all">
                <item.icon className="w-5 h-5 text-gray-900 group-hover:text-white" />
              </div>
              <span className="text-[9px] font-[1000] text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">{item.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Management Ecosystem (Teal Accent) */}
        <div className="space-y-4 mb-12">
          <div className="flex items-center justify-between px-2 mb-6">
            <h3 className="text-[10px] font-[1000] text-gray-400 uppercase tracking-[0.25em]">Partner Ecosystem</h3>
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          </div>
          
          {menuItems.map((item) => {
            const IconComponent = item.icon || FiSettings;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between p-5 rounded-[32px] border transition-all duration-500 ${
                  item.highlight 
                  ? 'bg-black border-black shadow-2xl shadow-black/10 text-white' 
                  : 'bg-white/70 backdrop-blur-md border-white/60 text-gray-900 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:border-teal-500/20'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                    item.highlight ? 'bg-white/10 border-white/10' : 'bg-gray-50 border-black/[0.02]'
                  }`}>
                    {item.customIcon ? (
                      <span className={`text-base font-[1000] ${item.highlight ? 'text-white' : 'text-gray-900'}`}>{item.customIcon}</span>
                    ) : (
                      <IconComponent className={`w-6 h-6 ${item.highlight ? 'text-white' : 'text-gray-900'}`} />
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-[13px] font-[1000] tracking-tight block">{item.label}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest opacity-40 ${item.highlight ? 'text-white/60' : 'text-gray-400'}`}>
                      Access Module
                    </span>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  item.highlight ? 'bg-white/10' : 'bg-gray-50'
                }`}>
                  <FiChevronRight className={`w-5 h-5 ${item.highlight ? 'text-white' : 'text-gray-300'}`} />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Termination Controller */}
        <div className="mb-12">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              try {
                await vendorAuthService.logout();
                toast.success('Logged out');
                navigate('/vendor/login');
              } catch (e) {
                localStorage.clear();
                navigate('/vendor/login');
              }
            }}
            className="w-full py-6 rounded-[32px] bg-rose-50 border border-rose-100 text-rose-500 text-[11px] font-[1000] uppercase tracking-[0.25em] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl shadow-rose-900/5 group"
          >
            <FiLogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Terminate Session
          </motion.button>
          
          <div className="mt-8 flex flex-col items-center gap-2 opacity-30">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Powered by Nexora Operational Intelligence</p>
            <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Build v2.4.0-Premium</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;


