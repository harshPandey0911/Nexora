import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiPlus, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { supportService } from '../../services/supportService';
import Header from '../../components/layout/Header';
import { vendorTheme } from '../../../../theme';
import toast from 'react-hot-toast';

const SupportList = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ subject: '', category: 'general', message: '' });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await supportService.getTickets();
      if (res.success) {
        setTickets(res.data);
      }
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await supportService.createTicket(formData);
      if (res.success) {
        toast.success('Ticket created successfully!');
        setShowCreateModal(false);
        setFormData({ subject: '', category: 'general', message: '' });
        fetchTickets();
      }
    } catch (error) {
      toast.error('Failed to create ticket');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'waiting_on_user': return 'bg-orange-100 text-orange-800';
      case 'resolved':
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <FiMessageSquare className="w-4 h-4 mr-1" />;
      case 'in_progress': return <FiClock className="w-4 h-4 mr-1" />;
      case 'waiting_on_user': return <FiAlertCircle className="w-4 h-4 mr-1" />;
      case 'resolved':
      case 'closed': return <FiCheckCircle className="w-4 h-4 mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Helpdesk & Support" showBack={true} />

      <div className="p-4">
        {/* Header Action */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Your Tickets</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 rounded-xl text-white font-medium shadow-md transition-transform active:scale-95"
            style={{ background: vendorTheme.primary }}
          >
            <FiPlus className="mr-2" /> New Ticket
          </button>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMessageSquare className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">No Support Tickets Yet</h3>
            <p className="text-gray-500 text-sm mb-6">If you need help with anything, feel free to raise a ticket.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 rounded-xl text-primary font-bold border-2 border-primary"
            >
              Raise a Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div
                key={ticket._id}
                onClick={() => navigate(`/vendor/support/${ticket._id}`)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-gray-400">#{ticket.ticketNumber}</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                    {ticket.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{ticket.subject}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                  {ticket.messages[0]?.message}
                </p>
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium">
                  <span className="uppercase tracking-wider">{ticket.category}</span>
                  <span>Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800">Create Support Ticket</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  >
                    <option value="general">General Inquiry</option>
                    <option value="payout">Payout Issue</option>
                    <option value="booking">Booking Issue</option>
                    <option value="account">Account/Profile</option>
                    <option value="technical">Technical Bug</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of the issue"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Please explain the issue in detail..."
                    rows="4"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                    required
                  ></textarea>
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-white font-bold shadow-md transition-transform active:scale-95"
                  style={{ background: vendorTheme.primary }}
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportList;
