const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  sendOTP,
  register,
  login,
  logout,
  verifyLogin
} = require('../../controllers/userControllers/userAuthController');
// ...

const { authenticate } = require('../../middleware/authMiddleware');
const { isUser } = require('../../middleware/roleMiddleware');

const sendOTPValidation = [
  body('phone').trim().notEmpty().withMessage('Phone number is required')
    .isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits')
];

const verifyLoginValidation = [
  body('phone').trim().notEmpty().withMessage('Phone number is required').isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

const loginValidation = [
  body('phone').trim().notEmpty().withMessage('Phone number is required').isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits'),
  body('password').trim().notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required').isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits'),
  body('password').trim().notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Please provide a valid email')
];

// Routes
router.post('/send-otp', sendOTPValidation, sendOTP);
router.post('/verify-login', verifyLoginValidation, verifyLogin); // New Unified Entry
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh-token', require('../../controllers/userControllers/userAuthController').refreshToken);
router.post('/logout', authenticate, isUser, logout);

module.exports = router;

