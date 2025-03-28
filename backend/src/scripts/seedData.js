const mongoose = require('mongoose');
const Car = require('../models/car.model');
const Auction = require('../models/auction.model');

const MONGODB_URI = 'mongodb://localhost:27017/car-auction';

const cars = [
  {
    title: '2020 BMW M3 Competition',
    make: 'BMW',
    model: 'M3',
    year: 2020,
    mileage: 15000,
    color: 'Alpine White',
    transmission: 'Automatic',
    images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e'],
    description: 'Pristine condition BMW M3 Competition with full service history',
    features: ['Carbon Fiber Package', 'Premium Sound System', 'Head-up Display'],
    condition: 'Excellent',
    startingPrice: 65000,
    status: 'available'
  },
  {
    title: '2021 Porsche 911 Carrera S',
    make: 'Porsche',
    model: '911',
    year: 2021,
    mileage: 8000,
    color: 'Guards Red',
    transmission: 'Automatic',
    images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70'],
    description: 'Beautiful Porsche 911 Carrera S with Sport Chrono Package',
    features: ['Sport Chrono Package', 'Leather Interior', 'PASM Sport Suspension'],
    condition: 'Excellent',
    startingPrice: 120000,
    status: 'available'
  },
  {
    title: '2019 Mercedes-AMG GT 63 S',
    make: 'Mercedes-Benz',
    model: 'AMG GT',
    year: 2019,
    mileage: 20000,
    color: 'Selenite Grey',
    transmission: 'Automatic',
    images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8'],
    description: 'Powerful AMG GT 63 S with all available options',
    features: ['AMG Dynamic Plus Package', 'Burmester Sound System', 'Carbon Fiber Trim'],
    condition: 'Good',
    startingPrice: 95000,
    status: 'available'
  }
];

const createAuctions = async (cars) => {
  const now = new Date();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;

  const auctions = cars.map((car, index) => ({
    car: car._id,
    startTime: new Date(now.getTime() + (index * oneHour)), // Stagger start times
    endTime: new Date(now.getTime() + oneDay + (index * oneHour)),
    startingPrice: car.startingPrice,
    currentPrice: car.startingPrice,
    status: 'upcoming',
    bids: []
  }));

  return Auction.insertMany(auctions);
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Car.deleteMany({});
    await Auction.deleteMany({});
    console.log('Cleared existing data');

    // Create cars
    const createdCars = await Car.insertMany(cars);
    console.log('Created cars:', createdCars.map(car => car.title));

    // Create auctions
    const createdAuctions = await createAuctions(createdCars);
    console.log('Created auctions:', createdAuctions.length);

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
