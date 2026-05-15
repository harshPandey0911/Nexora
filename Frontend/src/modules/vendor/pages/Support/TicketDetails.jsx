import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSend, FiClock, FiCheckCircle } from 'react-icons/fi';
import { supportService } from '../../services/supportService';
import Header from '../../components/layout/Header';
import { vendorTheme } from '../../../../theme';
import toast from 'react-hot-toast';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket]);

  const fetchTicketDetails = async () => {
    try {
      const res = await supportService.getTicketDetails(id);
      if (res.success) {
        setTicket(res.ticket);
      }
    } catch (error) {
      toast.error('Failed to load ticket details');
      navigate('/vendor/support');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      setSending(true);
      const res = await supportService.replyToTicket(id, { message: replyMessage });
      if (res.success) {
        setTicket(res.ticket);
        setReplyMessage('');
      }
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Syncing Transmission...</span>
      </div>
    );
  }

  if (!ticket) return null;

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <div className="min-h-screen pb-10 relative flex flex-col bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 lg:px-10 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-white transition-all shadow-sm active:scale-90"
          >
            <FiClock className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">Ticket #{ticket.ticketNumber}</h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Operational Support Channel</p>
          </div>
        </div>
        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border ${
          isClosed 
          ? 'bg-gray-100 text-gray-500 border-gray-200' 
          : 'bg-blue-50 text-blue-600 border-blue-100'
        }`}>
          {ticket.status.replace('_', ' ')}
        </span>
      </header>

      {/* Ticket Info Banner */}
      <div className="bg-white/80 backdrop-blur-md px-6 lg:px-10 py-4 border-b border-gray-100 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <h2 className="font-bold text-gray-800 text-sm uppercase tracking-tight">{ticket.subject}</h2>
          <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 w-fit">
            Category: {ticket.category}
          </span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 pb-40 relative z-0">
        {ticket.messages.map((msg, index) => {
          const isVendor = msg.sender === 'vendor';
          return (
            <div key={index} className={`flex ${isVendor ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] rounded-[32px] p-6 shadow-sm border ${isVendor
                  ? 'bg-blue-600 text-white rounded-tr-none border-blue-500 shadow-blue-500/10'
                  : 'bg-white border-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                {!isVendor && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Support Representative</p>
                  </div>
                )}
                <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                <div className={`text-[9px] font-black mt-4 uppercase tracking-widest ${isVendor ? 'text-blue-100 text-right' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isClosed ? (
        <div className="fixed bottom-0 left-20 lg:left-[278px] right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-6 z-50 transition-all duration-300">
          <form onSubmit={handleReply} className="max-w-4xl mx-auto flex gap-4 items-end">
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your response here..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner outline-none resize-none max-h-32"
              rows="1"
              style={{ minHeight: '56px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            <button
              type="submit"
              disabled={sending || !replyMessage.trim()}
              className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/30 disabled:opacity-20 transition-all active:scale-90 hover:bg-blue-700"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <FiSend className="w-5 h-5 ml-0.5" />
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="fixed bottom-0 left-20 lg:left-[278px] right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-8 text-center z-50">
          <div className="flex items-center justify-center text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">
            <FiCheckCircle className="mr-3 w-5 h-5 text-emerald-500" />
            Support Case Closed: Marked as {ticket.status}.
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetails;
