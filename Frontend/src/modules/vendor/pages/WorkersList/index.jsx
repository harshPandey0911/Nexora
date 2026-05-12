import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiPlus, FiSearch, FiUser, FiBriefcase, FiChevronRight, FiStar } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';
import BottomNav from '../../components/layout/BottomNav';
import { getWorkers, deleteWorker } from '../../services/workerService';

const WorkersList = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

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
    const loadWorkers = async () => {
      try {
        const response = await getWorkers();
        const mapped = (response.data || response).map(w => ({
          ...w,
          id: w._id || w.id
        }));
        setWorkers(mapped || []);
      } catch (error) {
        console.error('Error loading workers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkers();
    window.addEventListener('vendorWorkersUpdated', loadWorkers);

    return () => {
      window.removeEventListener('vendorWorkersUpdated', loadWorkers);
    };
  }, []);

  const handleDelete = async (workerId) => {
    if (window.confirm('Are you sure you want to delete this worker?')) {
      try {
        await deleteWorker(workerId);
        setWorkers(workers.filter(w => w.id !== workerId));
        window.dispatchEvent(new Event('vendorWorkersUpdated'));
      } catch (error) {
        console.error('Error deleting worker:', error);
        alert('Failed to delete worker');
      }
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const workerStatus = (worker.status || 'OFFLINE').toUpperCase();
    const isOnline = workerStatus === 'ONLINE';
    const isOffline = workerStatus !== 'ONLINE';

    const matchesFilter = filter === 'all' ||
      (filter === 'online' && isOnline) ||
      (filter === 'offline' && isOffline);

    const matchesSearch = searchQuery === '' ||
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.phone.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen pb-24 relative bg-white">
      {/* Premium Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 0% 0%, rgba(var(--brand-teal-rgb), 0.15) 0%, transparent 70%),
              radial-gradient(at 100% 0%, rgba(var(--brand-yellow-rgb), 0.10) 0%, transparent 70%),
              radial-gradient(at 100% 100%, rgba(var(--brand-orange-rgb), 0.05) 0%, transparent 75%),
              radial-gradient(at 0% 100%, rgba(var(--brand-teal-rgb), 0.08) 0%, transparent 70%),
              #F8FAFC
            `
          }}
        />
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/40 border-b border-black/[0.03] px-6 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-black/[0.02] flex items-center justify-center">
            <FiUsers className="w-5 h-5 text-gray-900" />
          </div>
          <h1 className="text-xl font-[1000] text-gray-900 tracking-tight">Our Team</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/vendor/workers/add')}
          className="w-10 h-10 rounded-xl bg-[#0D463C] text-white shadow-lg shadow-[#0D463C]/20 flex items-center justify-center"
        >
          <FiPlus className="w-5 h-5" />
        </motion.button>
      </header>

      <main className="px-5 pt-6 relative z-10">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/70 backdrop-blur-md rounded-[24px] shadow-sm border border-white/60 focus:border-teal-500 outline-none font-bold text-gray-900 placeholder:text-gray-300 transition-all"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all', label: 'All Team' },
            { id: 'online', label: 'Online' },
            { id: 'offline', label: 'Offline' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setFilter(option.id)}
              className={`px-6 py-2.5 rounded-full font-black text-[11px] uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${
                filter === option.id
                  ? 'bg-[#0D463C] text-white shadow-lg shadow-[#0D463C]/20'
                  : 'bg-white text-gray-500 border border-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Workers List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-white/40 shadow-sm animate-pulse h-24" />
            ))}
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-12 text-center shadow-sm border border-white/40">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiUsers className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">No workers found</h3>
            <p className="text-sm font-bold text-gray-400 mb-8">Start by adding team members to manage jobs better.</p>
            <button
              onClick={() => navigate('/vendor/workers/add')}
              className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-teal-600/20"
            >
              ADD FIRST WORKER
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkers.map((worker) => {
              const statusRaw = (worker.status || 'OFFLINE').toUpperCase();
              const isOnline = statusRaw === 'ONLINE';
              
              return (
                <motion.div
                  key={worker.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/vendor/workers/${worker.id}/edit`)}
                  className="bg-white rounded-[32px] p-5 shadow-sm border border-gray-100 flex items-center gap-4 relative active:scale-98 transition-all"
                >
                  {/* Profile Photo & Status Dot */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-[20px] overflow-hidden bg-gray-50 border border-black/[0.03] flex items-center justify-center">
                      {worker.profilePhoto ? (
                        <img src={worker.profilePhoto} alt={worker.name} className="w-full h-full object-cover" />
                      ) : (
                        <FiUser className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    {isOnline && (
                      <div className="absolute top-0 -right-1 w-4 h-4 rounded-full bg-[#00D26A] border-2 border-white shadow-sm" />
                    )}
                  </div>

                  {/* Worker Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[15px] font-[1000] text-gray-900 truncate uppercase">
                        {worker.name}
                      </h3>
                      <div className="flex items-center gap-1 bg-[#FFF9E6] px-2 py-0.5 rounded-lg shrink-0">
                        <FiStar className="w-3 h-3 text-[#FFC107] fill-[#FFC107]" />
                        <span className="text-[11px] font-black text-[#856404]">{worker.rating || '4.5'}</span>
                      </div>
                    </div>
                    
                    <p className="text-[12px] font-bold text-gray-400 mb-3 tracking-tight">
                      {worker.phone || 'No phone'}
                    </p>
                    
                    <div className="flex items-center gap-4">
                      {/* Jobs Count Pill */}
                      <div className="flex items-center gap-1.5 bg-[#E6F7FF] px-3 py-1.5 rounded-full">
                        <FiBriefcase className="w-3 h-3 text-[#0D463C]" />
                        <span className="text-[9px] font-[1000] text-[#0D463C] uppercase tracking-wider">
                          {worker.completedJobs || 0} Jobs
                        </span>
                      </div>
                      
                      {/* Availability Status */}
                      <span className="text-[9px] font-[1000] text-[#0D463C] uppercase tracking-[0.1em]">
                        {isOnline ? 'Available' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  {/* Navigation Arrow */}
                  <div className="shrink-0 ml-1">
                    <FiChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default WorkersList;
