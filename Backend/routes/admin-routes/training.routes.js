const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { 
  createTraining, 
  getAllTrainings, 
  updateTraining, 
  deleteTraining 
} = require('../../controllers/adminControllers/trainingController');

// All training routes require admin auth
router.post('/', authenticate, createTraining);
router.get('/', authenticate, getAllTrainings);
router.put('/:id', authenticate, updateTraining);
router.delete('/:id', authenticate, deleteTraining);

module.exports = router;
