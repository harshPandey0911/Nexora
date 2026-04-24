const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');
const { 
  createTicket, 
  getMyTickets, 
  getTicketDetails, 
  replyToTicket 
} = require('../../controllers/vendorControllers/vendorSupportController');

// All routes require vendor authentication
router.use(authenticate, isVendor);

router.post('/tickets', createTicket);
router.get('/tickets', getMyTickets);
router.get('/tickets/:id', getTicketDetails);
router.post('/tickets/:id/reply', replyToTicket);

module.exports = router;
