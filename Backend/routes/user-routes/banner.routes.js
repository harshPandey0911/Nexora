const express = require('express');
const router = express.Router();
const { getActiveBanners } = require('../../controllers/userControllers/userBannerController');

router.get('/active', getActiveBanners);

module.exports = router;
