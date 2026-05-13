import React, { useState, useEffect, useLayoutEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiCheckCircle, FiClock, FiTrendingUp, FiChevronRight, FiUser, FiBell, FiMapPin, FiArrowRight, FiSettings, FiStar, FiZap } from 'react-icons/fi';
import { FaWallet } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { workerTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import workerService from '../../../../services/workerService';
import { registerFCMToken } from '../../../../services/pushNotificationService';
import LogoLoader from '../../../../components/common/LogoLoader';
import OptimizedImage from '../../../../components/common/OptimizedImage';
import { useSocket } from '../../../../context/SocketContext';
import WorkerJobAlertModal from '../../components/bookings/WorkerJobAlertModal';

const Dashboard = memo(() => {
  const navigate = useNavigate();
  const socket = useSocket();

  const [stats, setStats] = useState({
    pendingJobs: 0,
    acceptedJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    rating: 0,
    performanceScore: 85, // Default placeholder
  });
  const [workerProfile, setWorkerProfile] = useState({
    name: 'Professional',
    phone: '',
    photo: null,
    categories: [],
    address: null,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alertJobId, setAlertJobId] = useState(null);

  // Set background gradient
  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
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

  const fetchDashboardData = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const [profileRes, statsRes] = await Promise.all([
        workerService.getProfile(),
        workerService.getDashboardStats()
      ]);

      if (profileRes.success) {
        const profile = profileRes.worker;
        setWorkerProfile({
          name: profile.name || 'Professional',
          phone: profile.phone || '',
          photo: profile.profilePhoto || null,
          categories: profile.serviceCategories || (profile.serviceCategory ? [profile.serviceCategory] : []),
          address: profile.address,
        });
        setIsOnline(profile.status === 'ONLINE');
      }

      if (statsRes.success) {
        const { totalEarnings, activeJobs, completedJobs, rating, recentJobs: apiRecentJobs } = statsRes.data;
        setStats(prev => ({
          ...prev,
          totalEarnings: totalEarnings || 0,
          thisMonthEarnings: totalEarnings || 0,
          pendingJobs: activeJobs || 0,
          acceptedJobs: activeJobs || 0,
          completedJobs: completedJobs || 0,
          rating: rating || 0,
          performanceScore: Math.min(100, Math.max(70, (rating || 4.5) * 20)) // Mock performance score
        }));

        if (apiRecentJobs) {
          setRecentJobs(apiRecentJobs.slice(0, 3).map(job => ({
            id: job._id,
            serviceType: job.serviceId?.title || job.serviceName || 'Service',
            customerName: job.userId?.name || 'Customer',
            location: job.address?.city || 'Location N/A',
            time: job.scheduledTime || 'N/A',
            status: job.status,
            price: job.finalAmount,
          })));
        }
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    registerFCMToken('worker', true).catch(err => console.error('FCM registration failed:', err));

    const handleUpdate = () => fetchDashboardData(false);
    window.addEventListener('workerJobsUpdated', handleUpdate);
    return () => window.removeEventListener('workerJobsUpdated', handleUpdate);
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (notif) => {
      if ((notif.type === 'booking_created' || notif.type === 'job_assigned') && notif.relatedId) {
        setAlertJobId(notif.relatedId);
      }
    };
    socket.on('notification', handleNotification);
    return () => socket.off('notification', handleNotification);
  }, [socket]);

  const handleToggleOnline = async () => {
    try {
      setIsToggling(true);
      const newStatus = isOnline ? 'OFFLINE' : 'ONLINE';
      const response = await workerService.updateStatus(newStatus);
      if (response.success) {
        setIsOnline(!isOnline);
        toast.success(`You are now ${newStatus === 'ONLINE' ? 'Online' : 'Offline'}`);
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setIsToggling(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'PENDING': 'Pending',
      'ACCEPTED': 'Accepted',
      'IN_PROGRESS': 'Started',
      'WORK_DONE': 'Finished',
      'COMPLETED': 'Paid',
    };
    return labels[status] || status;
  };

  if (loading) return <LogoLoader />;

  return (
    <div className="min-h-screen pb-24 bg-white relative">
      {/* Premium Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 0% 0%, rgba(13, 148, 136, 0.08) 0%, transparent 70%),
              radial-gradient(at 100% 0%, rgba(13, 70, 60, 0.05) 0%, transparent 70%),
              #F8FAFC
            `
          }}
        />
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 border-b border-black/[0.03] px-5 py-3.5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-black/[0.02] flex items-center justify-center">
            <FiZap className="w-5 h-5 text-[#0D463C]" />
          </div>
          <h1 className="text-xl font-[1000] text-gray-900 tracking-tight">
            Pro<span className="text-teal-600">Hub</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleOnline}
            disabled={isToggling}
            className={`relative w-12 h-6.5 rounded-full transition-all duration-500 flex items-center px-1 shadow-inner ${
              isOnline ? 'bg-[#0D463C]' : 'bg-gray-200'
            }`}
          >
            <motion.div
              animate={{ x: isOnline ? 22 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-4.5 h-4.5 bg-white rounded-full shadow-md flex items-center justify-center"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#0D463C]' : 'bg-gray-300'}`} />
            </motion.div>
          </button>

          <motion.div 
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center relative border border-black/[0.03]"
            onClick={() => navigate('/worker/notifications')}
          >
            <FiBell className="w-5 h-5 text-gray-400" />
            {stats.pendingJobs > 0 && (
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white" />
            )}
          </motion.div>
          
          <motion.div 
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-white shadow-sm overflow-hidden border border-black/[0.03] cursor-pointer"
            onClick={() => navigate('/worker/profile')}
          >
            {workerProfile?.photo ? (
              <OptimizedImage src={workerProfile.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <FiUser className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 pt-4">
        {/* Premium Performance Card */}
        <div className="px-5 pb-6">
          <div 
            className="rounded-[28px] p-5 shadow-[0_20px_40px_-12px_rgba(13,148,136,0.15)] relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0D9488 0%, #064E3B 100%)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/20 rounded-full blur-[60px] -mr-12 -mt-12" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
                <p className="text-[9px] font-black text-teal-200/60 uppercase tracking-[0.2em]">Active Status</p>
              </div>
              <h3 className="text-white text-xl font-[1000] leading-tight mb-4">
                Welcome back, {workerProfile.name.split(' ')[0]}!
              </h3>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/worker/jobs')}
                className="bg-white text-teal-900 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-xl shadow-teal-900/10"
              >
                My Schedule
              </motion.button>
            </div>
          </div>
        </div>

        <div className="px-5 space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={() => navigate('/worker/wallet')}
              className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center active:scale-95 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mb-2 text-teal-600">
                <FaWallet className="w-4 h-4" />
              </div>
              <p className="text-xl font-[1000] text-gray-900 tracking-tight">₹{stats.totalEarnings.toLocaleString()}</p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Earnings</p>
            </div>
            <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center active:scale-95 transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-2 text-orange-600">
                <FiStar className="w-5 h-5" />
              </div>
              <p className="text-xl font-[1000] text-gray-900 tracking-tight">{stats.rating || '4.5'}</p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rating</p>
            </div>
          </div>

          {/* Service Categories - Compact Full Width List */}
          {workerProfile.categories?.length > 0 && (
            <div>
              <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.15em] mb-3 px-1 opacity-50">Service Expertise</h2>
              <div className="space-y-2">
                {workerProfile.categories.slice(0, 4).map((cat) => (
                  <div key={cat} className="bg-white rounded-[20px] p-3 flex items-center justify-between border border-gray-100 shadow-sm active:scale-95 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                        <FiSettings className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <span className="text-[12px] font-[1000] text-gray-900 uppercase tracking-tight block leading-tight">{cat}</span>
                        <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest">Verified Pro</span>
                      </div>
                    </div>
                    <FiChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Jobs */}
          <div className="pb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-[1000] text-gray-900 tracking-tight">Recent Jobs</h2>
              <button
                onClick={() => navigate('/worker/jobs')}
                className="text-[11px] font-black text-teal-600 uppercase tracking-widest flex items-center gap-1 bg-teal-50 px-3 py-1.5 rounded-full"
              >
                All <FiChevronRight />
              </button>
            </div>

            <div className="space-y-4">
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/worker/job/${job.id}`)}
                    className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                        <span className="text-xl">🛠️</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-[15px] font-[1000] text-gray-900 truncate">{job.customerName}</h4>
                          <span className="text-xs font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg">₹{job.price}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 mb-3">{job.serviceType}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-tight">
                              <FiMapPin className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[80px]">{job.location}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-tight">
                              <FiClock className="w-3.5 h-3.5" />
                              <span>{job.time}</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-[#0D463C] text-white rounded-full text-[8px] font-black uppercase tracking-widest">
                            {getStatusLabel(job.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="bg-gray-50 rounded-[32px] p-10 text-center border border-gray-100">
                  <FiBriefcase className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                  <p className="text-sm font-bold text-gray-400">No recent jobs found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <WorkerJobAlertModal
        isOpen={!!alertJobId}
        jobId={alertJobId}
        onClose={() => setAlertJobId(null)}
        onJobAccepted={(id) => {
          fetchDashboardData();
          navigate(`/worker/job/${id}`);
        }}
      />
    </div>
  );
});

export default Dashboard;

