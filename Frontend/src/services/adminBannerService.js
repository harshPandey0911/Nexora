import API from './api';

const adminBannerService = {
  getBanners: async () => {
    try {
      const response = await API.get('/admin/banners');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addBanner: async (data) => {
    try {
      const response = await API.post('/admin/banners', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateBanner: async (id, data) => {
    try {
      const response = await API.put(`/admin/banners/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteBanner: async (id) => {
    try {
      const response = await API.delete(`/admin/banners/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default adminBannerService;
