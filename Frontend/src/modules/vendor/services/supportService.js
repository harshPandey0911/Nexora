import api from '../../../services/api';

export const supportService = {
  getTickets: async (params) => {
    try {
      const response = await api.get('/vendors/support/tickets', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  },

  getTicketDetails: async (id) => {
    try {
      const response = await api.get(`/vendors/support/tickets/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      throw error;
    }
  },

  createTicket: async (data) => {
    try {
      const response = await api.post('/vendors/support/tickets', data);
      return response.data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  replyToTicket: async (id, messageData) => {
    try {
      const response = await api.post(`/vendors/support/tickets/${id}/reply`, messageData);
      return response.data;
    } catch (error) {
      console.error('Error replying to ticket:', error);
      throw error;
    }
  }
};
