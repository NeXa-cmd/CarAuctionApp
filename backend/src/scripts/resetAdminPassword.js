const mongoose = require('mongoose');
const User = require('../models/user.model');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for password reset'))
  .catch(err => console.error('MongoDB connection error:', err));

const resetAdminPassword = async () => {
  try {
    // Find admin user
    const admin = await User.findOne({ email: 'admin@example.com' });
    
    if (!admin) {
      console.log('Admin user does not exist!');
      process.exit(1);
    }
    
    // Set new password - will be hashed by the pre-save middleware
    admin.password = 'admin123';
    await admin.save();
    
    console.log('Admin password has been reset successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin password:', error);
    process.exit(1);
  }
};

// Run the password reset
resetAdminPassword();
