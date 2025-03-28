const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { validateRegister, validateLogin } = require('../middleware/validate.middleware');
const { uploadProfileImage } = require('../middleware/upload.middleware');
const {
  register,
  login,
  getMe,
  updateProfile
} = require('../controllers/auth.controller');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, uploadProfileImage, updateProfile);

module.exports = router;
