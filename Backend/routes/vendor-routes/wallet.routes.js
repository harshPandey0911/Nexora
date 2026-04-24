const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');
const { getWallet, getTransactions, getWalletSummary, getEarningsAnalytics } = require('../../controllers/vendorControllers/vendorWalletController');

// Legacy Routes (keeping backward compatibility)
router.get('/wallet', authenticate, isVendor, getWallet);
router.get('/transactions', authenticate, isVendor, getTransactions);
router.get('/summary', authenticate, isVendor, getWalletSummary);

// Earnings Analytics Route
router.get('/earnings/analytics', authenticate, isVendor, getEarningsAnalytics);

module.exports = router;
