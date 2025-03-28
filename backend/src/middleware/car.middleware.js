exports.validateCarInput = (req, res, next) => {
  const {
    title,
    make,
    model,
    year,
    mileage,
    transmission,
    images,
    condition,
    startingPrice
  } = req.body;

  const missingFields = [];
  
  if (!title) missingFields.push('title');
  if (!make) missingFields.push('make');
  if (!model) missingFields.push('model');
  if (!year) missingFields.push('year');
  if (!mileage && mileage !== 0) missingFields.push('mileage');
  if (!transmission) missingFields.push('transmission');
  if (!images || !Array.isArray(images) || images.length === 0) missingFields.push('images');
  if (!condition) missingFields.push('condition');
  if (!startingPrice && startingPrice !== 0) missingFields.push('startingPrice');

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingFields.join(', ')}`
    });
  }

  // Validate year
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear + 1) {
    return res.status(400).json({
      message: 'Please provide a valid year'
    });
  }

  // Validate mileage
  if (mileage < 0) {
    return res.status(400).json({
      message: 'Mileage cannot be negative'
    });
  }

  // Validate transmission
  if (!['Automatic', 'Manual'].includes(transmission)) {
    return res.status(400).json({
      message: 'Invalid transmission type'
    });
  }

  // Validate condition
  if (!['New', 'Excellent', 'Good', 'Fair', 'Poor'].includes(condition)) {
    return res.status(400).json({
      message: 'Invalid condition'
    });
  }

  // Validate starting price
  if (startingPrice <= 0) {
    return res.status(400).json({
      message: 'Starting price must be greater than 0'
    });
  }

  next();
};
