import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiMapPin, FiClock, FiUser, FiSearch, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../../theme';
import { getBookings, assignWorker as assignWorkerApi, acceptBooking, rejectBooking } from '../../services/bookingService';
import { ConfirmDialog } from '../../components/common';

const ActiveJobs = memo(() => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState(() => {
    const cached = localStorage.getItem('vendorJobsList');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('in_progress');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

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
      const mappedJobs = jobsData
        .filter(job => !job.offeringType || job.offeringType === 'SERVICE')
        .map(job => ({
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
        offeringType: job.offeringType || 'SERVICE',
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
            loadJobs(filter, searchQuery);
          }
        } catch (error) {
          console.error("Error assigning to self:", error);
          toast.error("Failed to assign to yourself");
        }
      }
    });
  };

  const handleAcceptJob = async (jobId) => {
    try {
      const response = await acceptBooking(jobId);
      if (response && response.success) {
        toast.success("Job accepted successfully!");
        loadJobs(filter, searchQuery);
        window.dispatchEvent(new Event('vendorJobsUpdated'));
      }
    } catch (error) {
      console.error("Error accepting job:", error);
      toast.error(error.response?.data?.message || "Failed to accept job");
    }
  };

  const handleRejectJob = async (jobId) => {
    try {
      const response = await rejectBooking(jobId, 'Rejected from Service Bookings list');
      if (response && response.success) {
        toast.success("Job skipped");
        loadJobs(filter, searchQuery);
        window.dispatchEvent(new Event('vendorJobsUpdated'));
      }
    } catch (error) {
      console.error("Error rejecting job:", error);
      toast.error("Failed to skip job");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header - Admin Style */}
      <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between text-gray-900 border border-gray-100 gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
            Service Bookings
          </h2>
          <p className="text-gray-500 font-medium mt-2">
            Monitor and manage your active and pending service deployments
          </p>
        </div>
        <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shadow-inner">
          <FiBriefcase className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Search Bar - Clean Admin Style */}
      <div className="relative group max-w-2xl">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text"
          placeholder="Search bookings, customers, or locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all shadow-sm"
        />
      </div>

      {/* Navigation Tabs - Admin Style */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto scrollbar-hide">
        {[
          { id: 'all', label: 'All Streams' },
          { id: 'pending', label: 'New Requests' },
          { id: 'assigned', label: 'Assigned' },
          { id: 'in_progress', label: 'Active' },
          { id: 'completed', label: 'Archived' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap
              ${filter === tab.id
                ? "bg-[#2874F0] text-white shadow-lg shadow-blue-200 translate-y-[-1px]"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-8 border border-gray-100 animate-pulse h-48 shadow-sm" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-[32px] p-20 text-center border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiBriefcase className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Bookings Found</h3>
          <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">
            {searchQuery ? 'Your search query didn\'t match any records.' : 'You don\'t have any active bookings in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 pb-12">
          {filteredJobs.map((job) => {
            const isCompleted = job.status?.toLowerCase() === 'completed';
            const isPending = job.status?.toLowerCase() === 'pending' || job.status?.toLowerCase() === 'requested';

            return (
              <div 
                key={job.id} 
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between h-full relative overflow-hidden"
                onClick={() => navigate(`/vendor/booking/${job.id}`)}
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-full h-1 ${isPending ? 'bg-orange-400' : isCompleted ? 'bg-green-400' : 'bg-blue-500'}`} />
                
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <FiBriefcase className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-gray-800">₹{job.price}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg mt-1 inline-block ${
                        isPending ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                        isCompleted ? 'bg-green-50 text-green-600 border border-green-100' : 
                        'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-gray-800 uppercase truncate mb-2 group-hover:text-blue-600 transition-colors">
                    {job.serviceType}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-500">
                      <FiUser className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-semibold">{job.user.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                      <FiMapPin className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-medium truncate">{job.location.address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                      <FiClock className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold text-gray-600 uppercase">{job.timeSlot.date} • {job.timeSlot.time}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
                  {isPending ? (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAcceptJob(job.id); }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-95"
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRejectJob(job.id); }}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold py-3 rounded-xl transition-all active:scale-95"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {job.assignedTo ? `Assigned: ${job.assignedTo.name}` : 'Ready for Assignment'}
                        </p>
                      </div>
                      <FiChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
});

export default ActiveJobs;
