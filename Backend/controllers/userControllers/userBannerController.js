const OfferBanner = require('../../models/OfferBanner');

/**
 * Get active offer banners for users
 */
const getActiveBanners = async (req, res) => {
  try {
    const banners = await OfferBanner.find({ isActive: true }).sort({ priority: 1, createdAt: -1 });
    res.status(200).json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Error fetching active banners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners'
    });
  }
};

module.exports = {
  getActiveBanners
};
