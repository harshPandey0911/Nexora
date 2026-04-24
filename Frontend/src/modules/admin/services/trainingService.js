import api from '../../../services/api';

/**
 * Admin Training Management Service
 */
export const getAllTrainings = async () => {
  try {
    const response = await api.get('/admin/training');
    return response.data;
  } catch (error) {
    console.error('Error fetching trainings:', error);
    throw error;
  }
};

export const createTraining = async (trainingData) => {
  try {
    const response = await api.post('/admin/training', trainingData);
    return response.data;
  } catch (error) {
    console.error('Error creating training:', error);
    throw error;
  }
};

export const updateTraining = async (id, trainingData) => {
  try {
    const response = await api.put(`/admin/training/${id}`, trainingData);
    return response.data;
  } catch (error) {
    console.error('Error updating training:', error);
    throw error;
  }
};

export const deleteTraining = async (id) => {
  try {
    const response = await api.delete(`/admin/training/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting training:', error);
    throw error;
  }
};
