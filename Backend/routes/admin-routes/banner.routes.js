const express = require('express');
const router = express.Router();
const { getOfferBanners, addOfferBanner, updateOfferBanner, deleteOfferBanner } = require('../../controllers/adminControllers/adminBannerController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');

// All routes are protected and for admin
router.use(authenticate);
router.use(isAdmin);

router.route('/')
  .get(getOfferBanners)
  .post(addOfferBanner);

router.route('/:id')
  .put(updateOfferBanner)
  .delete(deleteOfferBanner);

module.exports = router;
