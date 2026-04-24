import api from '../../../services/api';

/**
 * Vendor Training Service
 */
export const getActiveTraining = async () => {
  try {
    const response = await api.get('/vendors/training/active');
    return response.data;
  } catch (error) {
    console.error('Error fetching active training:', error);
    throw error;
  }
};
