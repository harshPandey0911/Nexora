import api from '../../../services/api';

export const supportService = {
  getAllTickets: async (params) => {
    try {
      const response = await api.get('/admin/support/tickets', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching admin tickets:', error);
      throw error;
    }
  },

  getTicketDetails: async (id) => {
    try {
      const response = await api.get(`/admin/support/tickets/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      throw error;
    }
  },

  replyToTicket: async (id, data) => {
    try {
      const response = await api.post(`/admin/support/tickets/${id}/reply`, data);
      return response.data;
    } catch (error) {
      console.error('Error replying to ticket:', error);
      throw error;
    }
  },

  updateTicketStatus: async (id, status) => {
    try {
      const response = await api.put(`/admin/support/tickets/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  }
};
