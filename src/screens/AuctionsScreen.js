import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { ButtonGroup } from 'react-native-elements';
import CarCard from '../components/CarCard';
import { getMyBids, getMyAuctions } from '../services/api';
import socketService from '../services/socket';



const AuctionsScreen = ({ navigation }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const buttons = ['Active Bids', 'Won', 'Lost'];

  useEffect(() => {
    loadAuctions();
    setupSocketListeners();
    return () => {
      // Cleanup socket listeners
      socketService.removeAllListeners();
    };
  }, [selectedIndex]);

  const setupSocketListeners = () => {
    // Only set up listeners for active bids
    if (selectedIndex === 0) {
      socketService.onNewBid((newBidData) => {
        setAuctions(prevAuctions => 
          prevAuctions.map(auction => 
            auction._id === newBidData.auctionId
              ? { ...auction, currentBid: newBidData.amount }
              : auction
          )
        );
      });

      socketService.onAuctionEnded((endedAuction) => {
        setAuctions(prevAuctions => 
          prevAuctions.filter(auction => auction._id !== endedAuction._id)
        );
      });
    }
  };

  const loadAuctions = async () => {
    try {
      setLoading(true);
      let response;
      const now = new Date();
      
      if (selectedIndex === 0) {
        // Active bids
        response = await getMyBids();
        const bidsData = Array.isArray(response?.data) ? response.data : [];
        
        // Transform bids data into auctions format with null checks
        const auctions = bidsData
          .filter(bid => bid && bid.auction && bid.auction._id) // Filter out invalid bids
          .map(bid => ({
            _id: bid.auction._id,
            car: bid.auction.car,
            endTime: bid.auction.endTime,
            currentBid: bid.auction.currentPrice || 0,
            myBid: bid.amount || 0,
            status: bid.auction.status,
            isHighestBidder: bid.isHighestBidder
          }));
        
        setAuctions(auctions);
      } else {
        // Won or Lost auctions
        response = await getMyAuctions();
        const allAuctions = Array.isArray(response?.data) ? response.data : [];
        
        // Filter based on isWinner property from backend
        const filteredAuctions = allAuctions
          .filter(auction => {
            if (!auction || !auction.car) return false;
            return selectedIndex === 1 ? auction.isWinner : !auction.isWinner;
          })
          .map(auction => ({
            _id: auction._id,
            car: auction.car,
            endTime: auction.endTime,
            currentBid: auction.currentPrice || 0,
            myBid: auction.myBid || 0,
            status: auction.status || 'ended',
            winner: auction.winner
          }));
        
        setAuctions(filteredAuctions);
      }
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAuctions();
  };

  const renderCarCard = ({ item }) => {
    if (!item || !item.car) return null;

    const isActive = selectedIndex === 0;
    const bidInfo = isActive ? (
      <View style={styles.bidInfoContainer}>
        <Text style={styles.bidInfo}>
          Your bid: ${(item.myBid || 0).toLocaleString()}
          {item.isHighestBidder ? ' (Highest)' : ' (Outbid)'}
        </Text>
        <Text style={styles.carName}>
          {item.car.make || ''} {item.car.model || ''} {item.car.year || ''}
        </Text>
      </View>
    ) : (
      <View style={styles.bidInfoContainer}>
        <Text style={styles.bidInfo}>
          Final Price: ${(item.currentBid || 0).toLocaleString()}
        </Text>
        <Text style={styles.carName}>
          {item.car.make || ''} {item.car.model || ''} {item.car.year || ''}
        </Text>
      </View>
    );

    return (
      <View style={styles.cardContainer}>
        <CarCard
          car={item.car}
          auction={item}
          currentBid={item.currentBid || 0}
          endTime={item.endTime}
          onPress={() => navigation.navigate('CarDetail', { 
            carId: item.car._id,
            auctionId: item._id,
            isActive: isActive
          })}
        />
        {bidInfo}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ButtonGroup
        onPress={setSelectedIndex}
        selectedIndex={selectedIndex}
        buttons={buttons}
        containerStyle={styles.buttonGroup}
      />
      <FlatList
        data={auctions}
        renderItem={renderCarCard}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {selectedIndex === 0 ? 'No active bids' :
             selectedIndex === 1 ? 'No auctions won yet' :
             'No lost auctions'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
  },
  bidInfoContainer: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  bidInfo: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  carName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGroup: {
    marginBottom: 16,
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 24,
  },
});

export default AuctionsScreen;
