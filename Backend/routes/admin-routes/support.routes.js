const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const { 
  getAllTickets, 
  getTicketDetails, 
  replyToTicket,
  updateTicketStatus
} = require('../../controllers/adminControllers/adminSupportController');

// All routes require admin authentication
router.use(authenticate, isAdmin);

router.get('/tickets', getAllTickets);
router.get('/tickets/:id', getTicketDetails);
router.post('/tickets/:id/reply', replyToTicket);
router.put('/tickets/:id/status', updateTicketStatus);

module.exports = router;
