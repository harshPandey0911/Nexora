import api from '../../../services/api';

/**
 * Vendor Services Portfolio Service
 */
const vendorService = {
  /**
   * Get all services/categories assigned to the vendor
   */
  getMyServices: async () => {
    try {
      const response = await api.get('/vendors/my-services');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addVendorCategory: async (data) => {
    try {
      const response = await api.post('/vendors/add-category', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addVendorService: async (data) => {
    try {
      const response = await api.post('/vendors/add-service', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMyCustomContent: async () => {
    try {
      const response = await api.get('/vendors/my-custom-content');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  removeService: async (categoryId) => {
    try {
      const response = await api.delete(`/vendors/services/${categoryId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default vendorService;
