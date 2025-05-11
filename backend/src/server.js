const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const updateAuctionStatuses = require('./utils/auctionStatusUpdater');

// Routes
const authRoutes = require('./routes/auth.routes');
const carRoutes = require('./routes/car.routes');
const auctionRoutes = require('./routes/auction.routes');
const userRoutes = require('./routes/user.routes');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps)
      if (!origin) return callback(null, true);
      
      // Allow if origin is localhost or starts with 127.0.0.1
      if (origin.startsWith('http://localhost:') || 
          origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    // Allow if origin is localhost or starts with 127.0.0.1
    if (origin.startsWith('http://localhost:') || 
        origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const carsUploadsDir = path.join(uploadsDir, 'cars');
const profilesUploadsDir = path.join(uploadsDir, 'profiles');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
  }
  if (!fs.existsSync(carsUploadsDir)) {
    fs.mkdirSync(carsUploadsDir, { recursive: true, mode: 0o755 });
  }
  if (!fs.existsSync(profilesUploadsDir)) {
    fs.mkdirSync(profilesUploadsDir, { recursive: true, mode: 0o755 });
  }
  console.log('Upload directories created successfully');
} catch (error) {
  console.error('Error creating upload directories:', error);
}

// Serve static files from the uploads directory with proper CORS
app.use('/api/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car_auction', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  
  // Initial update
  updateAuctionStatuses();
  
  // Schedule updates every minute
  setInterval(updateAuctionStatuses, 60000);
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle joining auction rooms
  socket.on('join_auction', (auctionId) => {
    const room = `auction_${auctionId}`;
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);
  });

  // Handle leaving auction rooms
  socket.on('leave_auction', (auctionId) => {
    const room = `auction_${auctionId}`;
    socket.leave(room);
    console.log(`Client ${socket.id} left room: ${room}`);
  });

  // Handle new bids
  socket.on('place_bid', async (data) => {
    try {
      const { auctionId, amount } = data;
      const room = `auction_${auctionId}`;
      
      console.log(`New bid in ${room}:`, amount);
      
      // Broadcast the new bid to all clients in the auction room
      io.to(room).emit('new_bid', {
        auctionId,
        amount,
        timestamp: new Date(),
        bidder: socket.id
      });
    } catch (error) {
      console.error('Error handling bid:', error);
      socket.emit('error', { message: 'Failed to process bid' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`Client ${socket.id} disconnected:`, reason);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket ${socket.id} error:`, error);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
