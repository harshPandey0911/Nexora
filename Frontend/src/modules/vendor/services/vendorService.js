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
  }
};

export default vendorService;
