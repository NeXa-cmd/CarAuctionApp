const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for car images
const carStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/cars');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage for profile images
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const imageFileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Create upload middleware for car images
const carUpload = multer({
  storage: carStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Create upload middleware for profile images
const profileUpload = multer({
  storage: profileStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size for profile pictures
  }
});

// Middleware to handle multiple car image uploads
exports.uploadCarImages = carUpload.array('images', 10); // Maximum 10 images

// Middleware to handle single profile image upload
exports.uploadProfileImage = profileUpload.single('profileImage');

// Error handling middleware for multer
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: err.code === 'LIMIT_FILE_SIZE' ? 
          'File size too large. Maximum size is 5MB for car images and 2MB for profile images' :
          err.message
      });
    }
    return res.status(400).json({
      message: err.message
    });
  }
  next(err);
};
