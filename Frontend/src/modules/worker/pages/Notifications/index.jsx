import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiBriefcase, FiChevronRight, FiTrash2, FiX, FiInfo, FiZap } from 'react-icons/fi';
import { workerTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import workerService from '../../../../services/workerService';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await workerService.getNotifications();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('workerNotificationsUpdated', handleUpdate);
    return () => window.removeEventListener('workerNotificationsUpdated', handleUpdate);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      const response = await workerService.markNotificationAsRead(id);
      if (response.success) {
        setNotifications(notifications.map(n =>
          n._id === id ? { ...n, isRead: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await workerService.markAllNotificationsAsRead();
      if (response.success) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        toast.success('All marked as read');
      }
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      const response = await workerService.deleteNotification(id);
      if (response.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
        toast.success('Notification removed');
      }
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const confirmClearAll = async () => {
    try {
      const response = await workerService.deleteAllNotifications();
      if (response.success) {
        setNotifications([]);
        toast.success('All notifications cleared');
      }
      setShowClearConfirm(false);
    } catch (error) {
      toast.error('Failed to clear');
      setShowClearConfirm(false);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'job') return notif.type?.toLowerCase().includes('job') || notif.type?.toLowerCase().includes('booking');
    if (filter === 'payment') return notif.type?.toLowerCase().includes('payment');
    return true;
  });

  const getNotificationIcon = (type = '') => {
    const t = type.toLowerCase();
    if (t.includes('job') || t.includes('booking')) return <FiZap className="w-5 h-5" />;
    if (t.includes('payment')) return <span className="text-lg font-[1000]">₹</span>;
    return <FiBell className="w-5 h-5" />;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen pb-24 bg-white relative">
      {/* Premium Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 0% 0%, rgba(13, 148, 136, 0.05) 0%, transparent 70%),
              radial-gradient(at 100% 0%, rgba(13, 70, 60, 0.03) 0%, transparent 70%),
              #FFFFFF
            `
          }}
        />
      </div>

      <Header title="Notifications" showBack={true} />

      <main className="px-5 py-6 relative z-10">
        {/* Modern Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all', label: 'All' },
            { id: 'job', label: 'Jobs' },
            { id: 'payment', label: 'Payments' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={`px-6 py-2.5 rounded-full font-black text-[11px] uppercase tracking-wider transition-all duration-300 ${
                filter === opt.id
                  ? 'bg-[#0D463C] text-white shadow-lg shadow-[#0D463C]/20'
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Header Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-xl font-[1000] text-gray-900 tracking-tight">Recent Updates</h2>
            <div className="flex items-center gap-4">
              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-black uppercase tracking-[0.15em] text-teal-600"
                >
                  Mark All Read
                </button>
              )}
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-[10px] font-black uppercase tracking-[0.15em] text-red-400"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 w-full bg-gray-50 rounded-[32px] animate-pulse" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mb-6 text-teal-600">
              <FiBell className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-[1000] text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-sm text-gray-400 font-medium max-w-[200px]">No new notifications to show right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notif) => {
                const isUnread = !notif.isRead;

                return (
                  <motion.div
                    layout
                    key={notif._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`relative bg-white rounded-[32px] p-5 border transition-all duration-300 ${
                      isUnread 
                        ? 'shadow-xl shadow-teal-900/5 border-teal-100' 
                        : 'shadow-sm border-gray-100 opacity-80'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          isUnread ? 'bg-[#0D463C] text-white' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {getNotificationIcon(notif.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-[15px] ${isUnread ? 'font-[1000] text-gray-900' : 'font-bold text-gray-500'}`}>
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-tight">
                            {formatTime(notif.createdAt)}
                          </span>
                        </div>
                        
                        <p className={`text-xs leading-relaxed mb-4 ${isUnread ? 'text-gray-600' : 'text-gray-400 font-medium'}`}>
                          {notif.message}
                        </p>

                        <div className="flex items-center justify-between">
                          {notif.relatedId && (
                            <button
                              onClick={() => navigate(`/worker/job/${notif.relatedId}`)}
                              className="text-[10px] font-black uppercase tracking-widest text-[#0D463C] flex items-center gap-1 bg-teal-50 px-3 py-1.5 rounded-full"
                            >
                              View Details <FiChevronRight />
                            </button>
                          )}
                          
                          {isUnread && (
                            <button
                              onClick={() => handleMarkAsRead(notif._id)}
                              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-teal-600 transition-colors"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete Action */}
                    <button
                      onClick={(e) => handleDelete(e, notif._id)}
                      className="absolute top-5 right-5 p-2 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <FiTrash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-2xl font-[1000] text-gray-900 mb-2">Clear All?</h3>
              <p className="text-sm text-gray-400 font-medium mb-8">This will permanently remove all your notifications.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-gray-400 bg-gray-50 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAll}
                className="py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-red-400 shadow-xl shadow-red-400/20 active:scale-95 transition-all"
              >
                Yes, Clear
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
