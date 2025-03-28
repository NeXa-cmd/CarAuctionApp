const mongoose = require('mongoose');
const User = require('../models/user.model');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for admin recreation'))
  .catch(err => console.error('MongoDB connection error:', err));

const recreateAdmin = async () => {
  try {
    // Delete existing admin user if exists
    await User.deleteOne({ email: 'admin@example.com' });
    console.log('Deleted existing admin user if any');
    
    // Create new admin user
    const admin = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });
    
    await admin.save();
    
    console.log('New admin user created successfully:');
    console.log({
      username: admin.username,
      email: admin.email,
      role: admin.role,
      _id: admin._id
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error recreating admin:', error);
    process.exit(1);
  }
};

// Run the recreation process
recreateAdmin();
