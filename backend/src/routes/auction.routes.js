const express = require('express');
const router = express.Router();
const Auction = require('../models/auction.model');
const Car = require('../models/car.model');
const { protect, admin } = require('../middleware/auth.middleware');
const mongoose = require('mongoose');

// Validate auction input
const validateAuctionInput = (req, res, next) => {
  const { car, startTime, endTime, startingPrice } = req.body;

  if (!car || !startTime || !endTime || !startingPrice) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (new Date(startTime) >= new Date(endTime)) {
    return res.status(400).json({ message: 'End time must be after start time' });
  }

  if (isNaN(startingPrice) || startingPrice <= 0) {
    return res.status(400).json({ message: 'Invalid starting price' });
  }

  next();
};

// Transform auction data for response
const transformAuctionData = (auction) => {
  if (!auction) return null;
  
  const transformed = auction.toObject();
  
  // Ensure car data is properly transformed
  if (transformed.car) {
    transformed.car = {
      _id: transformed.car._id.toString(),
      make: transformed.car.make,
      model: transformed.car.model,
      year: transformed.car.year,
      mileage: transformed.car.mileage,
      color: transformed.car.color,
      images: transformed.car.images,
      title: transformed.car.title,
      description: transformed.car.description,
      condition: transformed.car.condition,
      transmission: transformed.car.transmission
    };
  }
  
  // Transform ObjectIds to strings
  transformed._id = transformed._id.toString();
  if (transformed.winner) transformed.winner = transformed.winner.toString();
  
  // Transform bids data
  if (transformed.bids) {
    transformed.bids = transformed.bids.map(bid => ({
      _id: bid._id.toString(),
      bidder: bid.bidder ? {
        _id: bid.bidder._id.toString(),
        username: bid.bidder.username,
        email: bid.bidder.email
      } : null,
      amount: bid.amount,
      timestamp: bid.timestamp
    }));
  }
  
  // Calculate current price
  transformed.currentPrice = transformed.bids.length > 0
    ? Math.max(...transformed.bids.map(b => b.amount))
    : transformed.startingPrice;
  
  return transformed;
};

