const express = require('express');
const router = express.Router();
const Car = require('../models/car.model');
const { protect, admin } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for car images
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/cars');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Generate unique filename while preserving extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 10 // Maximum 10 files
  }
}).array('images', 10);

// Wrap multer upload in promise
const uploadMiddleware = (req, res, next) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Too many files. Maximum is 10 files.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // An unknown error occurred
      return res.status(400).json({ message: err.message });
    }
    // Everything went fine
    next();
  });
};

// Validate car input
const validateCarInput = (req, res, next) => {
  const { title, make, model, year, mileage, transmission, condition, startingPrice } = req.body;

  if (!title || !make || !model || !year || !mileage || !transmission || !condition || !startingPrice) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
    return res.status(400).json({ message: 'Invalid year' });
  }

  if (isNaN(mileage) || mileage < 0) {
    return res.status(400).json({ message: 'Invalid mileage' });
  }

  if (isNaN(startingPrice) || startingPrice <= 0) {
    return res.status(400).json({ message: 'Invalid starting price' });
  }

  next();
};

// Get all cars with search and filters
router.get('/', async (req, res) => {
  try {
    const {
      search,
      make,
      model,
      minYear,
      maxYear,
      minPrice,
      maxPrice,
      transmission,
      condition,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (make) query.make = { $regex: make, $options: 'i' };
    if (model) query.model = { $regex: model, $options: 'i' };
    if (minYear) query.year = { ...query.year, $gte: parseInt(minYear) };
    if (maxYear) query.year = { ...query.year, $lte: parseInt(maxYear) };
    if (minPrice) query.startingPrice = { ...query.startingPrice, $gte: parseFloat(minPrice) };
    if (maxPrice) query.startingPrice = { ...query.startingPrice, $lte: parseFloat(maxPrice) };
    if (transmission) query.transmission = transmission;
    if (condition) query.condition = condition;

    // Count total documents for pagination
    const total = await Car.countDocuments(query);

    // Execute query with pagination and sorting
    const cars = await Car.find(query)
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      data: cars,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single car
router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json(car);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create car (admin only)
router.post('/', protect, admin, uploadMiddleware, validateCarInput, async (req, res) => {
  try {
    const carData = {
      ...req.body,
      images: req.files ? req.files.map(file => `/uploads/cars/${file.filename}`) : []
    };

    const car = await Car.create(carData);
    res.status(201).json(car);
  } catch (error) {
    console.error('Error creating car:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update car (admin only)
router.put('/:id', protect, admin, uploadMiddleware, validateCarInput, async (req, res) => {
  try {
    const carData = {
      ...req.body
    };

    if (req.files && req.files.length > 0) {
      carData.images = req.files.map(file => `/uploads/cars/${file.filename}`);
    }

    const car = await Car.findByIdAndUpdate(req.params.id, carData, {
      new: true,
      runValidators: true
    });

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    res.json(car);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete car (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload images endpoint
router.post('/upload', protect, admin, upload, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const imageUrls = req.files.map(file => `/uploads/cars/${file.filename}`);
    console.log('Successfully uploaded images:', imageUrls);
    res.json({ imageUrls });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ message: error.message || 'Failed to upload images' });
  }
});

module.exports = router;
