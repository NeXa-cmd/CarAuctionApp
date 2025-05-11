const mongoose = require('mongoose');
const User = require('../models/user.model');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for admin verification'))
  .catch(err => console.error('MongoDB connection error:', err));

const verifyAdmin = async () => {
  try {
    // Find admin user
    const admin = await User.findOne({ email: 'admin@example.com' });
    
    if (!admin) {
      console.log('Admin user does not exist!');
      process.exit(1);
    }
    
    console.log('Admin user found:');
    console.log({
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error verifying admin:', error);
    process.exit(1);
  }
};

// Run the verification
verifyAdmin();
