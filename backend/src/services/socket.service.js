let io;

const initialize = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinAuction', (auctionId) => {
      socket.join(auctionId);
      console.log(`Client ${socket.id} joined auction ${auctionId}`);
    });

    socket.on('leaveAuction', (auctionId) => {
      socket.leave(auctionId);
      console.log(`Client ${socket.id} left auction ${auctionId}`);
    });

    socket.on('placeBid', (data) => {
      io.to(data.auctionId).emit('newBid', {
        auctionId: data.auctionId,
        amount: data.amount,
        bidder: data.bidder
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

const emitNewBid = (bidData) => {
  if (io) {
    io.to(bidData.auctionId).emit('newBid', bidData);
  }
};

const emitAuctionEnded = (auctionData) => {
  if (io) {
    io.to(auctionData.auctionId).emit('auctionEnded', {
      auctionId: auctionData.auctionId,
      winnerId: auctionData.winnerId,
      finalPrice: auctionData.finalPrice
    });
    console.log(`Emitted auction ended event for auction ${auctionData.auctionId}`);
  }
};

module.exports = {
  initialize,
  emitNewBid,
  emitAuctionEnded
}; 