import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiBriefcase, FiUsers, FiBell, FiArrowRight, FiUser, FiClock, FiMapPin, FiCheckCircle, FiTrendingUp, FiChevronRight, FiStar } from 'react-icons/fi';
import { FaWallet } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import { vendorDashboardService } from '../../services/dashboardService';
import { acceptBooking, rejectBooking, assignWorker } from '../../services/bookingService';
// Booking alert handled globally
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

import { registerFCMToken } from '../../../../services/pushNotificationService';
import LogoLoader from '../../../../components/common/LogoLoader';
import StatsCards from './components/StatsCards';
import PendingBookings from './components/PendingBookings';


const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000';

const Dashboard = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to convert hex to rgba
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const [stats, setStats] = useState({
    todayEarnings: 0,
    activeJobs: 0,
    pendingAlerts: 0,
    workersOnline: 0,
    totalEarnings: 0,
    completedJobs: 0,
    rating: 0,
    performanceScore: 0,
    level: 1,
    commissionRate: 0
  });
  const [isOnline, setIsOnline] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [vendorProfile, setVendorProfile] = useState({
    name: 'Vendor Name',
    businessName: 'Business Name',
    photo: null,
    service: []
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [globalConfig, setGlobalConfig] = useState({ maxSearchTime: 5, waveDuration: 60 });

  const ignoredBookingIds = useRef(new Set());

  // Set background gradient
  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    // Using the same premium background as user
    const bgStyle = '#FFFFFF';

    if (html) html.style.background = bgStyle;
    if (body) body.style.background = bgStyle;
    if (root) root.style.background = bgStyle;

    return () => {
      if (html) html.style.background = '';
      if (body) body.style.background = '';
      if (root) root.style.background = '';
    };
  }, []);



  // Process API response - extracted to avoid duplication
  const processApiResponse = useCallback((response) => {
    if (!response.success) return;

    const { stats: apiStats, recentBookings, config } = response.data;
    if (config) setGlobalConfig(config);

    // Separate requested/searching bookings from other bookings
    const requestedBookings = (recentBookings || []).filter(booking => {
      const status = booking.status?.toLowerCase();
      return status === 'requested' || status === 'searching';
    });
    const otherBookings = (recentBookings || []).filter(booking => {
      const status = booking.status?.toLowerCase();
      return status !== 'requested' && status !== 'searching';
    });

    // Build pending bookings map
    const mergedMap = new Map();
    const vendorData = JSON.parse(localStorage.getItem('vendorData') || '{}');
    const vendorId = vendorData._id || vendorData.id;

    requestedBookings.forEach(b => {
      const id = String(b._id || b.id);

      // Find distance for this vendor if available
      let distance = 'N/A';
      if (b.potentialVendors && vendorId) {
        const potentialVendor = b.potentialVendors.find(pv =>
          String(pv.vendorId?._id || pv.vendorId) === String(vendorId)
        );
        if (potentialVendor && potentialVendor.distance) {
          distance = `${potentialVendor.distance.toFixed(1)} km`;
        }
      }

      mergedMap.set(id, {
        ...b, // Spread first!
        id,
        serviceName: b.serviceName || b.serviceId?.title || 'New Booking Request',
        serviceCategory: b.serviceCategory || b.serviceId?.categoryId?.title || 'General Service',
        customerName: b.userId?.name || 'Customer',
        location: {
          address: b.address?.addressLine1 || 'Address not available',
          distance: distance
        },
        // Prioritize vendorEarnings, fallback to 90% of finalAmount if it's not a free plan (finalAmount > 0)
        price: (b.vendorEarnings > 0 ? b.vendorEarnings : (b.finalAmount > 0 ? b.finalAmount * 0.9 : 0)).toFixed(2),
        vendorEarnings: b.vendorEarnings, // Ensure it's explicitly passed
        timeSlot: {
          date: new Date(b.scheduledDate).toLocaleDateString(),
          time: b.scheduledTime || 'Time not set'
        },
        status: b.status,
        expiresAt: b.expiresAt || (b.createdAt && config ? new Date(new Date(b.createdAt).getTime() + (config.maxSearchTime || 5) * 60000).toISOString() : null)
      });
    });

    // Filter out locally ignored bookings
    const finalMap = new Map();
    mergedMap.forEach((value, key) => {
      if (!ignoredBookingIds.current.has(key)) {
        finalMap.set(key, value);
      }
    });

    // Merge with local storage to avoid losing real-time updates that haven't hit API yet
    const localPending = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
    const apiPending = Array.from(finalMap.values());
    const mergedPending = [...apiPending];

    localPending.forEach(localJob => {
      const id = String(localJob.id || localJob._id);
      if (!mergedPending.find(job => String(job.id || job._id) === id) && !ignoredBookingIds.current.has(id)) {

        const createdAt = localJob.createdAt ? new Date(localJob.createdAt).getTime() : Date.now();
        const expiresAt = localJob.expiresAt || (localJob.createdAt && config ? new Date(createdAt + (config.maxSearchTime || 5) * 60000).toISOString() : null);
        const isExpired = (expiresAt && new Date(expiresAt) <= new Date()) || (Date.now() - createdAt > 300000);

        const lowerStatus = String(localJob.status || '').toLowerCase();

        if (!isExpired && (lowerStatus === 'requested' || lowerStatus === 'searching')) {
          mergedPending.push({
            ...localJob,
            id,
            serviceName: localJob.serviceName || localJob.serviceId?.title || 'New Booking Request',
            serviceCategory: localJob.serviceCategory || localJob.serviceId?.categoryId?.title || 'General Service',
            customerName: localJob.customerName || localJob.userId?.name || 'Customer',
            expiresAt
          });
        }
      }
    });

    setPendingBookings(mergedPending);
    localStorage.setItem('vendorPendingJobs', JSON.stringify(mergedPending));

    // Update stats
    setStats({
      todayEarnings: apiStats.vendorEarnings || 0,
      activeJobs: apiStats.inProgressBookings || 0,
      pendingAlerts: mergedPending.length,
      workersOnline: apiStats.workersOnline || 0,
      totalEarnings: apiStats.vendorEarnings || 0,
      completedJobs: apiStats.completedBookings || 0,
      rating: apiStats.rating || 0,
      performanceScore: apiStats.performanceScore || 0,
      level: apiStats.level || 3,
      commissionRate: apiStats.commissionRate || 15
    });

    // Set online status from API
    if (apiStats.isOnline !== undefined) {
      setIsOnline(apiStats.isOnline);
    }

    // Recent jobs (non-requested)
    const recentJobsData = otherBookings.slice(0, 3).map(booking => ({
      id: booking._id,
      serviceType: booking.serviceId?.title || 'Service',
      customerName: booking.userId?.name || 'Customer',
      location: booking.address?.addressLine1 || 'Address not available',
      price: (booking.vendorEarnings > 0 ? booking.vendorEarnings : (booking.finalAmount ? booking.finalAmount * 0.9 : 0)).toFixed(2),
      vendorEarnings: booking.vendorEarnings,
      timeSlot: {
        date: new Date(booking.scheduledDate).toLocaleDateString(),
        time: booking.scheduledTime || 'Time not set'
      },
      status: booking.status,
      assignedTo: booking.workerId ? { name: booking.workerId.name } : null,
    }));
    setRecentJobs(recentJobsData);

    // Load vendor profile from localStorage (once)
    const profile = JSON.parse(localStorage.getItem('vendorData') || '{}');
    setVendorProfile({
      name: profile.name || 'Vendor Name',
      businessName: profile.businessName || 'Business Name',
      photo: profile.profilePhoto || null,
      service: profile.service || []
    });
  }, []);

  // Main data loader - useCallback to prevent recreation
  const loadDashboardData = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError(null);

      const response = await vendorDashboardService.getDashboardStats();
      processApiResponse(response);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(String(err.message || 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  }, [processApiResponse]);

  useEffect(() => {
    // Only show the big spinner on initial mount or when data is empty
    const shouldShowSpinner = !stats.activeJobs && recentJobs.length === 0;
    loadDashboardData(shouldShowSpinner);
  }, [loadDashboardData]);

  // Check for redirected state (to open a specific alert modal)
  useEffect(() => {
    if (location.state?.openBookingId && pendingBookings.length > 0) {
      const bId = String(location.state.openBookingId);
      const booking = pendingBookings.find(b => String(b.id || b._id) === bId);
      if (booking) {
        setActiveAlertBookings(prev => {
          if (prev.find(p => String(p.id || p._id) === bId)) return prev;
          return [...prev, booking];
        });
        // Clear state to avoid reopening on refresh
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, pendingBookings, navigate]);

  // Listen for real-time updates via window events (dispatched by useAppNotifications)
  useEffect(() => {
    const handleUpdate = () => {
      loadDashboardData(false); // false = don't show spinner for background refresh
    };

    // Ask for notification permission and register FCM
    registerFCMToken('vendor', true).catch(err => console.error('FCM registration failed:', err));

    // Listen for custom dashboard events from SocketContext
    const handleShowAlert = (e) => {
      // e.detail contains the new booking job
      if (e.detail) {
        // Also add to pending if not present
        setPendingBookings(prev => {
          if (prev.find(b => b.id === e.detail.id)) return prev;
          return [e.detail, ...prev];
        });
      }
    };

    const handleRemoveBooking = (e) => {
      if (e.detail?.id) {
        const idToRemove = String(e.detail.id);

        // Add to ignored list so it doesn't come back on next fetch
        ignoredBookingIds.current.add(idToRemove);

        // Remove from pending bookings state immediately
        setPendingBookings(prev => prev.filter(b => String(b.id || b._id) !== idToRemove));

        // Remove from recent jobs state
        setRecentJobs(prev => prev.filter(b => String(b.id || b._id) !== idToRemove));

        // Remove from localStorage
        const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
        const updatedPending = pendingJobs.filter(job => String(job.id || job._id) !== idToRemove);
        localStorage.setItem('vendorPendingJobs', JSON.stringify(updatedPending));
      }
    };

    window.addEventListener('vendorJobsUpdated', handleUpdate);
    window.addEventListener('vendorStatsUpdated', handleUpdate);
    window.addEventListener('showDashboardBookingAlert', handleShowAlert);
    window.addEventListener('removeVendorBooking', handleRemoveBooking);

    return () => {
      window.removeEventListener('vendorJobsUpdated', handleUpdate);
      window.removeEventListener('vendorStatsUpdated', handleUpdate);
      window.removeEventListener('showDashboardBookingAlert', handleShowAlert);
      window.removeEventListener('removeVendorBooking', handleRemoveBooking);
    };
  }, [loadDashboardData]);


  // Alert Action Handlers
  const handleAcceptAlert = async (bookingId) => {
    try {
      const response = await acceptBooking(bookingId);
      if (response.success) {
        toast.success('Booking accepted successfully!');
        setPendingBookings(prev => prev.filter(b => String(b.id || b._id) !== String(bookingId)));

        // Sync localStorage
        const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
        const updated = pendingJobs.filter(b => String(b.id || b._id) !== String(bookingId));
        localStorage.setItem('vendorPendingJobs', JSON.stringify(updated));

        window.dispatchEvent(new CustomEvent('removeVendorBooking', { detail: { id: bookingId } }));
        window.dispatchEvent(new Event('vendorStatsUpdated'));
      }
    } catch (error) {
      console.error('Error accepting:', error);
      toast.error('Failed to accept booking');
    }
  };

  const handleRejectAlert = async (bookingId) => {
    try {
      const response = await rejectBooking(bookingId);
      if (response.success) {
        toast.success('Booking rejected');
        setPendingBookings(prev => prev.filter(b => String(b.id || b._id) !== String(bookingId)));

        // Sync localStorage
        const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
        const updated = pendingJobs.filter(b => String(b.id || b._id) !== String(bookingId));
        localStorage.setItem('vendorPendingJobs', JSON.stringify(updated));

        window.dispatchEvent(new CustomEvent('removeVendorBooking', { detail: { id: bookingId } }));
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Failed to reject booking');
    }
  };

  const handleAssignAlert = async (bookingId) => {
    navigate('/vendor/workers', { state: { bookingId } });
  };

  const handleToggleOnline = async () => {
    try {
      setIsToggling(true);
      const newStatus = !isOnline;
      const response = await vendorDashboardService.updateStatus(newStatus);
      if (response.success) {
        setIsOnline(newStatus);
        toast.success(`You are now ${newStatus ? 'Online' : 'Offline'}`);

        // Update local stats too
        setStats(prev => ({ ...prev, isOnline: newStatus }));
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsToggling(false);
    }
  };

  // Memoize quickActions to prevent recreation on every render
  const quickActions = useMemo(() => [
    {
      title: 'Active Jobs',
      icon: FiBriefcase,
      color: '#00a6a6',
      path: '/vendor/jobs',
      count: stats.activeJobs,
      subtitle: `${stats.activeJobs} running`,
    },
    {
      title: 'Manage Workers',
      icon: FiUsers,
      color: '#29ad81',
      path: '/vendor/workers',
      count: stats.workersOnline,
      subtitle: `${stats.workersOnline} online`,
    },
    {
      title: 'Wallet',
      icon: FaWallet,
      color: '#F59E0B',
      path: '/vendor/wallet',
      subtitle: `₹${stats.totalEarnings.toLocaleString()} total`,
    },
  ], [stats.activeJobs, stats.workersOnline, stats.totalEarnings]);

  const getStatusColor = (status) => {
    const s = String(status).toLowerCase();
    const statusColors = {
      'accepted': '#3B82F6',
      'confirmed': '#10B981',
      'assigned': '#8B5CF6',
      'journey_started': '#F59E0B',
      'visited': '#F59E0B',
      'in_progress': '#F59E0B',
      'work_done': '#10B981',
      'completed': '#10B981',
      'worker_paid': '#06B6D4',
      'settlement_pending': '#F97316',
    };
    return statusColors[s] || '#6B7280';
  };

  const getStatusLabel = (status) => {
    const s = String(status).toLowerCase();
    const labels = {
      'requested': 'Requested',
      'searching': 'Searching',
      'accepted': 'Accepted',
      'confirmed': 'Confirmed',
      'assigned': 'Assigned',
      'journey_started': 'On the way',
      'visited': 'Visited',
      'in_progress': 'In Progress',
      'work_done': 'Work Done',
      'completed': 'Completed',
      'worker_paid': 'Payment Done',
      'settlement_pending': 'Settlement',
      'cancelled': 'Cancelled',
      'rejected': 'Rejected'
    };
    return labels[s] || status;
  };

  // Show loading state
  if (loading) {
    return <LogoLoader />;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center" style={{ background: themeColors.backgroundGradient }}>
        <div className="text-center px-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-xl font-semibold mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && error.length > 0 && !loading) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center" style={{ background: themeColors.backgroundGradient }}>
        <div className="text-center px-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-xl font-semibold mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 relative" style={{ background: '#FFFFFF' }}>
      {/* Premium Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 0% 0%, rgba(13, 148, 136, 0.12) 0%, transparent 70%),
              radial-gradient(at 100% 100%, rgba(13, 148, 136, 0.05) 0%, transparent 75%),
              #F8FAFC
            `
          }}
        />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(#0D9488 0.8px, transparent 0.8px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/40 border-b border-black/[0.03] px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-teal-900/5 flex items-center justify-center border border-black/[0.02]">
            <div className="text-teal-600 font-[1000] text-xl">⚡</div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-[1000] text-gray-900 tracking-tight leading-none">
              ProHub
            </h1>
            <span className="text-[8px] font-black text-teal-600 uppercase tracking-[0.2em] mt-1">Operational Intel</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Minimalist Online Toggle */}
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className={`relative w-14 h-7 rounded-full transition-all duration-700 cursor-pointer shadow-inner ${
              isOnline ? 'bg-teal-600 shadow-teal-900/20' : 'bg-gray-200'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleOnline();
            }}
          >
            <motion.div
              animate={{ x: isOnline ? 28 : 4 }}
              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg flex items-center justify-center"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-teal-600 animate-pulse' : 'bg-gray-300'}`} />
            </motion.div>
          </motion.div>

          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-2xl bg-white shadow-xl shadow-black/5 flex items-center justify-center relative border border-black/[0.02] cursor-pointer"
            onClick={() => navigate('/vendor/notifications')}
          >
            <FiBell className="w-5 h-5 text-gray-400" />
            {stats.pendingAlerts > 0 && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
            )}
          </motion.div>
        </div>
      </header>

      <main className="pt-8 relative z-10">
        {/* Premium Performance Dashboard */}
        <div className="px-5 pb-10">
          <div
            className="rounded-[36px] p-6 shadow-[0_30px_60px_-15px_rgba(13,148,136,0.2)] relative overflow-hidden group"
            style={{ background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)' }}
          >
            {/* Ambient Background Dynamics */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-teal-300/20 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute -bottom-5 -left-5 w-32 h-32 bg-emerald-400/10 rounded-full blur-[60px]" />

            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 px-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-ping" />
                  <p className="text-[9px] font-black text-teal-100/60 uppercase tracking-[0.2em]">System Health</p>
                </div>
                <h3 className="text-white text-2xl font-[1000] leading-tight mb-5 tracking-tight">
                  Excellence <br />Achieved.
                </h3>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/vendor/jobs')}
                  className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-2xl text-[9px] font-[1000] uppercase tracking-widest hover:bg-white hover:text-teal-900 transition-all"
                >
                  View Deployment
                </motion.button>
              </div>

              {/* Enhanced Performance Analytics */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <motion.circle
                    initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - stats.performanceScore / 100) }}
                    cx="48"
                    cy="48"
                    r="42"
                    stroke="#FFFFFF"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeLinecap="round"
                    fill="transparent"
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-white text-2xl font-[1000] tracking-tighter">{stats.performanceScore}%</span>
                  <span className="text-[6px] font-black text-teal-100/50 uppercase tracking-[0.2em] mt-0.5">Score</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Content Matrix */}
        <div className="px-5 space-y-10">
          {/* Active Job Alert Layer */}
          <PendingBookings
            bookings={pendingBookings}
            maxSearchTimeMins={globalConfig.maxSearchTime}
            setPendingBookings={setPendingBookings}
            setActiveAlertBooking={(booking) => {
              window.dispatchEvent(new CustomEvent('showDashboardBookingAlert', { detail: booking }));
            }}
          />

          {/* Core Analytics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Deployed', value: stats.completedJobs, icon: FiCheckCircle, color: 'orange', bg: 'bg-orange-50/50', text: 'text-orange-600' },
              { label: 'Reputation', value: stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A', icon: FiStar, color: 'blue', bg: 'bg-blue-50/50', text: 'text-blue-600' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-md rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 flex flex-col items-center text-center group hover:scale-[1.03] hover:shadow-2xl hover:shadow-teal-900/5 hover:border-teal-100 transition-all duration-300">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-3 ${stat.text} group-hover:scale-110 transition-all`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-2xl font-[1000] text-gray-900 tracking-tighter">
                  {stat.value}
                </p>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.15em] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Operational Stream */}
          <div className="pb-12">
            <div className="flex items-center justify-between mb-6 px-1">
              <div>
                <h2 className="text-xl font-[1000] text-gray-900 tracking-tight">Active Stream</h2>
                <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mt-1">Live Deployment Status</p>
              </div>
              {recentJobs.length > 0 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/vendor/jobs')}
                  className="text-[10px] font-[1000] text-teal-600 uppercase tracking-widest flex items-center gap-2 bg-white px-5 py-2.5 rounded-full border border-black/[0.03] shadow-sm shadow-black/5"
                >
                  Manage All <FiArrowRight className="w-3 h-3" />
                </motion.button>
              )}
            </div>

            {recentJobs.length > 0 ? (
              <div className="space-y-5">
                {recentJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/vendor/booking/${job.id}`)}
                    className="bg-white/80 backdrop-blur-md rounded-[40px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 cursor-pointer hover:shadow-2xl hover:shadow-teal-500/10 transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-[24px] bg-gray-50 flex items-center justify-center shrink-0 border border-black/[0.02] group-hover:bg-teal-50 transition-colors">
                        <div className="text-2xl filter drop-shadow-sm group-hover:scale-110 transition-transform">🛠️</div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[17px] font-[1000] text-gray-900 truncate tracking-tight group-hover:text-teal-700 transition-colors">
                            {job.customerName}
                          </h4>
                          <span className="text-[10px] font-[1000] text-teal-600 bg-teal-50 px-3 py-1 rounded-xl border border-teal-100/50">
                            ₹{job.price}
                          </span>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 opacity-70">
                          {job.serviceType}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-black/[0.03]">
                          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tight">
                            <FiMapPin className="w-3.5 h-3.5 text-teal-600" />
                            <span className="truncate max-w-[120px]">{job.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tight">
                            <FiClock className="w-3.5 h-3.5 text-teal-600" />
                            <span>{job?.timeSlot?.time || 'N/A'}</span>
                          </div>
                          <div className={`ml-auto px-4 py-1.5 rounded-full text-[8px] font-[1000] uppercase tracking-widest text-white shadow-lg`}
                            style={{ backgroundColor: getStatusColor(job.status) }}>
                            {getStatusLabel(job.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white/40 backdrop-blur-md rounded-[44px] p-16 shadow-inner border border-white/60 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner grayscale opacity-50">
                  📭
                </div>
                <h3 className="text-xl font-[1000] text-gray-900 mb-3 tracking-tight">Operational Calm</h3>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest opacity-60">System is ready for new deployments</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
});

export default Dashboard;
