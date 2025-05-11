const Auction = require('../models/auction.model');
const socketService = require('../services/socket.service');

const updateAuctionStatuses = async () => {
  try {
    const now = new Date();

    // Update upcoming to active
    const upcomingToActive = await Auction.updateMany(
      {
        status: 'upcoming',
        startTime: { $lte: now }
      },
      {
        $set: { status: 'active' }
      }
    );

    // Update active to ended
    const activeToEnded = await Auction.updateMany(
      {
        status: 'active',
        endTime: { $lte: now }
      },
      {
        $set: { status: 'ended' }
      }
    );

    // Find newly ended auctions to determine winners
    const newlyEndedAuctions = await Auction.find({
      status: 'ended',
      winner: { $exists: false }
    }).populate('bids.bidder');

    // Process each newly ended auction
    for (const auction of newlyEndedAuctions) {
      if (auction.bids && auction.bids.length > 0) {
        // Sort bids by amount (highest first)
        const sortedBids = auction.bids.sort((a, b) => b.amount - a.amount);
        const winningBid = sortedBids[0];

        // Update auction with winner
        await Auction.findByIdAndUpdate(auction._id, {
          winner: winningBid.bidder._id,
          finalPrice: winningBid.amount
        });

        // Emit socket event for auction end
        socketService.emitAuctionEnded({
          auctionId: auction._id,
          winnerId: winningBid.bidder._id,
          finalPrice: winningBid.amount
        });
      }
    }

    console.log(`Status updates: ${upcomingToActive.modifiedCount} became active, ${activeToEnded.modifiedCount} ended`);
    
    if (newlyEndedAuctions.length > 0) {
      console.log(`Processed winners for ${newlyEndedAuctions.length} newly ended auctions`);
    }

  } catch (error) {
    console.error('Error updating auction statuses:', error);
  }
};

module.exports = updateAuctionStatuses; 