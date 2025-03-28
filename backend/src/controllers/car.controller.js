const Car = require('../models/car.model');

// @desc    Get all cars
// @route   GET /api/cars
// @access  Public
exports.getCars = async (req, res) => {
  try {
    const { make, model, year, status, minPrice, maxPrice } = req.query;
    const filter = {};

    // Build filter object based on query parameters
    if (make) filter.make = new RegExp(make, 'i');
    if (model) filter.model = new RegExp(model, 'i');
    if (year) filter.year = year;
    if (status) filter.status = status;
    if (minPrice || maxPrice) {
      filter.startingPrice = {};
      if (minPrice) filter.startingPrice.$gte = minPrice;
      if (maxPrice) filter.startingPrice.$lte = maxPrice;
    }

    const cars = await Car.find(filter)
      .sort({ createdAt: -1 });

    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get single car
// @route   GET /api/cars/:id
// @access  Public
exports.getCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    res.json(car);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create new car
// @route   POST /api/cars
// @access  Private/Admin
exports.createCar = async (req, res) => {
  try {
    const {
      title,
      make,
      model,
      year,
      mileage,
      color,
      transmission,
      images,
      description,
      features,
      condition,
      startingPrice
    } = req.body;

    const car = await Car.create({
      title,
      make,
      model,
      year,
      mileage,
      color,
      transmission,
      images,
      description,
      features,
      condition,
      startingPrice,
      status: 'available'
    });

    res.status(201).json(car);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update car
// @route   PUT /api/cars/:id
// @access  Private/Admin
exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Update only the fields that are provided
    Object.keys(req.body).forEach(key => {
      if (car.schema.paths[key]) {
        car[key] = req.body[key];
      }
    });

    const updatedCar = await car.save();
    res.json(updatedCar);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete car
// @route   DELETE /api/cars/:id
// @access  Private/Admin
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Check if car is in an active auction
    if (car.status === 'in_auction') {
      return res.status(400).json({ message: 'Cannot delete car in active auction' });
    }

    await car.deleteOne();
    res.json({ message: 'Car removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Search cars
// @route   GET /api/cars/search
// @access  Public
exports.searchCars = async (req, res) => {
  try {
    const { query } = req.query;
    const cars = await Car.find({
      $or: [
        { title: new RegExp(query, 'i') },
        { make: new RegExp(query, 'i') },
        { model: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') }
      ]
    });

    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
