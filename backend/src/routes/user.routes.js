const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { protect } = require('../middleware/auth.middleware');
const User = require('../models/user.model');

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's watchlist
router.get('/watchlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'watchlist',
      select: 'make model year images title mileage color'
    });
    res.json({ data: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add car to watchlist
router.post('/watchlist/:carId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.watchlist.includes(req.params.carId)) {
      user.watchlist.push(req.params.carId);
      await user.save();
    }
    res.json({ message: 'Car added to watchlist' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove car from watchlist
router.delete('/watchlist/:carId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.watchlist = user.watchlist.filter(carId => carId.toString() !== req.params.carId);
    await user.save();
    res.json({ message: 'Car removed from watchlist' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
