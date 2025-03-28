const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  make: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  mileage: {
    type: Number,
    required: true
  },
  color: String,
  transmission: {
    type: String,
    enum: ['Automatic', 'Manual'],
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  description: String,
  features: [String],
  condition: {
    type: String,
    enum: ['New', 'Excellent', 'Good', 'Fair', 'Poor'],
    required: true
  },
  startingPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'in_auction', 'sold'],
    default: 'available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Car', carSchema);
