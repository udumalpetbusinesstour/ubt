const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getMe, 
  updateProfile, 
  deleteAccount,
  googleLogin
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/google-login
// @access  Public
router.post('/google-login', googleLogin);

// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginUser);

// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, updateProfile);

// @route   DELETE /api/auth/delete
// @access  Private
router.delete('/delete', protect, deleteAccount);

// Mock OTP verification endpoints (backward compatibility)
router.post('/send-otp', (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) {
    return res.status(400).json({ success: false, message: 'Mobile number is required' });
  }
  res.json({ success: true, message: `OTP sent to ${mobileNumber}. (Use code 123456 to verify)` });
});

router.post('/login-otp', async (req, res) => {
  const { mobileNumber, otp } = req.body;
  if (!mobileNumber || !otp) {
    return res.status(400).json({ success: false, message: 'Mobile number and OTP are required' });
  }
  if (otp !== '123456') {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
  const User = require('../models/User');
  let user = await User.findOne({ phone: mobileNumber });
  if (!user) {
    user = await User.create({
      name: 'Udumalpet Business Owner',
      fullName: 'Udumalpet Business Owner',
      email: `user_${Date.now()}@ubt.com`,
      phone: mobileNumber,
      mobileNumber,
      password: `pwd_${Math.random()}`,
    });
  }
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'ubt_jwt_secret_token_123456', { expiresIn: '30d' });
  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      fullName: user.name,
      email: user.email,
      mobileNumber: user.phone,
      role: user.role,
    }
  });
});

module.exports = router;
