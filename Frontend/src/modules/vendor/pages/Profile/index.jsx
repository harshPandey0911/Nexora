import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiEdit2, FiMapPin, FiBriefcase, FiStar, FiSettings, FiChevronRight, FiLogOut, FiPlus, FiUsers, FiAlertTriangle } from 'react-icons/fi';
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center p-12 max-w-sm mx-auto">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FiAlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-widest">Protocol Sync Failure</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-10 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-5 bg-blue-600 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
          >
            Restart Uplink
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header - White Style */}
      <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between text-gray-900 border border-gray-100 gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
            Identity Hub
          </h2>
          <p className="text-gray-500 font-medium mt-2">
            Manage your personal credentials and professional profile
          </p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/vendor/settings')}
          className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center group hover:bg-white transition-all shadow-inner"
        >
          <FiSettings className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </motion.button>
      </div>

      {/* Profile Master Card (Lighter Blue Gradient) */}
      <div 
        className="rounded-[40px] p-10 shadow-xl shadow-blue-500/10 mb-8 relative overflow-hidden group"
        style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
      >
        {/* Decorative Elements */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Master Avatar */}
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-[36px] bg-white/20 border-4 border-white/30 overflow-hidden backdrop-blur-xl flex items-center justify-center shadow-2xl">
              {profile.photo ? (
                <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-400/30 flex items-center justify-center">
                  <FiUser className="w-12 h-12 text-white/50" />
                </div>
              )}
            </div>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/vendor/profile/details')}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-blue-50 text-blue-600"
            >
              <FiEdit2 className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="w-full">
            <h2 className="text-3xl font-black text-white truncate mb-1 tracking-tight">{profile.name}</h2>
            <p className="text-[10px] font-bold text-blue-50 uppercase tracking-widest mb-6">
              {profile.businessName || 'Verified Elite Partner'}
            </p>
            
            <div className="flex items-center justify-center gap-6">
              <div className="px-6 py-3 bg-white/15 rounded-2xl backdrop-blur-md border border-white/10 flex items-center gap-3">
                <FiStar className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span className="text-xs font-bold text-white tracking-wide">{profile.rating.toFixed(1)} Rating</span>
              </div>
              <div className="px-6 py-3 bg-white/15 rounded-2xl backdrop-blur-md border border-white/10 flex items-center gap-3">
                <FiBriefcase className="w-4 h-4 text-white/80" />
                <span className="text-xs font-bold text-white tracking-wide">{profile.totalJobs} Deployments</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Action Grid */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Financials', icon: FaWallet, path: '/vendor/wallet' },
          { label: 'Operations', icon: FiBriefcase, path: '/vendor/jobs' },
          { label: 'Team', icon: FiUsers, path: '/vendor/workers' },
        ].map((item, idx) => (
          <motion.button
            key={idx}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(item.path)}
            className="bg-white rounded-[32px] p-6 border border-gray-100 flex flex-col items-center text-center group hover:shadow-md transition-all shadow-sm"
          >
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-all border border-gray-100">
              <item.icon className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-900 transition-colors">{item.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Management Ecosystem */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 mb-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Partner Ecosystem</h3>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        
        {menuItems.map((item) => {
          const IconComponent = item.icon || FiSettings;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between p-6 rounded-[28px] border transition-all duration-300 shadow-sm ${
                item.highlight 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-200' 
                : 'bg-white border-gray-100 text-gray-800 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shrink-0 border transition-all ${
                  item.highlight ? 'bg-white/20 border-white/10' : 'bg-gray-50 border-gray-100'
                }`}>
                  {item.customIcon ? (
                    <span className={`text-lg font-black ${item.highlight ? 'text-white' : 'text-gray-400'}`}>{item.customIcon}</span>
                  ) : (
                    <IconComponent className={`w-6 h-6 ${item.highlight ? 'text-white' : 'text-gray-400'}`} />
                  )}
                </div>
                <div className="text-left">
                  <span className="text-base font-bold tracking-tight block uppercase">{item.label}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${item.highlight ? 'text-white/60' : 'text-gray-400'}`}>
                    Access Module
                  </span>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                item.highlight ? 'bg-white/10' : 'bg-gray-50'
              }`}>
                <FiChevronRight className={`w-5 h-5 ${item.highlight ? 'text-white' : 'text-gray-400'}`} />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Termination Controller */}
      <div className="pt-8">
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
          className="w-full py-6 rounded-[32px] bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-4 active:scale-95 transition-all hover:bg-rose-600 hover:text-white group shadow-sm"
        >
          <FiLogOut className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          Terminate Session
        </motion.button>
        
        <div className="mt-8 flex flex-col items-center gap-2 opacity-30">
          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest text-center">Powered by Nexora Operational Intelligence</p>
          <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest text-center">Build v2.4.0-Premium</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;


