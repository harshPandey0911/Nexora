import API from './api';

const userBannerService = {
  getActiveBanners: async () => {
    try {
      const response = await API.get('/public/banners/active');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default userBannerService;
