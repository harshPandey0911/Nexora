/**
 * Vendor Stats Helper
 * Handles calculation of Performance Score, Levels, and Commissions
 */

const calculateVendorPerformance = (vendor, settings) => {
  const { rating = 0, totalJobs = 0, completedJobs = 0, cancelledJobs = 0 } = vendor;

  // 1. User Rating Score (60%)
  // Convert 0-5 rating to 0-60 points
  const ratingScore = (rating / 5) * 60;

  // 2. Order Completion Score (30%)
  // Completion Rate = completed / total
  let completionScore = 0;
  if (totalJobs > 0) {
    const completionRate = completedJobs / totalJobs;
    completionScore = completionRate * 30;
  }

  // 3. Cancellation Penalty (-10%)
  // We start with 10 points and subtract based on cancellation rate
  // 0% cancellation = +10 points, 100% cancellation = 0 points
  let cancellationScore = 10; 
  if (totalJobs > 0) {
    const cancellationRate = cancelledJobs / totalJobs;
    cancellationScore = Math.max(0, 10 - (cancellationRate * 10));
  }

  // Total Performance Score (0-100)
  const performanceScore = Math.round(ratingScore + completionScore + cancellationScore);

  // 🏆 Vendor Levels
  // 80%+ → Level 1 (Top)
  // 50–80% → Level 2
  // Below 50% or New → Level 3
  let level = 3;
  if (performanceScore >= 80) level = 1;
  else if (performanceScore >= 50) level = 2;

  // 💸 Dynamic Commission Logic from Settings
  const levelKey = `level${level}`;
  const commissionRate = settings?.commissionRates?.[levelKey] || 15;

  return {
    performanceScore,
    level,
    commissionRate
  };
};

/**
 * Update Vendor Stats in DB
 * @param {string} vendorId 
 */
const updateVendorStats = async (vendorId) => {
  try {
    const Vendor = require('../models/Vendor');
    const Booking = require('../models/Booking');
    const Settings = require('../models/Settings');
    const mongoose = require('mongoose');

    const vId = new mongoose.Types.ObjectId(vendorId);

    // 0. Fetch Settings for commissions
    const settings = await Settings.findOne({ type: 'global' });

    // 1. Calculate Aggregate Ratings and Job Stats
    const stats = await Booking.aggregate([
      { $match: { vendorId: vId } },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          completedJobs: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledJobs: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    const vendorStats = stats[0] || { totalJobs: 0, completedJobs: 0, cancelledJobs: 0, avgRating: 0 };

    // 2. Fetch Vendor to get current profile
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return;

    // 3. Update Vendor job counts and rating first
    vendor.totalJobs = vendorStats.totalJobs;
    vendor.completedJobs = vendorStats.completedJobs;
    vendor.cancelledJobs = vendorStats.cancelledJobs;
    vendor.rating = vendorStats.avgRating || vendor.rating || 0;

    // 4. Calculate Performance
    const { performanceScore, level, commissionRate } = calculateVendorPerformance(vendor, settings);

    // 5. Save updated stats
    vendor.performanceScore = performanceScore;
    vendor.level = level;
    vendor.commissionRate = commissionRate;

    await vendor.save();
    console.log(`[VendorStats] Updated Vendor ${vendorId}: Score ${performanceScore}, Level ${level}, Comm ${commissionRate}%`);

    return vendor;
  } catch (error) {
    console.error('[VendorStats] Update failed:', error);
  }
};

module.exports = {
  calculateVendorPerformance,
  updateVendorStats
};

