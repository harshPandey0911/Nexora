const Training = require('../../models/Training');

/**
 * Admin Training Controller
 * CRUD operations for training materials
 */

// Create training
exports.createTraining = async (req, res) => {
  try {
    console.log('[createTraining] Body:', JSON.stringify(req.body, null, 2));
    const training = await Training.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, data: training });
  } catch (error) {
    console.error('[createTraining] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all trainings
exports.getAllTrainings = async (req, res) => {
  try {
    const trainings = await Training.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: trainings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update training
exports.updateTraining = async (req, res) => {
  try {
    const training = await Training.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training not found' });
    }
    res.status(200).json({ success: true, data: training });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete training
exports.deleteTraining = async (req, res) => {
  try {
    const training = await Training.findByIdAndDelete(req.params.id);
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training not found' });
    }
    res.status(200).json({ success: true, message: 'Training deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get active training for vendor (Single active training assumed for now)
exports.getActiveTraining = async (req, res) => {
  try {
    const training = await Training.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!training) {
      return res.status(404).json({ success: false, message: 'No active training found' });
    }
    res.status(200).json({ success: true, data: training });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
