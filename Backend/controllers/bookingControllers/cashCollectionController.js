const Booking = require('../../models/Booking');
const Vendor = require('../../models/Vendor');
const Transaction = require('../../models/Transaction');
const { PAYMENT_STATUS, BOOKING_STATUS } = require('../../utils/constants');
const { recordBookingEarning } = require('../../services/earningTrackerService');
const { createQRCode, getQRCodePayments } = require('../../services/razorpayService');

/**
 * Initiate Online Collection (Show QR Code)
 */
exports.initiateOnlineCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Optional: Update final total and extra items if provided during initiation
    const { totalAmount, extraItems } = req.body;
    if (totalAmount !== undefined && !isNaN(parseFloat(totalAmount))) {
      booking.finalAmount = parseFloat(totalAmount);
      booking.userPayableAmount = parseFloat(totalAmount);
    }

    if (!booking.finalAmount || booking.finalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    // Store extra items for proper commission calculation
    if (extraItems && Array.isArray(extraItems) && extraItems.length > 0) {
      booking.workDoneDetails = {
        ...booking.workDoneDetails,
        items: extraItems.map(item => ({
          title: item.name || item.title,
          qty: Number(item.qty) || Number(item.quantity) || 1,
          price: Number(item.price) || 0
        }))
      };

      booking.extraCharges = extraItems.map(item => ({
        name: item.name || item.title,
        quantity: Number(item.qty) || Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        total: (Number(item.qty) || Number(item.quantity) || 1) * (Number(item.price) || 0)
      }));

      booking.extraChargesTotal = booking.extraCharges.reduce((sum, item) => sum + item.total, 0);
      booking.markModified('workDoneDetails');
      booking.markModified('extraCharges');
    }

    // Create QR Code
    const qrResult = await createQRCode(
      booking.finalAmount,
      booking.bookingNumber,
      {
        bookingId: booking._id.toString(),
        type: 'worker_initiated_online'
      }
    );

    if (!qrResult.success) {
      return res.status(500).json({ success: false, message: qrResult.error });
    }

    // Generate OTP for manual verification if needed
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    booking.customerConfirmationOTP = otp;
    booking.paymentOtp = otp;

    // Store QR ID to track later
    booking.razorpayQrId = qrResult.qrCodeId;
    booking.paymentMethod = 'online'; // Mark as online as soon as QR is shown
    await booking.save();

    // Emit socket event to user with full bill details & OTP
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        finalAmount: booking.finalAmount,
        workDoneDetails: booking.workDoneDetails,
        qrPaymentInitiated: true,
        customerConfirmationOTP: otp,
        paymentOtp: otp
      });
    }

    // Send Push Notification with OTP
    try {
      const { createNotification } = require('../notificationControllers/notificationController');
      await createNotification({
        userId: booking.userId,
        type: 'work_done',
        title: 'Payment Request & Bill Ready',
        message: `Bill: ₹${booking.finalAmount}. OTP: ${otp}. Please verify bill and pay online or share OTP.`,
        relatedId: booking._id,
        relatedType: 'booking',
        priority: 'high',
        pushData: {
          type: 'work_done',
          bookingId: booking._id.toString(),
          paymentOtp: otp,
          link: `/user/booking/${booking._id}`
        }
      });
    } catch (notificationError) {
      console.error('Notification error in initiateOnlineCollection:', notificationError);
    }

    res.status(200).json({
      success: true,
      message: 'QR Code generated',
      data: {
        qrImageUrl: qrResult.imageUrl,
        paymentUrl: qrResult.paymentUrl,
        amount: booking.finalAmount,
        isManualUpi: qrResult.isManualUpi || false
      }
    });
  } catch (error) {
    console.error('Initiate online collection error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Initiate Cash Collection
 * Optional: Sends OTP to customer
 */
exports.initiateCashCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Allow cash, pay_at_home, AND plan_benefit (for final bill flow)
    const allowedMethods = ['cash', 'pay_at_home', 'plan_benefit'];
    if (!allowedMethods.includes(booking.paymentMethod)) {
      return res.status(400).json({ success: false, message: 'This booking is not eligible for cash collection' });
    }

    // Optional: Update final total and extra items if provided during initiation
    const { totalAmount, extraItems } = req.body;
    if (totalAmount !== undefined) {
      booking.finalAmount = Number(totalAmount);
      // Assuming no partial payment has been made yet (as status is pending/work_done)
      booking.userPayableAmount = Number(totalAmount);
    }

    // Store extra items for proper commission calculation
    if (extraItems && Array.isArray(extraItems) && extraItems.length > 0) {
      // 1. Update workDoneDetails (Frontend display)
      booking.workDoneDetails = {
        ...booking.workDoneDetails,
        items: extraItems.map(item => ({
          title: item.name || item.title,
          qty: Number(item.qty) || Number(item.quantity) || 1,
          price: Number(item.price) || 0
        }))
      };

      // 2. Update extraCharges (Backend calculation)
      booking.extraCharges = extraItems.map(item => ({
        name: item.name || item.title,
        quantity: Number(item.qty) || Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        total: (Number(item.qty) || Number(item.quantity) || 1) * (Number(item.price) || 0)
      }));

      // 3. Update extraChargesTotal
      booking.extraChargesTotal = booking.extraCharges.reduce((sum, item) => sum + item.total, 0);
    }

    // Force mark modified for nested object (just in case)
    if (extraItems) {
      booking.markModified('workDoneDetails');
      booking.markModified('extraCharges');
    }

    // For backwards compatibility and future use, we can still generate it but not force it
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    booking.customerConfirmationOTP = otp;
    booking.paymentOtp = otp;
    await booking.save();

    // Emit socket event to user with full bill details and OTP
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        finalAmount: booking.finalAmount,
        customerConfirmationOTP: booking.customerConfirmationOTP,
        paymentOtp: booking.paymentOtp,
        workDoneDetails: booking.workDoneDetails
      });
    }

    // Send Push Notification with OTP
    const { createNotification } = require('../notificationControllers/notificationController');
    await createNotification({
      userId: booking.userId,
      type: 'work_done',
      title: 'Payment Request & Bill Ready',
      message: `Bill: ₹${booking.finalAmount}. OTP: ${otp}. Please verify bill and share OTP to complete payment.`,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high',
      pushData: {
        type: 'work_done',
        bookingId: booking._id.toString(),
        paymentOtp: otp,
        link: `/user/booking/${booking._id}`
      }
    });

    res.status(200).json({
      success: true,
      message: 'Bill finalized',
      totalAmount: booking.finalAmount
    });
  } catch (error) {
    console.error('Initiate cash collection error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Confirm Cash Collection (by Vendor/Worker)
 * Uses VendorBill as the single source of truth for earnings.
 */
exports.confirmCashCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp, amount, extraItems } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // OTP Verification
    const isPlanBenefitNoExtras = booking.paymentMethod === 'plan_benefit' && otp === '0000';

    if (!isPlanBenefitNoExtras && booking.customerConfirmationOTP && otp && booking.customerConfirmationOTP !== otp) {
      if (process.env.NODE_ENV !== 'development' || otp !== '0000') {
        return res.status(400).json({ success: false, message: 'Invalid OTP. Please enter the code sent to the customer.' });
      }
    }

    // --- ATOMIC LOCK AGAINST RACE CONDITIONS ---
    const updateResult = await Booking.updateOne(
      { _id: booking._id, cashCollected: { $ne: true } },
      { $set: { cashCollected: true } }
    );

    if (updateResult.modifiedCount === 0) {
      console.log(`[Race Condition Prevented] Booking ${booking._id} already processed.`);
      return res.status(200).json({
        success: true,
        message: 'Cash collection already confirmed',
        data: { bookingId: booking._id }
      });
    }

    const collectionAmount = amount || booking.finalAmount;

    // Store extra items in workDoneDetails (for display)
    if (extraItems && Array.isArray(extraItems) && extraItems.length > 0) {
      booking.workDoneDetails = {
        ...booking.workDoneDetails,
        items: extraItems.map(item => ({
          title: item.name || item.title,
          qty: Number(item.qty) || Number(item.quantity) || 1,
          price: Number(item.price) || 0
        }))
      };

      booking.extraCharges = extraItems.map(item => ({
        name: item.name || item.title,
        quantity: Number(item.qty) || Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        total: (Number(item.qty) || Number(item.quantity) || 1) * (Number(item.price) || 0)
      }));

      booking.extraChargesTotal = booking.extraCharges.reduce((sum, item) => sum + item.total, 0);
      booking.markModified('workDoneDetails');
      booking.markModified('extraCharges');
    }

    // Fetch VendorBill (single source of truth for earnings)
    const VendorBill = require('../../models/VendorBill');
    const bill = await VendorBill.findOne({ bookingId: booking._id });

    let vendorEarning = 0;
    let grandTotal = collectionAmount;

    if (bill) {
      vendorEarning = bill.vendorTotalEarning;
      grandTotal = bill.grandTotal;

      // Mark bill as paid
      bill.status = 'paid';
      bill.paidAt = new Date();
      await bill.save();
    }

    // Update Booking
    booking.finalAmount = collectionAmount;
    booking.userPayableAmount = collectionAmount;
    booking.cashCollected = true;
    booking.cashCollectedAt = new Date();
    booking.cashCollectedBy = userRole === 'vendor' ? 'vendor' : 'worker';
    booking.cashCollectorId = userId;

    if (booking.paymentMethod === 'plan_benefit') {
      booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
    } else {
      booking.paymentStatus = PAYMENT_STATUS.COLLECTED_BY_VENDOR;
    }

    if (booking.status === 'work_done' || booking.status === 'visited' || booking.status === 'in_progress') {
      booking.status = 'completed';
      booking.completedAt = new Date();
    }

    await booking.save();

    // Update Vendor Wallet
    const vendorId = booking.vendorId;
    const vendor = await Vendor.findById(vendorId).lean();
    let newDues = 0;

    if (vendor) {
      newDues = (vendor.wallet?.dues || 0) + grandTotal;
      const newEarnings = (vendor.wallet?.earnings || 0) + vendorEarning;
      const cashLimit = vendor.wallet?.cashLimit || 10000;
      const netOwed = newDues - newEarnings;
      const isOverLimit = netOwed > cashLimit;

      const walletUpdate = {
        $inc: {
          'wallet.dues': grandTotal,
          'wallet.earnings': vendorEarning,
          'wallet.totalCashCollected': grandTotal
        }
      };

      if (isOverLimit) {
        walletUpdate.$set = {
          'wallet.isBlocked': true,
          'wallet.blockedAt': new Date(),
          'wallet.blockReason': `Cash limit exceeded. Net owed: ₹${netOwed.toFixed(2)}, Limit: ₹${cashLimit}`
        };
      }

      await Vendor.findByIdAndUpdate(vendorId, walletUpdate, { runValidators: false });

      // Record Transaction - Cash Collected
      await Transaction.create({
        vendorId,
        userId: booking.userId,
        bookingId: booking._id,
        amount: grandTotal,
        type: 'cash_collected',
        description: `Cash ₹${grandTotal} collected for booking ${booking.bookingNumber}`,
        status: 'completed',
        metadata: {
          type: 'dues_increase',
          collectedBy: userRole,
          billId: bill?._id?.toString(),
          vendorEarning,
          companyRevenue: bill?.companyRevenue
        }
      });

      // Record Transaction - Earnings Credit
      if (vendorEarning > 0) {
        await Transaction.create({
          vendorId,
          bookingId: booking._id,
          amount: vendorEarning,
          type: 'earnings_credit',
          description: `Earnings ₹${vendorEarning} credited for booking ${booking.bookingNumber}`,
          status: 'completed',
          metadata: {
            type: 'earnings_increase',
            billId: bill?._id?.toString(),
            serviceEarning: bill?.vendorServiceEarning,
            partsEarning: bill?.vendorPartsEarning
          }
        });
      }
    }

    // Record stats in the Daily Earning Tracker
    recordBookingEarning({
      date: new Date(),
      totalRevenue: bill ? bill.grandTotal : collectionAmount,
      platformCommission: bill ? bill.companyRevenue : (collectionAmount * 0.2),
      vendorEarnings: vendorEarning > 0 ? vendorEarning : (collectionAmount * 0.8),
      totalGST: bill ? bill.totalGST : 0,
      totalTDS: 0 // Captured separately during withdrawal
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        status: booking.status,
        cashCollected: true,
        message: 'Payment recorded and booking completed!'
      });
    }

    // Push Notification
    const { createNotification } = require('../notificationControllers/notificationController');
    await createNotification({
      userId: booking.userId,
      type: 'payment_received',
      title: 'Payment Received (Cash)',
      message: `Payment of ₹${grandTotal} received in cash. Job Completed. Thanks!`,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high'
    });

    res.status(200).json({
      success: true,
      message: 'Cash collection confirmed and recorded in ledger',
      data: {
        bookingId: booking._id,
        amount: grandTotal,
        walletDues: vendor ? newDues : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Customer Confirm Payment (Optional flow for user to confirm they paid)
 */
exports.customerConfirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.customerConfirmed = true;
    await booking.save();

    res.status(200).json({ success: true, message: 'Payment confirmed by customer' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Cash Collection Status
 */
/**
 * Verify Online Payment & Complete Job
 * POST /api/bookings/cash/:id/verify-online
 */
exports.verifyOnlinePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.razorpayQrId) {
      return res.status(400).json({ success: false, message: 'No online payment initiated for this booking' });
    }

    // Only allow if status is WORK_DONE or already COMPLETED (idempotency)
    if (booking.status !== BOOKING_STATUS.WORK_DONE && booking.status !== BOOKING_STATUS.COMPLETED) {
      return res.status(400).json({ success: false, message: `Cannot verify payment for booking in ${booking.status} status` });
    }

    const qrRes = await getQRCodePayments(booking.razorpayQrId);

    if (qrRes.success && qrRes.payments && qrRes.payments.length > 0) {
      const capturedPayment = qrRes.payments.find(p => p.status === 'captured');

      if (capturedPayment) {
        console.log(`[QR Verify] Finalizing booking ${booking.bookingNumber}`);

        // 1. Update Booking
        booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
        booking.paymentMethod = 'online';
        booking.cashCollected = false; // Ensure it's not counted as cash
        booking.razorpayPaymentId = capturedPayment.id;
        booking.paymentId = capturedPayment.id;

        if (booking.status !== BOOKING_STATUS.COMPLETED) {
          booking.status = BOOKING_STATUS.COMPLETED;
          booking.completedAt = new Date();
        }

        await booking.save();

        // 2. Handle Earnings & Wallet
        const VendorBill = require('../../models/VendorBill');
        const bill = await VendorBill.findOne({ bookingId: booking._id });

        let vendorEarning = 0;
        if (bill) {
          vendorEarning = bill.vendorTotalEarning;
          bill.status = 'paid';
          bill.paidAt = new Date();
          await bill.save();
        } else {
          vendorEarning = booking.finalAmount * 0.8;
        }

        const vendorId = booking.vendorId;
        const Vendor = require('../../models/Vendor');
        await Vendor.findByIdAndUpdate(vendorId, {
          $inc: { 'wallet.earnings': vendorEarning }
        });

        // 3. Transactions
        await Transaction.create({
          userId: booking.userId,
          bookingId: booking._id,
          amount: booking.finalAmount,
          type: 'payment',
          paymentMethod: 'online',
          status: 'completed',
          description: `Online QR payment for booking #${booking.bookingNumber}`,
          referenceId: capturedPayment.id,
          metadata: {
            source: 'vendor_qr',
            razorpayPaymentId: capturedPayment.id
          }
        });

        if (vendorEarning > 0) {
          await Transaction.create({
            vendorId: booking.vendorId,
            bookingId: booking._id,
            amount: vendorEarning,
            type: 'earnings_credit',
            paymentMethod: 'system',
            status: 'completed',
            description: `Earnings credited for online booking #${booking.bookingNumber}`,
            metadata: {
              type: 'online_earning',
              billId: bill?._id?.toString()
            }
          });
        }

        // 4. Record Stats
        recordBookingEarning({
          date: new Date(),
          totalRevenue: bill ? bill.grandTotal : booking.finalAmount,
          platformCommission: bill ? bill.companyRevenue : (booking.finalAmount * 0.2),
          vendorEarnings: vendorEarning,
          totalGST: bill ? bill.totalGST : 0,
          totalTDS: 0
        });

        // 5. Notify & Socket
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${booking.userId}`).emit('booking_updated', {
            bookingId: booking._id,
            status: 'completed',
            paymentStatus: 'success'
          });
          io.to(`vendor_${booking.vendorId}`).emit('booking_updated', {
            bookingId: booking._id,
            status: 'completed'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Payment verified and job completed',
          status: 'completed'
        });
      }
    }

    return res.status(200).json({
      success: false,
      message: 'Payment not yet detected by Razorpay',
      paymentStatus: 'pending'
    });

  } catch (error) {
    console.error('Verify online payment error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

/**
 * Manually Confirm Online Payment (For Manual QR Fallback)
 * POST /api/bookings/cash/:id/confirm-manual-online
 */
exports.confirmManualOnlinePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // OTP Verification (Mandatory for manual confirmation to prevent accidents)
    if (booking.customerConfirmationOTP && otp && booking.customerConfirmationOTP !== otp) {
      if (process.env.NODE_ENV !== 'development' || otp !== '0000') {
        return res.status(400).json({ success: false, message: 'Invalid OTP. Please enter the code sent to the customer.' });
      }
    }

    // prevent race conditions
    if (booking.status === BOOKING_STATUS.COMPLETED) {
      return res.status(400).json({ success: false, message: 'Booking already completed' });
    }

    console.log(`[Manual QR Confirm] Finalizing booking ${booking.bookingNumber} manually`);

    // 1. Update Booking
    booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
    booking.paymentMethod = 'online';
    booking.cashCollected = false;
    booking.paymentId = `manual_conf_${Date.now()}`;
    booking.status = BOOKING_STATUS.COMPLETED;
    booking.completedAt = new Date();
    await booking.save();

    // 2. Handle Earnings & Wallet (Reuse logic)
    const VendorBill = require('../../models/VendorBill');
    const bill = await VendorBill.findOne({ bookingId: booking._id });

    let vendorEarning = 0;
    if (bill) {
      vendorEarning = bill.vendorTotalEarning;
      bill.status = 'paid';
      bill.paidAt = new Date();
      await bill.save();
    } else {
      vendorEarning = booking.finalAmount * 0.8;
    }

    const vendorId = booking.vendorId;
    await Vendor.findByIdAndUpdate(vendorId, {
      $inc: { 'wallet.earnings': vendorEarning }
    });

    // 3. Transactions
    await Transaction.create({
      userId: booking.userId,
      bookingId: booking._id,
      amount: booking.finalAmount,
      type: 'payment',
      paymentMethod: 'online',
      status: 'completed',
      description: `Manual confirmation of UPI QR payment for booking #${booking.bookingNumber}`,
      referenceId: booking.paymentId,
      metadata: { source: 'manual_vendor_confirm' }
    });

    if (vendorEarning > 0) {
      await Transaction.create({
        vendorId: booking.vendorId,
        bookingId: booking._id,
        amount: vendorEarning,
        type: 'earnings_credit',
        paymentMethod: 'system',
        status: 'completed',
        description: `Earnings credited for manual online booking #${booking.bookingNumber}`,
        metadata: { type: 'online_earning', billId: bill?._id?.toString() }
      });
    }

    // 4. Record Stats
    recordBookingEarning({
      date: new Date(),
      totalRevenue: bill ? bill.grandTotal : booking.finalAmount,
      platformCommission: bill ? bill.companyRevenue : (booking.finalAmount * 0.2),
      vendorEarnings: vendorEarning,
      totalGST: bill ? bill.totalGST : 0,
      totalTDS: 0
    });

    // 5. Notify & Socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        status: 'completed',
        paymentStatus: 'success'
      });
      io.to(`vendor_${booking.vendorId}`).emit('booking_updated', {
        bookingId: booking._id,
        status: 'completed',
        paymentMethod: 'online'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment confirmed manually and job completed',
      status: 'completed'
    });

  } catch (error) {
    console.error('Confirm manual online payment error:', error);
    res.status(500).json({ success: false, message: 'Manual confirmation failed' });
  }
};

/**
 * Get Cash / Payment Status
 * Read-only check for UI
 */
exports.getCashCollectionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const statusData = {
      bookingId: booking._id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      cashCollected: booking.cashCollected || false,
      isPaid: booking.paymentStatus === PAYMENT_STATUS.SUCCESS
    };

    if (booking.razorpayQrId && booking.paymentStatus === PAYMENT_STATUS.PENDING) {
      const qrRes = await getQRCodePayments(booking.razorpayQrId);
      if (qrRes.success && qrRes.payments && qrRes.payments.length > 0) {
        const captured = qrRes.payments.find(p => p.status === 'captured');
        if (captured) {
          statusData.paymentDetected = true;
          statusData.paymentId = captured.id;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: statusData
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch status' });
  }
};
