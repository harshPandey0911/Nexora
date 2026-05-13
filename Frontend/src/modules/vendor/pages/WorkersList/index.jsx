import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiPlus, FiSearch, FiUser, FiBriefcase, FiChevronRight, FiStar } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';
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
        if (workers.length === 0) setLoading(true);
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
  }, [workers.length]);

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
            <FiUsers className="w-5 h-5 text-teal-600" />
          </div>
          <h1 className="text-xl font-[1000] text-gray-900 tracking-tight">Our Fleet</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/vendor/workers/add')}
          className="w-10 h-10 rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/20 flex items-center justify-center"
        >
          <FiPlus className="w-5 h-5" />
        </motion.button>
      </header>

      <main className="px-5 pt-6 relative z-10">
        {/* Search Bar (Premium Theme) */}
        <div className="mb-6">
          <div className="relative group">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-teal-600 transition-colors" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-[28px] py-4.5 pl-14 pr-6 text-[13px] font-black text-gray-900 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/50 focus:border-teal-500/30 outline-none transition-all placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Filter Buttons (Premium Theme) */}
        <div className="flex gap-2.5 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all', label: 'All Fleet' },
            { id: 'online', label: 'Online' },
            { id: 'offline', label: 'Offline' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setFilter(option.id)}
              className={`px-7 py-3 rounded-full font-[1000] text-[10px] uppercase tracking-widest whitespace-nowrap transition-all duration-500 ${filter === option.id
                ? 'bg-teal-600 text-white shadow-xl shadow-teal-900/20 scale-105'
                : 'bg-white/60 backdrop-blur-md text-gray-500 border border-white/60 shadow-sm hover:bg-gray-50'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Workers List */}
        {loading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/60 backdrop-blur-md rounded-[32px] p-6 border border-white shadow-sm animate-pulse h-24" />
            ))}
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="bg-white/40 backdrop-blur-md rounded-[40px] p-16 text-center border border-white/60">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
              👥
            </div>
            <h3 className="text-xl font-[1000] text-gray-900 mb-2">No workers found</h3>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest opacity-60 mb-8">
              Start by adding team members to manage jobs better
            </p>
            <button
              onClick={() => navigate('/vendor/workers/add')}
              className="w-full py-5 text-white rounded-[24px] font-[1000] text-[11px] uppercase tracking-[0.25em] bg-black shadow-2xl shadow-black/10 active:scale-95 transition-all"
            >
              Authorize Worker
            </button>
          </div>
        ) : (
          <div className="space-y-5 pb-10">
            {filteredWorkers.map((worker) => {
              const statusRaw = (worker.status || 'OFFLINE').toUpperCase();
              const isOnline = statusRaw === 'ONLINE';

              return (
                <motion.div
                  key={worker.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/vendor/workers/${worker.id}/edit`)}
                  className="bg-white/70 backdrop-blur-md rounded-[36px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 flex items-center gap-4 relative active:scale-98 transition-all hover:shadow-xl hover:shadow-teal-500/5"
                >
                  {/* Photo */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-[24px] overflow-hidden bg-white shadow-sm border border-black/[0.03] group-hover:border-teal-500/20 transition-all">
                      {worker.profilePhoto ? (
                        <img src={worker.profilePhoto} alt={worker.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-teal-100">
                          <FiUser className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-gray-300'
                      }`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-[15px] font-[1000] text-gray-900 truncate tracking-tight">{worker.name}</h3>
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                        <FiStar className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-black text-amber-700">{worker.rating || '4.5'}</span>
                      </div>
                    </div>

                    <p className="text-[11px] font-black text-gray-400 mb-3 tracking-tight opacity-70">{worker.phone}</p>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-[9px] font-[1000] uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded-xl border border-teal-100/50">
                        <FiBriefcase className="w-3 h-3" />
                        <span>{worker.completedJobs || 0} Jobs</span>
                      </div>
                      <span className={`text-[9px] font-[1000] uppercase tracking-widest ${isOnline ? 'text-green-500' : 'text-gray-300'
                        }`}>
                        {isOnline ? 'Available' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="w-11 h-11 rounded-2xl bg-gray-50/50 flex items-center justify-center shrink-0 border border-black/[0.02]">
                    <FiChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkersList;
