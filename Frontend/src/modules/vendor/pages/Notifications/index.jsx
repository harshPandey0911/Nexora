import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiX, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../../theme';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} from '../../services/notificationService';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [filter, setFilter] = useState('all'); // all, alerts, jobs, payments

  // Removed legacy layout effect background injection

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time updates (if implemented via window event)
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('vendorNotificationsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('vendorNotificationsUpdated', handleUpdate);
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      // Update local state to reflect change immediately
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark as read', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch (error) {
      console.error('Failed to mark all as read', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification removed');
    } catch (error) {
      console.error('Failed to delete notification', error);
      toast.error('Failed to delete');
    }
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = async () => {
    try {
      await deleteAllNotifications();
      setNotifications([]);
      toast.success('All notifications cleared');
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Failed to clear notifications', error);
      toast.error('Failed to clear');
      setShowClearConfirm(false);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;

    const type = (notif.type || '').toLowerCase();

    if (filter === 'payments') {
      return ['payment_', 'payout_', 'wallet_', 'refund_'].some(prefix => type.includes(prefix));
    }

    if (filter === 'jobs') {
      return ['booking_', 'job_', 'worker_', 'visit_', 'work_', 'journey_', 'vendor_'].some(prefix => type.includes(prefix));
    }

    if (filter === 'alerts') {
      return ['alert', 'general', 'security', 'account'].some(prefix => type.includes(prefix));
    }

    return type === filter;
  });

  const getNotificationIcon = (originalType) => {
    const type = (originalType || '').toLowerCase();

    if (['payment', 'refund', 'wallet', 'payout'].some(t => type.includes(t))) return '💰';
    if (['booking', 'job', 'work', 'visit', 'journey', 'vendor'].some(t => type.includes(t))) return '📋';
    if (['alert', 'general'].some(t => type.includes(t))) return '🔔';

    return '📢';
  };

  const getNotificationColor = (originalType) => {
    const type = (originalType || '').toLowerCase();

    if (['payment', 'refund', 'wallet', 'payout'].some(t => type.includes(t))) return '#10B981'; // Green
    if (['booking', 'job', 'work', 'visit', 'journey', 'vendor'].some(t => type.includes(t))) return '#3B82F6'; // Blue
    if (['alert', 'general'].some(t => type.includes(t))) return themeColors.button;

    return '#6B7280'; // Gray
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header - Admin Style */}
      <div className="bg-white p-5 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between text-gray-900 border border-gray-100 gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
            Alert Hub
          </h2>
          <p className="text-gray-500 text-[11px] font-medium mt-2">
            Consolidated intelligence and operational status updates
          </p>
        </div>
        <div className="flex items-center gap-4">
          {notifications.some(n => !n.read) && (
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-all"
              title="Mark all as read"
            >
              Clear All
            </motion.button>
          )}
          <div className="w-12 h-12 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center shadow-inner">
            <FiBell className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'jobs', label: 'Deployments' },
            { id: 'payments', label: 'Financials' },
            { id: 'alerts', label: 'Operational' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setFilter(option.id)}
              className={`
                px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap
                ${filter === option.id
                  ? 'bg-[#2874F0] text-white shadow-lg shadow-blue-200' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-4">
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2"
            >
              <FiTrash2 className="w-4 h-4" />
              Wipe Ledger
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-[48px] p-24 text-center border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-gray-100">
              <FiBell className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 uppercase tracking-tight">Sync Complete</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No pending alerts in the current matrix.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-12">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white rounded-[28px] p-6 border transition-all relative group hover:shadow-md ${
                  !notif.read ? 'border-blue-200 bg-blue-50/10 shadow-sm' : 'border-gray-100'
                }`}
              >
                {!notif.read && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 rounded-l-[28px]" />
                )}
                
                <div className="flex items-start gap-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: `${getNotificationColor(notif.type)}10` }}
                  >
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 pr-12 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className={`font-bold text-gray-800 text-lg tracking-tight truncate ${!notif.read ? 'text-blue-700' : 'opacity-70'}`}>
                        {notif.title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-4 mt-4">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {notif.time || (notif.createdAt && new Date(notif.createdAt).toLocaleString())}
                      </p>
                      
                      {(notif.action || notif.relatedType === 'booking' || notif.type === 'payout_requested') && (
                        <button
                          onClick={() => {
                            if (notif.relatedType === 'booking' && notif.relatedId) {
                              navigate(`/vendor/booking/${notif.relatedId}`);
                            } else if (notif.action === 'view_booking' && notif.bookingId) {
                              navigate(`/vendor/booking/${notif.bookingId}`);
                            } else if (notif.action === 'view_wallet') {
                              navigate('/vendor/wallet');
                            }
                          }}
                          className="text-[10px] font-black text-blue-600 flex items-center gap-1.5 uppercase tracking-widest hover:underline"
                        >
                          Execute Review
                          <FiCheck className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                      }}
                      className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-100"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-gray-100"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-10 shadow-2xl border border-gray-100 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100">
              <FiTrash2 className="w-10 h-10 text-rose-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 uppercase tracking-tight">Purge Records?</h3>
            <p className="text-sm text-gray-500 font-medium mb-10 leading-relaxed px-4">
              Permanent de-authorization of all operational alerts. This sequence cannot be aborted.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="py-4 rounded-2xl bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all"
              >
                Abort
              </button>
              <button
                onClick={confirmClearAll}
                className="py-4 rounded-2xl bg-rose-600 text-[10px] font-bold uppercase tracking-widest text-white shadow-xl shadow-rose-100 active:scale-95 transition-all"
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