// Get all auctions with filters
router.get('/', async (req, res) => {
  try {
    const {
      status,
      sort = 'startTime',
      order = 'desc',
      limit = 10,
      page = 1
    } = req.query;

    // Build query
    const query = {};

    // Filter by status
    if (status) {
      const now = new Date();
      switch (status) {
        case 'upcoming':
          query.startTime = { $gt: now };
          break;
        case 'active':
          query.startTime = { $lte: now };
          query.endTime = { $gt: now };
          break;
        case 'ended':
          query.endTime = { $lte: now };
          break;
      }
    }

    // Count total documents for pagination
    const total = await Auction.countDocuments(query);

    // Execute query with pagination and sorting
    const auctions = await Auction.find(query)
      .populate({
        path: 'car',
        model: 'Car',
        select: 'make model year images mileage color title'
      })
      .populate('winner', 'username email')
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Transform auction data
    const transformedAuctions = auctions.map(transformAuctionData).filter(Boolean);

    res.json({
      data: transformedAuctions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in GET /auctions:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's bids
router.get('/my-bids', protect, async (req, res) => {
  try {
    const auctions = await Auction.find({
      'bids.bidder': req.user._id,
      endTime: { $gt: new Date() }
    })
    .populate({
      path: 'car',
      select: 'make model year images title mileage color'
    })
    .sort({ endTime: 1 });

    const bids = auctions.map(auction => {
      const userBids = auction.bids.filter(bid => 
        bid.bidder.toString() === req.user._id.toString()
      );
      const highestUserBid = Math.max(...userBids.map(bid => bid.amount));
      
      return {
        auction: {
          _id: auction._id.toString(),
          car: {
            _id: auction.car._id.toString(),
            make: auction.car.make,
            model: auction.car.model,
            year: auction.car.year,
            images: auction.car.images,
            title: auction.car.title,
            mileage: auction.car.mileage,
            color: auction.car.color
          },
          endTime: auction.endTime,
          currentPrice: Math.max(...auction.bids.map(b => b.amount), auction.startingPrice),
          status: auction.status
        },
        amount: highestUserBid,
        isHighestBidder: highestUserBid === Math.max(...auction.bids.map(b => b.amount))
      };
    });

    res.json({ data: bids });
  } catch (error) {
    console.error('Error in GET /auctions/my-bids:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's auctions (won/lost)
router.get('/my-auctions', protect, async (req, res) => {
  try {
    const now = new Date();
    // Find all ended auctions where user has placed bids
    const auctions = await Auction.find({
      'bids.bidder': req.user._id,
      endTime: { $lte: now }
    })
    .populate({
      path: 'car',
      select: 'make model year images title mileage color'
    })
    .sort({ endTime: -1 });

    const processedAuctions = auctions.map(auction => {
      const userBids = auction.bids.filter(bid => 
        bid.bidder.toString() === req.user._id.toString()
      );
      const highestUserBid = Math.max(...userBids.map(bid => bid.amount));
      const highestBid = Math.max(...auction.bids.map(bid => bid.amount));
      const isWinner = highestUserBid === highestBid;

      return {
        _id: auction._id.toString(),
        car: {
          _id: auction.car._id.toString(),
          make: auction.car.make,
          model: auction.car.model,
          year: auction.car.year,
          images: auction.car.images,
          title: auction.car.title,
          mileage: auction.car.mileage,
          color: auction.car.color
        },
        endTime: auction.endTime,
        currentPrice: highestBid,
        status: auction.status,
        myBid: highestUserBid,
        isWinner,
        winner: isWinner ? req.user._id.toString() : auction.bids.find(bid => bid.amount === highestBid)?.bidder.toString()
      };
    });

    res.json({ data: processedAuctions });
  } catch (error) {
    console.error('Error in GET /auctions/my-auctions:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single auction
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate({
        path: 'car',
        model: 'Car',
        select: 'make model year images mileage color title description condition transmission'
      })
      .populate('winner', 'username email')
      .populate('bids.bidder', 'username email');

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Transform the auction data
    const transformedAuction = transformAuctionData(auction);
    
    // Add bidder information to the response
    if (transformedAuction.bids) {
      transformedAuction.bids = transformedAuction.bids.map(bid => ({
        ...bid,
        bidder: bid.bidder ? {
          _id: bid.bidder._id.toString(),
          username: bid.bidder.username,
          email: bid.bidder.email
        } : null
      }));
    }
    
    res.json({ data: transformedAuction });
  } catch (error) {
    console.error('Error in GET /auctions/:id:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create auction (admin only)
router.post('/', protect, admin, validateAuctionInput, async (req, res) => {
  try {
    const auction = await Auction.create(req.body);
    res.status(201).json(auction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update auction (admin only)
router.put('/:id', protect, admin, validateAuctionInput, async (req, res) => {
  try {
    const auction = await Auction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    res.json(auction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete auction (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const auction = await Auction.findByIdAndDelete(req.params.id);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    res.json({ message: 'Auction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Place bid
router.post('/:id/bid', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Check if auction is active
    const now = new Date();
    if (now < auction.startTime) {
      return res.status(400).json({ message: 'Auction has not started yet' });
    }
    if (now > auction.endTime) {
      return res.status(400).json({ message: 'Auction has ended' });
    }

    // Validate bid amount
    const currentHighestBid = auction.bids.length > 0 
      ? Math.max(...auction.bids.map(bid => bid.amount))
      : auction.startingPrice;

    if (amount <= currentHighestBid) {
      return res.status(400).json({ message: 'Bid must be higher than current highest bid' });
    }

    // Add bid
    auction.bids.push({
      bidder: req.user._id,
      amount,
      timestamp: now
    });

    // Update auction
    await auction.save();

    // Populate and transform the response
    await auction.populate([
      {
        path: 'car',
        select: 'make model year images mileage color title description condition transmission'
      },
      {
        path: 'winner',
        select: 'username email'
      },
      {
        path: 'bids.bidder',
        select: 'username email'
      }
    ]);

    const transformedAuction = transformAuctionData(auction);
    res.json({ data: transformedAuction });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
