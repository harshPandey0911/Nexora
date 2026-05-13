import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiMapPin, FiClock, FiDollarSign, FiUser, FiPhone, FiNavigation, FiArrowRight, FiEdit, FiCheckCircle, FiCreditCard, FiX, FiCheck, FiTool, FiXCircle, FiAward, FiPackage, FiAlertCircle, FiBriefcase, FiUsers, FiActivity } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import {
  getBookingById,
  updateBookingStatus,
  assignWorker as assignWorkerApi,
  startSelfJob,
  vendorReached,
  verifySelfVisit,
  completeSelfJob
} from '../../services/bookingService';
import vendorBillService from '../../../../services/vendorBillService';
import { CashCollectionModal, ConfirmDialog, WorkerPaymentModal, OtpVerificationModal } from '../../components/common';
import VisitVerificationModal from '../../components/common/VisitVerificationModal';
// Import shared WorkCompletionModal from worker directory or move to shared
import { WorkCompletionModal } from '../../../worker/components/common';
// import BillingModal from '../../components/bookings/BillingModal'; // Consumed by page now
import vendorWalletService from '../../../../services/vendorWalletService';
import { toast } from 'react-hot-toast';
import { useAppNotifications } from '../../../../hooks/useAppNotifications';
import { useLocationTracking } from '../../../../hooks/useLocationTracking';

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPayWorkerModalOpen, setIsPayWorkerModalOpen] = useState(false);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isWorkDoneModalOpen, setIsWorkDoneModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);


  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'warning'
  });

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const bgStyle = '#F8FAFC';

    if (html) html.style.background = bgStyle;
    if (body) body.style.background = bgStyle;
    if (root) root.style.background = bgStyle;

    return () => {
      if (html) html.style.background = '';
      if (body) body.style.background = '';
      if (root) root.style.background = '';
    };
  }, []);

  const loadBooking = async () => {
    try {
      setLoading(true);
      let billData = null;

      const [bookingRes, billRes] = await Promise.all([
        getBookingById(id),
        vendorBillService.getBill(id).catch(() => ({ success: false }))
      ]);

      const apiData = bookingRes.data || bookingRes;
      if (billRes && billRes.success) {
        billData = billRes.bill;
      }

      // Map API response to Component State structure
      const mappedBooking = {
        ...apiData,
        bill: billData || apiData.bill, // Prioritize fetched bill
        id: apiData._id || apiData.id,
        user: apiData.userId || apiData.user || { name: apiData.customerName || 'Customer', phone: apiData.customerPhone || 'Hidden' },
        customerName: apiData.userId?.name || apiData.customerName || 'Customer',
        customerPhone: apiData.userId?.phone || apiData.customerPhone || 'Hidden',
        serviceType: apiData.serviceId?.title || apiData.serviceName || apiData.serviceType || 'Service',
        items: apiData.bookedItems || [],
        location: {
          address: (() => {
            const a = apiData.address;
            if (!a) return 'Address not available';
            if (typeof a === 'string') return a;
            return `${a.addressLine2 ? a.addressLine2 + ', ' : ''}${a.addressLine1 || ''}, ${a.city || ''}`;
          })(),
          lat: apiData.address?.lat || 0,
          lng: apiData.address?.lng || 0,
          distance: apiData.distance ? `${apiData.distance.toFixed(1)} km` : 'N/A'
        },
        // Price Breakdown
        basePrice: parseFloat(apiData.basePrice || 0),
        tax: parseFloat(apiData.tax || (apiData.paymentMethod === 'plan_benefit' ? (apiData.basePrice || 0) * 0.18 : 0)),
        visitingCharges: parseFloat(apiData.visitingCharges || apiData.visitationFee || 0),
        discount: parseFloat(apiData.discount || 0),
        platformCommission: parseFloat(apiData.adminCommission || apiData.platformFee || apiData.commission || 0),
        finalAmount: parseFloat(apiData.finalAmount || 0),
        vendorEarnings: parseFloat(
          billData?.vendorTotalEarning ||
          apiData.vendorEarnings ||
          (apiData.paymentMethod === 'plan_benefit'
            ? (Number(apiData.basePrice || 0) * 0.7) // Fallback: 70% share from base
            : (apiData.finalAmount ? apiData.finalAmount - (apiData.commission || 0) : 0)
          )
        ),

        // Display Price (Vendor Earnings by default as requested)
        price: (apiData.vendorEarnings || (apiData.finalAmount ? apiData.finalAmount - (apiData.commission || 0) : 0)).toFixed(2),

        timeSlot: {
          date: apiData.scheduledDate ? new Date(apiData.scheduledDate).toLocaleDateString() : 'Today',
          time: apiData.scheduledTime || apiData.timeSlot?.start ? `${apiData.timeSlot.start} - ${apiData.timeSlot.end}` : 'Flexible'
        },
        status: apiData.status,
        description: apiData.description || apiData.notes || 'No description provided',
        assignedTo: apiData.workerId ? { name: apiData.workerId.name } : (apiData.assignedAt ? { name: 'You (Self)' } : null),
        workerResponse: apiData.workerResponse,
        workerResponseAt: apiData.workerResponseAt,
        paymentMethod: apiData.paymentMethod,
        paymentStatus: apiData.paymentStatus,
        cashCollected: apiData.cashCollected || false,
        workerPaymentStatus: apiData.workerPaymentStatus,
        finalSettlementStatus: apiData.finalSettlementStatus
      };

      setBooking(mappedBooking);
    } catch (error) {
      // Error loading booking
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
    window.addEventListener('vendorJobsUpdated', loadBooking);

    return () => {
      window.removeEventListener('vendorJobsUpdated', loadBooking);
    };
  }, [id]);


  // ADDED: Socket for Live Location Tracking in Details Page
  const socket = useAppNotifications('vendor'); // Get socket

  // Optimized Live Location Tracking with distance filter and heading
  const isTrackingActive = booking?.status === 'journey_started' || booking?.status === 'visited';
  useLocationTracking(socket, id, isTrackingActive, {
    distanceFilter: 10, // Only emit when moved 10+ meters
    interval: 3000,     // Minimum 3s between emissions
    enableHighAccuracy: true
  });

  // Listen for Real-Time Booking Updates (e.g. Online Payment)
  useEffect(() => {
    if (socket && id) {
      const handleBookingUpdate = (data) => {
        // Check if update is for this booking
        if (data.bookingId === id || data.relatedId === id || data._id === id) {

          // Update local state to trigger effects immediately
          setBooking(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              ...data, // Merge updates
              status: data.status || prev.status,
              paymentStatus: data.paymentStatus || prev.paymentStatus
            };
          });

          // Also trigger a full reload to be safe/sync
          window.dispatchEvent(new Event('vendorJobsUpdated'));

          // Check if this update is a payment success, if so, trigger reload for fresh state
          const isPaymentSuccess =
            data.paymentStatus === 'SUCCESS' ||
            data.paymentStatus === 'paid' ||
            data.type === 'payment_success';

          if (isPaymentSuccess) {
            toast.success('Online Payment Received!');
            setTimeout(() => window.location.reload(), 1500);
          }
        }
      };

      socket.on('booking_updated', handleBookingUpdate);
      socket.on('payment_success', handleBookingUpdate);

      return () => {
        socket.off('booking_updated', handleBookingUpdate);
        socket.off('payment_success', handleBookingUpdate);
      };
    }
  }, [socket, id]);

  const handleVerifyVisit = async () => {
    const otp = otpInput.join('');
    if (otp.length !== 4) return toast.error('Enter 4-digit OTP');

    setActionLoading(true);

    if (!navigator.geolocation) {
      toast.error('Geolocation required for verification');
      setActionLoading(false);
      return;
    }

    // Robust Geolocation Helper - PERMISSIVE MODE
    const getPosition = () => {
      return new Promise((resolve, reject) => {
        // FASTEST STRATEGY: Prefer Wi-Fi/Cell (Low Accuracy) + Cached Positions
        // Detailed GPS is often blocked indoors where vendors verify arrival
        const options = {
          enableHighAccuracy: false, // Critical fix: Disable GPS requirement
          timeout: 30000,            // 30s timeout
          maximumAge: Infinity       // Accept any valid cached position
        };

        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            console.warn("Standard geo failed, trying high accuracy as last resort...", error);
            // Emergency fallback: Try GPS if Wi-Fi location fails (rare)
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );
          },
          options
        );
      });
    };

    try {
      const position = await getPosition();
      const location = { lat: position.coords.latitude, lng: position.coords.longitude };
      await verifySelfVisit(id, otp, location);
      toast.success('Visit Verified');
      setIsVisitModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Geo Error:", error);
      if (error.code === 1) toast.error('Location permission denied');
      else if (error.code === 2) toast.error('Location unavailable. Check GPS.');
      else if (error.code === 3) toast.error('Location timeout. Move to better signal area.');
      else toast.error('Failed to get location');
    } finally {
      setActionLoading(false);
    }
  };
  const getAvailableStatuses = (currentStatus, booking) => {
    // Check payment status
    const workerPaymentDone = booking?.workerPaymentStatus === 'PAID';
    const finalSettlementDone = booking?.finalSettlementStatus === 'DONE';
    const isSelfJob = booking?.assignedTo?.name === 'You (Self)';

    const statusFlow = {
      'confirmed': ['assigned', 'visited', 'journey_started'],
      'assigned': ['visited', 'journey_started'],
      'journey_started': ['visited'],
      'visited': ['in_progress', 'work_done'],
      'in_progress': ['work_done'],
      'work_done': ['completed', 'final_settlement'],
      'final_settlement': ['completed'],
      'completed': [],
    };
    return statusFlow[currentStatus] || [];
  };

  const canPayWorker = (booking) => {
    // If assigned to self, no worker payment needed
    if (booking?.assignedTo?.name === 'You (Self)') return false;

    // Allow payment ONLY if booking is completed (Vendor Approved)
    const validStatus = booking?.status === 'completed';
    return validStatus && booking?.workerPaymentStatus !== 'PAID';
  };

  const canDoFinalSettlement = (booking) => {
    // Check if payment is already done (Online SUCCESS or Cash COLLECTED)
    // Robust check for various status strings (case-insensitive)
    const pStatus = booking?.paymentStatus?.toLowerCase() || '';
    const isPaid = pStatus === 'success' || pStatus === 'paid' || booking?.cashCollected;

    const status = booking?.status?.toLowerCase() || '';
    const isWorkDone = status === 'work_done' || status === 'completed' || status === 'worker_paid';

    // Check worker payment (enforce worker is paid before vendor can finalize unless doing job self)
    const isSelfJob = booking?.assignedTo?.name === 'You (Self)';
    const handleWorkerCheck = isSelfJob || booking?.workerPaymentStatus === 'PAID';

    return isWorkDone && isPaid && handleWorkerCheck && booking?.finalSettlementStatus !== 'DONE';
  };

  const handleStatusChange = async (newStatus) => {
    if (!booking) return;

    const availableStatuses = getAvailableStatuses(booking.status, booking);
    if (!availableStatuses.includes(newStatus)) {
      toast.error(`Cannot change status from ${booking.status} to ${newStatus}. Please follow the proper flow.`);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Update Status',
      message: `Are you sure you want to change status to ${newStatus.replace('_', ' ')}?`,
      type: 'info',
      onConfirm: async () => {
        setLoading(true);
        try {
          await updateBookingStatus(id, newStatus);
          window.dispatchEvent(new Event('vendorJobsUpdated'));
          toast.success(`Status updated to ${newStatus.replace('_', ' ')} successfully!`);
          loadBooking();
        } catch (error) {
          console.error('Error updating status:', error);
          toast.error('Failed to update status. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handlePayWorkerClick = () => {
    setIsPayWorkerModalOpen(true);
  };

  const handlePayWorkerSubmit = async (payoutData) => {
    const { amount, notes, transactionId, screenshot, paymentMethod } = payoutData;

    try {
      setPaySubmitting(true);
      const res = await vendorWalletService.payWorker(
        booking.id || booking._id,
        amount,
        notes,
        transactionId,
        screenshot,
        paymentMethod
      );

      if (res.success) {
        toast.success(res.message || 'Payment recorded successfully');
        setIsPayWorkerModalOpen(false);
        // Refresh booking data
        loadBooking();
      } else {
        toast.error(res.message || 'Failed to record payment');
      }
    } catch (error) {
      toast.error('Failed to process payment');
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleFinalSettlement = async () => {
    if (!booking) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Final Settlement',
      message: 'Mark final settlement as done? This will allow you to complete the booking.',
      type: 'warning',
      onConfirm: async () => {
        setLoading(true);
        try {
          await updateBookingStatus(id, booking.status, {
            finalSettlementStatus: 'DONE'
          });
          window.dispatchEvent(new Event('vendorJobsUpdated'));
          toast.success('Final settlement marked as done!');
          loadBooking();
        } catch (error) {
          console.error('Error updating settlement:', error);
          toast.error('Failed to update settlement. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    });
  };



  // Handle cash collection button click
  const handleCollectCashClick = () => {
    // If OTP already sent, open modal. Otherwise navigate to full billing page.
    if (booking?.customerConfirmationOTP || booking?.paymentOtp) {
      setIsCashModalOpen(true);
    } else {
      // Navigate to the full page billing flow
      navigate(`/vendor/booking/${booking.id || id}/billing`);
    }
  };

  const handleCashCollectionConfirm = async (amount, extras, code) => {
    try {
      const res = await vendorWalletService.confirmCashCollection(id, amount, code, extras);
      if (res.success) {
        toast.success('Payment verified successfully!');
        window.location.reload();
      }
      return res;
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('Verification failed');
      throw error;
    }
  };

  const canCollectCash = (booking) => {
    // Hide if already collected or paid online
    if (booking?.cashCollected || booking?.paymentStatus === 'collected_by_vendor') {
      return false;
    }

    // Cash can be collected when booking is completed/work_done and payment was cash/at home
    const isSelfJob = booking?.assignedTo?.name === 'You (Self)';
    const validStatus = isSelfJob
      ? (booking?.status === 'work_done' || booking?.status === 'completed')
      : booking?.status === 'completed';

    if (!validStatus) return false;

    // CRITICAL FIX: Allow bill preparation for Plan Benefit bookings
    // Even if base is pre-paid (SUCCESS), vendor must generate final bill (for extras etc.)
    if (booking?.paymentMethod === 'plan_benefit') {
      return true;
    }

    if (booking?.paymentStatus === 'SUCCESS' || booking?.paymentStatus === 'paid') {
      return false;
    }

    // IMPORTANT: Only for Cash/Pay at Home methods OR Online if not paid yet.
    return (
      booking?.paymentMethod === 'cash' ||
      booking?.paymentMethod === 'pay_at_home' ||
      booking?.paymentMethod === 'online'
    );
  };



  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: themeColors.backgroundGradient }}>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const handleCallUser = () => {
    const phone = booking.user?.phone || booking.customerPhone;
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      alert('Phone number not available');
    }
  };

  const handleViewTimeline = () => {
    navigate(`/vendor/booking/${booking.id}/timeline`);
  };

  const handleAssignWorker = () => {
    navigate(`/vendor/booking/${booking.id}/assign-worker`);
  };

  const handleAssignToSelf = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Assign to Self',
      message: 'Are you sure you want to do this job yourself?',
      type: 'info',
      onConfirm: async () => {
        setLoading(true);
        try {
          const response = await assignWorkerApi(id, 'SELF');
          if (response && response.success) {
            toast.success('Assigned to yourself successfully');
            window.dispatchEvent(new Event('vendorJobsUpdated'));
            window.location.reload();
          } else {
            throw new Error(response?.message || 'Failed to assign');
          }
        } catch (error) {
          console.error('Error assigning to self:', error);
          toast.error(error.message || 'Failed to assign to yourself');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleStartJourney = async () => {
    // If self-job, call the start API first
    if (booking.assignedTo?.name === 'You (Self)') {
      try {
        setLoading(true);
        await startSelfJob(id);
        toast.success('Journey Started');
        // Refresh to update status
        const response = await getBookingById(id);
        const apiData = response.data || response;
        setBooking(prev => ({ ...prev, status: apiData.status }));
      } catch (error) {
        console.error('Error starting self journey:', error);
        toast.error('Failed to start journey');
        return;
      } finally {
        setLoading(false);
      }
    }

    navigate(`/vendor/booking/${booking.id || id}/map`);
  };





  const handleCompleteWork = async (photos) => {
    try {
      setActionLoading(true);
      await completeSelfJob(id, { workPhotos: photos || [] });
      toast.success('Work marked done');
      setIsWorkDoneModalOpen(false);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete job');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveWork = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Approve Work',
      message: 'Approve the work done by the worker? This will mark the job as completed and enable payout.',
      type: 'success',
      onConfirm: async () => {
        setLoading(true);
        try {
          await updateBookingStatus(id, 'completed');
          window.dispatchEvent(new Event('vendorJobsUpdated'));
          toast.success('Work Approved! You can now pay the worker.');
          window.location.reload();
        } catch (error) {
          console.error('Error approving work:', error);
          toast.error('Failed to approve work');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // --- Payment Breakdown Calculations ---
  // Default values from booking (fallback)
  const isPlanBenefit = booking?.paymentMethod === 'plan_benefit';
  const bill = booking?.bill;

  // Base Logic (Services)
  const originalBase = bill ? (bill.originalServiceBase || 0) : (parseFloat(booking?.basePrice) || 0);

  // Extra Services & Parts from vendor bill (if available)
  const allBillServices = bill?.services || [];
  const services = allBillServices.filter(s => !s.isOriginal);
  const originalServiceFromBill = allBillServices.find(s => s.isOriginal);
  const parts = bill?.parts || [];
  const customItems = bill?.customItems || [];

  let extraServiceBase = 0;
  let extraServiceGST = 0;
  services.forEach(s => {
    const qty = parseFloat(s.quantity) || 1;
    const base = (parseFloat(s.price) || 0) * qty;
    const gst = parseFloat(s.gstAmount) || 0;
    extraServiceBase += base;
    extraServiceGST += gst;
  });

  let partsBase = 0;
  let partsGST = 0;
  parts.forEach(p => {
    const qty = parseFloat(p.quantity) || 1;
    partsBase += ((parseFloat(p.price) || 0) * qty);
    partsGST += (parseFloat(p.gstAmount) || 0);
  });
  customItems.forEach(c => {
    const qty = parseFloat(c.quantity) || 1;
    partsBase += ((parseFloat(c.price) || 0) * qty);
    partsGST += (parseFloat(c.gstAmount) || 0);
  });

  // Tax Logic
  const originalGST = bill ? (bill.originalGST || 0) : (originalBase * 0.18);
  const totalGST = originalGST + extraServiceGST + partsGST;

  // Final Total from bill or booking
  const finalTotal = bill?.grandTotal || (booking?.finalAmount || 0);
  const hasBill = !!bill;

  return (
    <div className="min-h-screen pb-36 relative" style={{ background: '#FFFFFF' }}>
      {/* Premium Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 0% 0%, rgba(13, 148, 136, 0.12) 0%, transparent 70%),
              radial-gradient(at 100% 100%, rgba(13, 148, 136, 0.05) 0%, transparent 75%),
              #F8FAFC
            `
          }}
        />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(#0D9488 0.8px, transparent 0.8px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <header className="sticky top-0 z-[60] backdrop-blur-xl bg-white/40 border-b border-black/[0.03] px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              console.log('Navigating back...');
              navigate(-1);
            }}
            className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-teal-900/5 border border-black/[0.02] flex items-center justify-center cursor-pointer relative z-50"
          >
            <FiX className="w-5 h-5 text-gray-900" />
          </motion.button>
          <div className="flex flex-col">
            <h1 className="text-xl font-[1000] text-gray-900 tracking-tight leading-none">Job Intel</h1>
            <span className="text-[8px] font-black text-teal-600 uppercase tracking-[0.2em] mt-1">Deployment ID: {id?.slice(-6).toUpperCase()}</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-teal-900/5 border border-black/[0.02] flex items-center justify-center">
          <FiBriefcase className="w-5 h-5 text-teal-600" />
        </div>
      </header>

      <main className="px-5 py-8 relative z-10 max-w-lg mx-auto">
        {/* Service Archetype Card */}
        <div className="bg-white/70 backdrop-blur-md rounded-[44px] p-8 mb-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] border border-white/60">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-[1000] uppercase tracking-[0.3em] text-gray-400 mb-3">Service Specialization</p>
              <h2 className="text-2xl font-[1000] text-gray-900 tracking-tight leading-tight">
                {booking.serviceType}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="px-5 py-2.5 rounded-[18px] text-[10px] font-[1000] uppercase tracking-widest bg-teal-600 text-white shadow-2xl shadow-teal-900/20">
                {booking.status.replace('_', ' ')}
              </div>
              {booking.assignedTo?.name === 'You (Self)' && (
                <span className="text-[8px] font-black text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100/50 uppercase tracking-[0.2em]">
                  Internal Ops
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Identity Matrix Card */}
        <div className="bg-white/70 backdrop-blur-md rounded-[44px] p-6 mb-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] border border-white/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[28px] bg-gray-50 flex items-center justify-center border border-black/[0.02] shadow-inner">
                <FiUser className="w-7 h-7 text-gray-900" />
              </div>
              <div>
                <p className="text-[10px] font-[1000] uppercase tracking-[0.25em] text-gray-400 mb-1.5">Target Client</p>
                <p className="text-lg font-[1000] text-gray-900 leading-tight tracking-tight">{booking.user?.name || booking.customerName || 'Client'}</p>
                <p className="text-[11px] font-black text-teal-600/60 uppercase tracking-widest mt-1.5">Verified Network</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleCallUser}
              className="w-14 h-14 rounded-[24px] bg-teal-600 flex items-center justify-center shadow-2xl shadow-teal-900/20 border border-white/20"
            >
              <FiPhone className="w-6 h-6 text-white" />
            </motion.button>
          </div>
        </div>

        {/* Geospatial Deployment Base */}
        <div className="bg-white/70 backdrop-blur-md rounded-[44px] p-6 mb-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] border border-white/60">
          <div className="flex items-start gap-5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100/50">
              <FiMapPin className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-[10px] font-[1000] uppercase tracking-[0.25em] text-gray-400 mb-2">Service Base Coordinates</p>
              <p className="text-[14px] font-[1000] text-gray-900 leading-relaxed tracking-tight">{booking?.location?.address || 'Location not specified'}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[9px] font-[1000] text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100/30 uppercase tracking-widest">
                  {booking?.location?.distance || 'N/A'} Proximal
                </span>
              </div>
            </div>
          </div>

          <div className="w-full h-52 rounded-[32px] overflow-hidden mb-6 border border-black/[0.02] relative group cursor-pointer shadow-inner" onClick={() => navigate(`/vendor/booking/${booking.id}/map`)}>
            {(() => {
              const hasCoordinates = booking.location.lat && booking.location.lng && booking.location.lat !== 0 && booking.location.lng !== 0;
              const mapQuery = hasCoordinates ? `${booking.location.lat},${booking.location.lng}` : encodeURIComponent(booking.location.address);
              return (
                <>
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0, pointerEvents: 'none', filter: 'grayscale(0.2) contrast(1.1)' }}
                    src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`}
                    allowFullScreen
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <motion.span 
                      whileHover={{ scale: 1.05 }}
                      className="bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-[1000] uppercase tracking-widest shadow-2xl"
                    >
                      Maximize Analytics
                    </motion.span>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="flex gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/vendor/booking/${booking.id || id}/map`)}
              className="flex-1 py-5 rounded-[28px] font-[1000] text-[10px] uppercase tracking-widest border border-black/[0.03] flex items-center justify-center gap-3 bg-white text-gray-900 shadow-xl shadow-black/5"
            >
              <FiMapPin className="w-4 h-4 text-teal-600" />
              Base View
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const hasCoords = booking.location.lat && booking.location.lng;
                const dest = hasCoords ? `${booking.location.lat},${booking.location.lng}` : encodeURIComponent(booking.location.address);
                window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
              }}
              className="flex-1 py-5 rounded-[28px] font-[1000] text-[10px] uppercase tracking-widest text-white flex items-center justify-center gap-3 bg-black shadow-2xl shadow-black/20"
            >
              <FiNavigation className="w-4 h-4 text-teal-400" />
              Navigate
            </motion.button>
          </div>
        </div>

        {/* Schedule Intel */}
        <div className="bg-white/70 backdrop-blur-md rounded-[36px] p-6 mb-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] border border-white/60">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100/50">
              <FiClock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] font-[1000] uppercase tracking-[0.25em] text-gray-400 mb-1.5">Temporal Slot</p>
              <p className="text-base font-[1000] text-gray-900 tracking-tight">{booking?.timeSlot?.date || 'Date not set'}</p>
              <p className="text-[11px] font-black text-orange-600/60 uppercase tracking-widest mt-1">{booking?.timeSlot?.time || 'Time not set'}</p>
            </div>
          </div>
        </div>

        {/* Core Financial Invoice Module */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[48px] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] border border-white/60 mb-8">
          <div className="bg-gray-900 px-8 py-10 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-[60px]" />
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3 opacity-60">Consolidated Gross Value</p>
            <h2 className="text-5xl font-[1000] tracking-tighter">₹{finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            {isPlanBenefit && (
              <div className="inline-flex mt-5 bg-teal-500/10 text-teal-400 border border-teal-500/20 px-4 py-1.5 rounded-full text-[9px] font-[1000] uppercase tracking-widest">
                Internal Membership Applied
              </div>
            )}
          </div>
          <div className="p-8 space-y-8">
            {/* Service Inventory */}
            <div>
              <h4 className="text-[10px] font-[1000] text-gray-400 uppercase tracking-[0.25em] flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-xl bg-gray-50 text-teal-600 flex items-center justify-center border border-black/[0.02] shadow-inner"><FiTool className="w-4 h-4" /></span>
                Service Provision
              </h4>
              <div className="space-y-4 pl-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-[1000] text-gray-900 tracking-tight">{booking.serviceType} (Primary)</span>
                  {isPlanBenefit ? (
                    <div className="flex items-center gap-3">
                      <span className="line-through text-gray-400 text-xs opacity-50">₹{originalBase.toFixed(2)}</span>
                      <span className="text-teal-600 font-[1000] text-[9px] bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 uppercase tracking-widest">FREE</span>
                    </div>
                  ) : (
                    <span className="font-[1000] text-gray-900">₹{originalBase.toFixed(2)}</span>
                  )}
                </div>

                {services.map((s, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="font-black text-gray-500 uppercase tracking-tight text-[11px]">{s.name} × {s.quantity}</span>
                    <span className="font-[1000] text-gray-900">₹{((parseFloat(s.price) || 0) * (parseFloat(s.quantity) || 1)).toFixed(2)}</span>
                  </div>
                ))}

                <div className="flex justify-between text-[10px] text-gray-400 font-black uppercase tracking-widest pt-4 border-t border-dashed border-black/[0.05]">
                  <span>Operational Tax (18%)</span>
                  <span>₹{(originalGST + extraServiceGST).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Asset Logistics */}
            {(parts.length > 0 || customItems.length > 0) && (
              <div className="pt-8 border-t border-black/[0.03]">
                <h4 className="text-[10px] font-[1000] text-gray-400 uppercase tracking-[0.25em] flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-xl bg-gray-50 text-orange-600 flex items-center justify-center border border-black/[0.02] shadow-inner"><FiPackage className="w-4 h-4" /></span>
                  Component Logistics
                </h4>
                <div className="space-y-4 pl-1">
                  {parts.map((p, i) => (
                    <div key={`p-${i}`} className="flex justify-between items-center text-sm">
                      <span className="font-black text-gray-500 uppercase tracking-tight text-[11px]">{p.name} × {p.quantity}</span>
                      <span className="font-[1000] text-gray-900">₹{(p.price * p.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {customItems.map((c, i) => (
                    <div key={`c-${i}`} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-black text-gray-500 uppercase tracking-tight text-[11px]">{c.name} × {c.quantity}</span>
                      </div>
                      <span className="font-[1000] text-gray-900">₹{(c.price * c.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[10px] text-gray-400 font-black uppercase tracking-widest pt-4 border-t border-dashed border-black/[0.05]">
                    <span>Asset Tax (18%)</span>
                    <span>₹{partsGST.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Master Net Earnings Analytics */}
          {(booking.status === 'completed' || booking.status === 'work_done' || booking.cashCollected) ? (
            <div className="bg-teal-600/5 px-8 py-8 border-t border-teal-600/10">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-teal-800/60 uppercase tracking-widest">Core Provision Split ({bill?.payoutConfig?.serviceSplitPercentage || 70}%)</span>
                  <span className="font-[1000] text-teal-800 text-sm">₹{(bill?.vendorServiceEarning || (booking.vendorEarnings || 0)).toFixed(2)}</span>
                </div>
                {(parts.length > 0 || customItems.length > 0 || bill?.vendorPartsEarning > 0) && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-teal-800/60 uppercase tracking-widest">Asset Logistics Split ({bill?.payoutConfig?.partsSplitPercentage || 10}%)</span>
                    <span className="font-[1000] text-teal-800 text-sm">₹{(bill?.vendorPartsEarning || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center pt-5 border-t border-teal-600/20">
                <div className="flex flex-col">
                  <span className="text-teal-900 font-[1000] text-[10px] uppercase tracking-[0.2em]">
                    Net Operational Intel
                  </span>
                  <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest mt-1">
                    {(booking?.paymentStatus === 'SUCCESS' || booking?.paymentStatus === 'paid' || booking?.cashCollected) ? 'Settled Value' : 'Projected Value'}
                  </span>
                </div>
                <span className="text-teal-600 font-[1000] text-3xl tracking-tighter">
                  ₹{(bill?.vendorTotalEarning || booking.vendorEarnings || 0).toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 px-8 py-6 border-t border-black/[0.02] text-center">
              <p className="text-[9px] font-[1000] text-gray-400 uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                <FiAlertCircle className="w-4 h-4 opacity-50" />
                Earnings data locked until completion
              </p>
            </div>
          )}
        </div>

        {/* Deployment Status & Action Hub */}
        <div className="space-y-6 pb-20">
          {/* Worker Context Card */}
          {booking.assignedTo && booking.assignedTo?.name !== 'You (Self)' && (
            <div className="bg-white/70 backdrop-blur-md rounded-[44px] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] border border-white/60">
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-black/[0.03]">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[28px] bg-gray-50 flex items-center justify-center border border-black/[0.02] shadow-inner">
                    <FiUser className="w-7 h-7 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-[1000] text-gray-900 text-base tracking-tight">{booking?.assignedTo?.name || 'Assigned Agent'}</h3>
                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1">Operational Field Agent</p>
                  </div>
                </div>
                {booking?.assignedTo?.phone && (
                  <motion.a 
                    whileTap={{ scale: 0.9 }}
                    href={`tel:${booking.assignedTo.phone}`} 
                    className="w-14 h-14 rounded-[24px] bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 shadow-xl shadow-emerald-900/5"
                  >
                    <FiPhone className="w-6 h-6" />
                  </motion.a>
                )}
              </div>

              {/* Status Visualization */}
              {!booking.workerResponse || booking.workerResponse === 'PENDING' ? (
                <div className="flex items-center gap-5 text-amber-600 bg-amber-50/50 backdrop-blur-md p-6 rounded-[32px] border border-amber-100 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-inner">
                    <FiClock className="w-7 h-7 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-[1000] text-sm text-gray-900 tracking-tight">Signal Pending</p>
                    <p className="text-[10px] text-amber-700/80 font-black uppercase tracking-widest mt-1">Awaiting Agent Acknowledgement</p>
                  </div>
                </div>
              ) : booking.workerResponse === 'ACCEPTED' ? (
                <div className="space-y-8">
                  {/* Deployment Pipeline Visual */}
                  <div className="relative px-2">
                    <div className="absolute left-8 right-8 top-[18px] h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ 
                          width: booking.status === 'completed' || booking.status === 'work_done' ? '100%' :
                                 booking.status === 'in_progress' || booking.status === 'visited' ? '66%' :
                                 booking.status === 'journey_started' ? '33%' : '0%' 
                        }}
                        className="h-full bg-teal-600 rounded-full shadow-[0_0_20px_rgba(13,148,136,0.3)]"
                      />
                    </div>

                    <div className="flex justify-between items-start relative z-10">
                      {[
                        { icon: FiCheck, label: 'Accepted', active: true },
                        { icon: FiNavigation, label: 'Deploy', active: ['journey_started', 'visited', 'in_progress', 'work_done', 'completed'].includes(booking.status) },
                        { icon: FiTool, label: 'Ops', active: ['visited', 'in_progress', 'work_done', 'completed'].includes(booking.status) },
                        { icon: FiCheckCircle, label: 'Done', active: ['work_done', 'completed'].includes(booking.status) }
                      ].map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-3">
                          <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-all duration-700 shadow-xl ring-4 ring-white ${step.active ? 'bg-teal-600 text-white' : 'bg-white text-gray-200 border-2 border-dashed border-gray-100'}`}>
                            <step.icon className="w-5 h-5" />
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${step.active ? 'text-teal-900' : 'text-gray-300'}`}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Primary Status Readout */}
                  <div className="bg-white/60 backdrop-blur-md rounded-[32px] p-6 border border-black/[0.02] flex items-center gap-6 shadow-xl shadow-black/[0.02]">
                    <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shadow-inner ${
                      booking.status === 'journey_started' ? 'bg-blue-50 text-blue-600' :
                      booking.status === 'in_progress' ? 'bg-orange-50 text-orange-600' :
                      ['work_done', 'completed'].includes(booking.status) ? 'bg-emerald-50 text-emerald-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      <FiActivity className="w-8 h-8 opacity-80" />
                    </div>
                    <div>
                      <p className="font-[1000] text-gray-900 text-lg tracking-tight mb-1">
                        {booking.status === 'journey_started' ? 'In Transit' :
                         booking.status === 'visited' ? 'On Site' :
                         booking.status === 'in_progress' ? 'Ops Active' :
                         ['work_done', 'completed'].includes(booking.status) ? 'Ops Complete' :
                         'Agent Ready'}
                      </p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-70">
                        {booking.status === 'journey_started' ? 'Live Geospatial Tracking Active' :
                         booking.status === 'visited' ? 'Awaiting Access Verification' :
                         booking.status === 'in_progress' ? 'Service Deployment in Progress' :
                         ['work_done', 'completed'].includes(booking.status) ? 'Awaiting Final Validation' :
                         'Standing by for Deployment'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-5 text-rose-600 bg-rose-50/50 backdrop-blur-md p-6 rounded-[32px] border border-rose-100 shadow-sm">
                  <FiXCircle className="w-8 h-8 opacity-60" />
                  <div className="flex-1">
                    <p className="font-[1000] text-sm text-gray-900 tracking-tight">Signal Rejected</p>
                    <p className="text-[10px] text-rose-700/80 font-black uppercase tracking-widest mt-1">Agent Declined Deployment</p>
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAssignWorker} 
                    className="px-5 py-2.5 bg-white border border-rose-200 rounded-2xl text-[10px] font-[1000] uppercase tracking-widest text-rose-600 shadow-xl shadow-rose-900/5"
                  >
                    Recalibrate
                  </motion.button>
                </div>
              )}
            </div>
          )}

          {/* Unassigned / Recalibration Hub */}
          {(!booking.assignedTo || (booking.assignedTo?.name === 'You (Self)' && booking.status === 'assigned')) && (
            <div className="bg-white/70 backdrop-blur-md rounded-[44px] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] border border-white/60">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-teal-50 rounded-[32px] flex items-center justify-center mx-auto mb-4 border border-teal-100 shadow-inner">
                  <FiUsers className="w-10 h-10 text-teal-600" />
                </div>
                <h3 className="text-xl font-[1000] text-gray-900 tracking-tight">Deployment Required</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Standing by for Resource Allocation</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAssignWorker}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-[32px] transition-all group ${
                    booking.assignedTo?.name === 'You (Self)' 
                    ? 'bg-white border border-black/[0.05] text-gray-900 shadow-xl shadow-black/[0.02]' 
                    : 'bg-teal-600 text-white shadow-2xl shadow-teal-900/20'
                  }`}
                >
                  <FiUsers className={`w-6 h-6 group-hover:scale-110 transition-transform ${booking.assignedTo?.name === 'You (Self)' ? 'text-teal-600' : 'text-white'}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Assign Worker</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={booking.assignedTo?.name === 'You (Self)' ? handleStartJourney : handleAssignToSelf}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-[32px] transition-all group ${
                    booking.assignedTo?.name === 'You (Self)'
                    ? 'bg-teal-600 text-white shadow-2xl shadow-teal-900/20'
                    : 'bg-white border border-black/[0.05] text-gray-900 shadow-xl shadow-black/[0.02]'
                  }`}
                >
                  {booking.assignedTo?.name === 'You (Self)' ? (
                    <>
                      <FiNavigation className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Begin Deployment</span>
                    </>
                  ) : (
                    <>
                      <FiUser className="w-6 h-6 text-teal-600 group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Do It Myself</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          )}

          {/* Master Operational Buttons */}
          <div className="space-y-4 pt-10 px-1">
            {/* Payment & Settlement Triggers */}
            {canCollectCash(booking) && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/vendor/booking/${booking.id || id}/billing`)}
                className="w-full py-6 rounded-[32px] font-[1000] text-[11px] uppercase tracking-[0.25em] text-white bg-teal-600 shadow-2xl shadow-teal-900/30 flex items-center justify-center gap-4 border border-white/20"
              >
                <FiDollarSign className="w-5 h-5" />
                {booking.paymentMethod === 'plan_benefit' ? 'Finalize Operational Bill' : 'Initiate Settlement'}
              </motion.button>
            )}

            {canDoFinalSettlement(booking) && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleFinalSettlement}
                className="w-full py-6 rounded-[32px] font-[1000] text-[11px] uppercase tracking-[0.25em] text-white bg-black shadow-2xl shadow-black/20 flex items-center justify-center gap-4"
              >
                <FiCheckCircle className="w-5 h-5 text-teal-400" />
                Finalize & Archive Job
              </motion.button>
            )}



            {/* Evidence Submission */}
            {booking.assignedTo?.name === 'You (Self)' && (booking.status === 'visited' || booking.status === 'in_progress') && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsWorkDoneModalOpen(true)}
                className="w-full py-6 rounded-[32px] font-[1000] text-[11px] uppercase tracking-[0.25em] text-white bg-black shadow-2xl shadow-black/20 flex items-center justify-center gap-4"
              >
                <FiCheckCircle className="w-5 h-5 text-teal-400" />
                Submit Evidence & Close
              </motion.button>
            )}
          </div>
        </div>
      </main>

      {/* Persistence Layers (Modals) */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        type={confirmDialog.type}
      />

      <WorkerPaymentModal
        isOpen={isPayWorkerModalOpen}
        onClose={() => setIsPayWorkerModalOpen(false)}
        onSubmit={handlePayWorkerSubmit}
        booking={booking}
        loading={paySubmitting}
      />

      <VisitVerificationModal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        onVerify={handleVerifyVisit}
        loading={actionLoading}
        bookingId={id}
      />

      <WorkCompletionModal
        isOpen={isWorkDoneModalOpen}
        onClose={() => setIsWorkDoneModalOpen(false)}
        onComplete={handleCompleteWork}
        job={booking}
        loading={actionLoading}
      />

      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        onVerify={handleCashCollectionConfirm}
        booking={booking}
      />

      <BottomNav />
    </div>
  );
}
