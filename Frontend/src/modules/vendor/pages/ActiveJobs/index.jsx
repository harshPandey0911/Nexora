import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiMapPin, FiClock, FiUser, FiSearch } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../../theme';
import { getBookings, assignWorker as assignWorkerApi } from '../../services/bookingService';
import { ConfirmDialog } from '../../components/common';

const ActiveJobs = memo(() => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState(() => {
    const cached = localStorage.getItem('vendorJobsList');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('in_progress'); // Default to showing active jobs
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

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

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadJobs = useCallback(async (currentFilter, currentSearch) => {
    try {
      if (isInitialLoad) setLoading(true);
      const response = await getBookings({
        status: currentFilter,
        q: currentSearch,
        limit: 50
      });
      const jobsData = response.data || [];
      const mappedJobs = jobsData.map(job => ({
        id: job._id || job.id,
        serviceType: job.serviceName || 'Service',
        user: {
          name: job.userId?.name || 'Customer'
        },
        location: {
          address: job.address?.addressLine1 || 'Address not available'
        },
        price: (job.finalAmount ? job.finalAmount * 0.9 : 0).toFixed(2),
        status: job.status,
        assignedTo: job.workerId ? { name: job.workerId.name } : (job.assignedAt ? { name: 'You (Self)' } : null),
        timeSlot: {
          date: job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : 'Date',
          time: job.scheduledTime || 'Time'
        }
      }));
      setJobs(mappedJobs);
      localStorage.setItem('vendorJobsList', JSON.stringify(mappedJobs));
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [isInitialLoad]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs(filter, searchQuery);
    }, filter === 'all' && searchQuery === '' ? 0 : 500);

    return () => clearTimeout(timer);
  }, [filter, searchQuery, loadJobs]);

  useEffect(() => {
    const handleUpdate = () => loadJobs(filter, searchQuery);
    window.addEventListener('vendorJobsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('vendorJobsUpdated', handleUpdate);
    };
  }, [loadJobs, filter, searchQuery]);

  // filteredJobs is now just the jobs from the server
  const filteredJobs = jobs;

  const handleAssignToSelf = async (jobId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Assign to Self',
      message: 'Are you sure you want to do this job yourself?',
      onConfirm: async () => {
        try {
          const response = await assignWorkerApi(jobId, 'SELF');
          if (response && response.success) {
            toast.success("Assigned to yourself!");
            // Refresh jobs list instead of full page reload
            loadJobs(filter, searchQuery);
          }
        } catch (error) {
          console.error("Error assigning to self:", error);
          toast.error("Failed to assign to yourself");
        }
      }
    });
  };

  const hexToRgba = useCallback((hex, alpha) => {
    if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, []);

  const getStatusColor = useCallback((status) => {
    const colors = {
      'ACCEPTED': '#F59E0B',
      'ASSIGNED': '#3B82F6',
      'JOURNEY_STARTED': '#F59E0B',
      'VISITED': '#8B5CF6',
      'WORK_DONE': '#10B981',
      'WORKER_PAID': '#06B6D4',
      'SETTLEMENT_PENDING': '#F97316',
      'COMPLETED': '#059669',
    };
    return colors[status?.toUpperCase()] || '#6B7280';
  }, []);

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

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/40 border-b border-black/[0.03] px-6 py-5 flex items-center justify-between relative z-10">
        <h1 className="text-xl font-[1000] text-gray-900 tracking-tight">Active Jobs</h1>
        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-black/[0.02] flex items-center justify-center">
          <FiBriefcase className="w-5 h-5 text-gray-900" />
        </div>
      </header>

      <main className="px-5 pt-6 relative z-10">
        {/* Search Bar (Premium Theme) */}
        <div className="mb-8">
          <div className="relative group">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-teal-600 transition-colors" />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-[28px] py-4.5 pl-14 pr-6 text-[13px] font-black text-gray-900 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/50 focus:border-teal-500/30 outline-none transition-all placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Filter Buttons (Premium Theme) */}
        <div className="flex gap-2.5 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all', label: 'All' },
            { id: 'assigned', label: 'Assigned' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
          ].map((filterOption) => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              className={`px-7 py-3 rounded-full font-[1000] text-[10px] uppercase tracking-widest whitespace-nowrap transition-all duration-500 ${filter === filterOption.id
                ? 'bg-[#0D9488] text-white shadow-xl shadow-teal-900/20 scale-105'
                : 'bg-white text-gray-400 border border-black/[0.03] shadow-sm hover:bg-gray-50'
                }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/60 backdrop-blur-md rounded-[32px] p-6 border border-white shadow-sm animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-32 bg-gray-100 rounded-full" />
                    <div className="h-3 w-20 bg-gray-100 rounded-full" />
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white/40 backdrop-blur-md rounded-[40px] p-16 text-center border border-white/60">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
              📭
            </div>
            <h3 className="text-xl font-[1000] text-gray-900 mb-2">No jobs found</h3>
            <p className="text-xs font-bold text-gray-400">
              {searchQuery ? 'Try another search term' : 'Your list is empty for now'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 pb-10">
            {filteredJobs.map((job) => {
              const isCompleted = job.status?.toLowerCase() === 'completed';

              return (
                <div
                  key={job.id}
                  onClick={() => navigate(`/vendor/booking/${job.id}`)}
                  className="bg-white/70 backdrop-blur-md rounded-[36px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 cursor-pointer active:scale-[0.98] transition-all duration-300 relative group hover:shadow-xl hover:shadow-teal-500/5"
                >
                  <div className="flex items-center gap-4 mb-5">
                    {/* Icon Box */}
                    <div className="w-16 h-16 rounded-[24px] bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100/50 group-hover:bg-teal-50 transition-colors">
                      <FiBriefcase className="w-7 h-7 text-gray-900 group-hover:text-teal-600 transition-colors" />
                    </div>

                    {/* Job Header */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-[15px] font-[1000] text-gray-900 truncate">
                          {job.user?.name || 'Customer'}
                        </h4>
                        <span className="text-[13px] font-[1000] text-teal-600">
                          {isCompleted ? `₹${job.price}` : '---'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <p className="text-[11px] font-black text-gray-500/80">
                          {job.serviceType}
                        </p>
                        <span className="text-[8px] font-black px-2 py-1 rounded-lg bg-teal-50 text-teal-600 uppercase tracking-[0.1em]">
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Grid (Premium Style) */}
                  <div className="flex items-center gap-6 mb-6 px-1">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tight">
                      <FiMapPin className="w-4 h-4 text-teal-500/50" />
                      <span className="truncate max-w-[120px]">{job.location?.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tight">
                      <FiClock className="w-4 h-4 text-teal-500/50" />
                      <span>{job.timeSlot?.time}</span>
                    </div>
                  </div>

                  {/* Assigned Info */}
                  {job.assignedTo && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/50 rounded-[20px] mb-2 border border-gray-100/50">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <FiUser className="w-4 h-4 text-teal-600" />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Assigned: <span className="text-gray-900">{job.assignedTo.name}</span>
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {['ACCEPTED', 'CONFIRMED'].includes(job.status?.toUpperCase()) && !job.assignedTo && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignToSelf(job.id);
                        }}
                        className="flex-1 py-3.5 rounded-2xl bg-white border border-black/[0.05] text-gray-900 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        Do It Myself
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/vendor/booking/${job.id}/assign-worker`);
                        }}
                        className="flex-1 py-3.5 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10 active:scale-95 transition-all"
                      >
                        Assign Worker
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
});

export default ActiveJobs;

