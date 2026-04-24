const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { getActiveTraining } = require('../../controllers/adminControllers/trainingController');

// Vendor training route
router.get('/active', getActiveTraining);

module.exports = router;
